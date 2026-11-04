import { Fragment, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadOffers } from '../store.js';
import { ErrorMessage, Loader } from './Status.jsx';

// У детали бывает больше 700 аналогов. Показываем частями, чтобы страница не тормозила.
const PAGE_SIZE = 50;

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });
// API отдаёт время с поясом +03:00. Фиксируем Москву, чтобы время заказа
// не менялось в зависимости от часового пояса пользователя.
const shipment = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Europe/Moscow',
});

// Предложения одной детали по складам.
function WarehouseTable({ warehouses }) {
  return (
    <table className="table table-sm mb-0">
      <thead>
        <tr>
          <th>Склад</th>
          <th className="text-end">Цена</th>
          <th className="text-end">Остаток</th>
          <th className="text-end">Отгрузка (заказать до указанного времени, МСК)</th>
        </tr>
      </thead>
      <tbody>
        {warehouses.map((warehouse) => (
          <tr key={warehouse.id}>
            {/* По документации сокращённое название есть не у всех складов. */}
            <td>{warehouse.code || 'Без названия'}</td>
            <td className="text-end">{money.format(warehouse.price)}</td>
            <td className="text-end">{warehouse.stock}</td>
            <td className="text-end">{shipment.format(new Date(warehouse.shipmentDate))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Строка таблицы. Раскрытие хранится локально: оно нужно только этой строке, Redux здесь лишний.
function PartRow({ part }) {
  const [isOpen, setIsOpen] = useState(false);
  const offersCount = part.warehouses.length;

  return (
    <Fragment>
      <tr className={part.isRequested ? 'table-primary' : undefined}>
        <td>
          {part.brand}
          {part.isRequested && <span className="badge text-bg-primary ms-2">Искомая</span>}
        </td>
        <td>{part.number}</td>
        <td>{part.name}</td>
        <td className="text-end text-nowrap">
          {/* Прочерк значит, что предложений нет. Устаревшее поле price документация брать запрещает. */}
          {part.minPrice === null ? (
            '-'
          ) : (
            <>
              {offersCount > 1 && 'от '}
              {money.format(part.minPrice)}
            </>
          )}
        </td>
        <td className="text-end">{part.stock}</td>
        <td className="text-end text-nowrap">
          {offersCount > 0 && (
            <button
              type="button"
              className="btn btn-link btn-sm p-0"
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? 'Скрыть' : `Склады: ${offersCount}`}
            </button>
          )}
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={6} className="bg-body-tertiary">
            <WarehouseTable warehouses={part.warehouses} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

// Этап 2: таблица с искомой деталью и аналогами.
export default function OffersTable() {
  const dispatch = useDispatch();
  const { selectedPart, offers } = useSelector((state) => state.search);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (offers.status === 'loading') return <Loader text="Загружаем аналоги и предложения..." />;
  if (offers.status === 'failed') {
    return (
      <ErrorMessage message={offers.error} onRetry={() => dispatch(loadOffers(selectedPart))} />
    );
  }
  if (offers.items.length === 0) {
    return <div className="alert alert-secondary">Предложений не найдено.</div>;
  }

  const analoguesCount = offers.items.filter((part) => !part.isRequested).length;

  return (
    <section>
      <h2 className="h5">
        {selectedPart.brand} {selectedPart.number}: аналогов {analoguesCount}
      </h2>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Производитель</th>
              <th>Артикул</th>
              <th>Название</th>
              <th className="text-end">Цена</th>
              <th className="text-end">Остаток</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {offers.items.slice(0, visibleCount).map((part) => (
              <PartRow key={part.id} part={part} />
            ))}
          </tbody>
        </table>
      </div>
      {visibleCount < offers.items.length && (
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => setVisibleCount(visibleCount + PAGE_SIZE)}
        >
          Показать ещё ({offers.items.length - visibleCount})
        </button>
      )}
    </section>
  );
}
