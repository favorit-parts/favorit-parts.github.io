import { useSelector } from 'react-redux';
import BrandList from './components/BrandList.jsx';
import OffersTable from './components/OffersTable.jsx';
import SearchForm from './components/SearchForm.jsx';

// Страница целиком: поле ввода, этап 1 (производители) и этап 2 (таблица).
export default function App() {
  const selectedPart = useSelector((state) => state.search.selectedPart);

  return (
    <main className="container py-4">
      <h1 className="h3 mb-4">Поиск автозапчастей и аналогов</h1>
      <SearchForm />
      <BrandList />
      {/* key пересоздаёт таблицу при выборе другой детали. Так счётчик
          «Показать ещё» и раскрытые склады сбрасываются сами. */}
      {selectedPart && <OffersTable key={selectedPart.id} />}
    </main>
  );
}
