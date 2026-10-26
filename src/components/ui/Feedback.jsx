import Icon from './Icon.jsx';

export function LoadingState({ text = 'Cargando…' }) {
  return (
    <div className="state-box" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-box state-error" role="alert">
      <Icon name="alert" size={28} />
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          <Icon name="refresh" size={16} /> Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="state-box">
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
