// Всё общение с API собрано здесь. Компоненты и Redux получают готовые данные
// или ошибку с понятным текстом и не знают об особенностях ответов сервера.

// Используем https: страница, открытая по https, не сможет обратиться к http-адресу из документации.
const BASE_URL = 'https://api.favorit-parts.ru/hs/hsprice/';
// Ключ хранится в .env, а не в коде, чтобы его можно было заменить без правок.
const API_KEY = import.meta.env.VITE_FAVORIT_API_KEY;
// Без ограничения по времени при зависшем сервере лоадер крутился бы бесконечно.
const TIMEOUT_MS = 20000;

// Фрагмент текста ошибки API и сообщение для пользователя.
// Ищем по фрагменту, потому что реальный текст отличается от документации:
// сервер отвечает "Invalid access key", а в документации указано "Invalid key client!".
const KNOWN_ERRORS = [
  ['Empty key', 'Не указан ключ API.'],
  ['Invalid', 'Неверный ключ API.'],
  ['Empty number', 'Не указан артикул.'],
  ['quota', 'Превышен лимит запросов. Попробуйте позже.'],
];

function translateApiError(error) {
  // String нужен на случай, если в поле error придёт не строка: по документации ошибок может быть несколько.
  const text = String(error);
  const known = KNOWN_ERRORS.find(([marker]) => text.includes(marker));
  return known ? known[1] : `Ошибка API: ${text}`;
}

// Общий запрос к API: возвращает массив товаров или выбрасывает Error с текстом для пользователя.
async function request(params) {
  if (!API_KEY) {
    throw new Error('Не задан ключ API. Добавьте VITE_FAVORIT_API_KEY в файл .env.');
  }

  // encodeURIComponent нужен для брендов вроде "Meat & Doria" и "NGK/NTK":
  // без кодирования символ & разорвал бы параметр brand на две части.
  const query = Object.entries({ key: API_KEY, ...params })
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join('&');

  let response;
  try {
    response = await fetch(`${BASE_URL}?${query}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    // Сюда попадаем, только если ответа нет совсем: сбой сети или истёк таймаут.
    throw new Error(
      error.name === 'TimeoutError'
        ? 'Сервер долго не отвечает. Попробуйте ещё раз.'
        : 'Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз.',
    );
  }

  // API присылает ошибку и с кодом 200, и с кодом 403, поэтому сначала читаем тело ответа.
  // catch нужен на случай, если придёт не JSON, например HTML-страница ошибки от прокси.
  const data = await response.json().catch(() => null);
  if (data?.error) throw new Error(translateApiError(data.error));
  if (!response.ok || !data) {
    throw new Error('Сервер вернул некорректный ответ. Попробуйте ещё раз.');
  }

  // Если деталь не найдена, API возвращает один элемент с пустыми полями.
  // Отбрасываем его, чтобы интерфейс показал «ничего не найдено», а не пустую строку.
  return (data.goods ?? []).filter((item) => item.brand);
}

// Приводит товар из ответа API к виду, удобному для интерфейса.
function toPart(item) {
  // Поле price у товара устарело по документации, цену берём из складов.
  const warehouses = (item.warehouses ?? []).map((warehouse) => ({
    id: warehouse.id,
    code: warehouse.code,
    price: warehouse.price,
    stock: warehouse.stock,
    shipmentDate: warehouse.shipmentDate,
  }));
  // null значит, что предложений нет. Интерфейс покажет прочерк вместо цены.
  const minPrice = warehouses.length
    ? Math.min(...warehouses.map((warehouse) => warehouse.price))
    : null;

  return {
    id: item.goodsID,
    brand: item.brand,
    number: item.number,
    name: item.name,
    stock: item.count,
    minPrice,
    warehouses: [...warehouses].sort((a, b) => a.price - b.price),
  };
}

// Сортировка от дешёвых к дорогим. Позиции без цены уходят в конец.
function byPrice(a, b) {
  if (a.minPrice === null) return b.minPrice === null ? 0 : 1;
  if (b.minPrice === null) return -1;
  return a.minPrice - b.minPrice;
}

// Этап 1: запрос только по номеру возвращает все детали с этим номером у разных производителей.
export async function fetchParts(number) {
  const goods = await request({ number });
  return goods.map(toPart);
}

// Этап 2: запрос с номером, брендом и analogues=on возвращает деталь и её аналоги.
export async function fetchPartWithAnalogues({ number, brand }) {
  const goods = await request({ number, brand, analogues: 'on' });
  const requested = goods.map((item) => ({ ...toPart(item), isRequested: true }));
  const seen = new Set(requested.map((part) => part.id));

  // Аналоги лежат внутри товара, разворачиваем их в один список.
  // Повторы убираем, потому что id используется как key строки в React.
  // seen.add возвращает сам Set, то есть истину, поэтому новый id проходит фильтр.
  const analogues = goods
    .flatMap((item) => item.analogues ?? [])
    .map(toPart)
    .filter((part) => !seen.has(part.id) && seen.add(part.id))
    .sort(byPrice);

  return [...requested, ...analogues];
}
