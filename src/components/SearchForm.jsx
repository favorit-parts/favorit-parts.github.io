import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { loadBrands, resetSearch } from '../store.js';

// Короткие запросы возвращают много случайных совпадений и тратят лимит API.
const MIN_LENGTH = 3;
// Ждём паузу в наборе, чтобы не отправлять запрос на каждую букву.
const DEBOUNCE_MS = 500;

// Поле ввода артикула. Текст хранится локально: остальному приложению
// важен только артикул, по которому реально начался поиск.
export default function SearchForm() {
  const dispatch = useDispatch();
  const [value, setValue] = useState('');
  const number = value.trim();

  useEffect(() => {
    if (number.length < MIN_LENGTH) {
      dispatch(resetSearch());
      return undefined;
    }
    // Новый символ очищает предыдущий таймер, поэтому запрос уходит только после паузы.
    const timer = setTimeout(() => dispatch(loadBrands(number)), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [dispatch, number]);

  return (
    <div className="mb-4">
      <label htmlFor="part-number" className="form-label">
        Артикул детали
      </label>
      <input
        id="part-number"
        type="search"
        className="form-control"
        placeholder="Например, 7160500039S"
        autoComplete="off"
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="form-text">Поиск начнётся, когда вы введёте от {MIN_LENGTH} символов.</div>
    </div>
  );
}
