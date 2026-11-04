// Лоадер и сообщение об ошибке. Они общие для обоих этапов, поэтому вынесены отдельно.

// role="status" сообщает о загрузке программам чтения с экрана.
export function Loader({ text }) {
  return (
    <div className="d-flex align-items-center gap-2 my-3" role="status">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

// Кнопка «Повторить» нужна потому, что сбои сети обычно временные.
export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center gap-3" role="alert">
      <span>{message}</span>
      <button type="button" className="btn btn-outline-danger btn-sm flex-shrink-0" onClick={onRetry}>
        Повторить
      </button>
    </div>
  );
}
