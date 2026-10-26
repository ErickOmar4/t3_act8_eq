import { useMemo, useState } from 'react';
import Icon from '../ui/Icon.jsx';

// Lista con casillas para elegir pedidos sin asignar.
export default function PedidoPicker({ pedidos, selectedIds, onChange }) {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return pedidos;
    return pedidos.filter((p) => `${p.id} ${p.cliente} ${p.zona} ${p.direccion}`.toLowerCase().includes(text));
  }, [pedidos, query]);

  const toggle = (id) => onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  return (
    <div className="picker">
      <div className="search-box">
        <Icon name="search" size={16} />
        <input type="search" placeholder="Buscar por cliente, zona o folio" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar pedidos" />
      </div>
      <ul className="picker-list">
        {visible.length === 0 && <li className="picker-empty">No hay pedidos sin asignar que coincidan.</li>}
        {visible.map((pedido) => (
          <li key={pedido.id}>
            <label className="picker-item">
              <input type="checkbox" checked={selectedIds.includes(pedido.id)} onChange={() => toggle(pedido.id)} />
              <span className="picker-main">
                <strong>#{pedido.id} · {pedido.cliente}</strong>
                <small>{pedido.direccion}, {pedido.zona}</small>
              </span>
              <small>{pedido.articulos} art.</small>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
