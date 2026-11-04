// Точка входа: подключаем стили Bootstrap и отдаём приложению Redux-хранилище.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App.jsx';
import { store } from './store.js';

createRoot(document.getElementById('root')).render(
  // StrictMode в режиме разработки запускает эффекты дважды и помогает заметить ошибки в них.
  <React.StrictMode>
    {/* Provider делает хранилище доступным всем компонентам через useSelector и useDispatch. */}
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
