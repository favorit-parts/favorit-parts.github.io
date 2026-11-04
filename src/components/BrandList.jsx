import { useDispatch, useSelector } from 'react-redux';
import { loadBrands, loadOffers } from '../store.js';
import { ErrorMessage, Loader } from './Status.jsx';

// Этап 1: список производителей с выбором.
export default function BrandList() {
  const dispatch = useDispatch();
  const { query, selectedPart, brands } = useSelector((state) => state.search);

  // Каждому состоянию запроса соответствует свой экран.
  if (brands.status === 'idle') return null;
  if (brands.status === 'loading') return <Loader text="Ищем производителей..." />;
  if (brands.status === 'failed') {
    return <ErrorMessage message={brands.error} onRetry={() => dispatch(loadBrands(query))} />;
  }
  if (brands.items.length === 0) {
    return <div className="alert alert-secondary">По артикулу «{query}» ничего не найдено.</div>;
  }

  return (
    <section className="mb-4">
      <h2 className="h5">Выберите производителя</h2>
      <div className="list-group">
        {/* Показываем и номер: API находит похожие артикулы, например 01-89 по запросу 0189. */}
        {brands.items.map((part) => (
          <button
            key={part.id}
            type="button"
            className={`list-group-item list-group-item-action ${
              selectedPart?.id === part.id ? 'active' : ''
            }`}
            aria-pressed={selectedPart?.id === part.id}
            // Передаём деталь целиком: на этапе 2 нужен её точный номер из ответа, а не введённый.
            onClick={() => dispatch(loadOffers(part))}
          >
            <strong>{part.brand}</strong> {part.number}
            <div className="small">{part.name}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
