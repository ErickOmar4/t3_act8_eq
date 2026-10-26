import Icon from './Icon.jsx';
import { LIMIT_OPTIONS } from '../../config/constants.js';

// Controles de paginación + selector de registros por página.
export default function Pagination({ page, totalPages, limit, totalItems, onPageChange, onLimitChange }) {
  const first = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, totalItems);

  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = [];
  for (let n = start; n <= end; n += 1) pages.push(n);

  return (
    <div className="pagination">
      <p className="pagination-info">
        Mostrando {first}–{last} de {totalItems}
      </p>
      <div className="pagination-controls">
        <label className="pagination-limit">
          Por página
          <select value={limit} onChange={(event) => onLimitChange(Number(event.target.value))}>
            {LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="icon-button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Página anterior">
          <Icon name="left" />
        </button>
        {pages.map((n) => (
          <button
            key={n}
            type="button"
            className={`page-button ${n === page ? 'is-active' : ''}`}
            onClick={() => onPageChange(n)}
            aria-current={n === page ? 'page' : undefined}
          >
            {n}
          </button>
        ))}
        <button type="button" className="icon-button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Página siguiente">
          <Icon name="right" />
        </button>
      </div>
    </div>
  );
}
