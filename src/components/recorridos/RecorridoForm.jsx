import { useMemo, useState } from 'react';
import { useLogistica } from '../../context/LogisticaContext.jsx';
import { DEPOSITO } from '../../config/constants.js';
import { optimizeStops } from '../../services/routingService.js';
import PedidoPicker from '../pedidos/PedidoPicker.jsx';

// Crea el plan de entregas de un vehículo para una fecha.
export default function RecorridoForm({ defaultFecha, defaultVehiculoId, onSubmit, onCancel }) {
  const { vehiculos, pedidos, asignaciones } = useLogistica();
  const [vehiculoId, setVehiculoId] = useState(defaultVehiculoId ?? vehiculos[0]?.id ?? '');
  const [fecha, setFecha] = useState(defaultFecha);
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const disponibles = useMemo(() => pedidos.filter((p) => !asignaciones.has(p.id) && p.estado === 'pendiente'), [pedidos, asignaciones]);
  const vehiculo = vehiculos.find((v) => v.id === vehiculoId);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!vehiculo) return setSubmitError('Primero registra un vehículo en la sección Vehículos.');
    if (!fecha) return setSubmitError('Elige la fecha del recorrido.');
    if (selectedIds.length === 0) return setSubmitError('Elige al menos un pedido para entregar.');
    if (selectedIds.length > vehiculo.capacidad) return setSubmitError(`Elegiste ${selectedIds.length} pedidos y el vehículo solo lleva ${vehiculo.capacidad}.`);

    // El orden lo calcula la API de OSRM (servicio /trip) saliendo del centro de distribución.
    setSubmitting(true);
    const chosen = disponibles.filter((p) => selectedIds.includes(p.id));
    const { ordered, method } = await optimizeStops(DEPOSITO, chosen);
    const error = onSubmit({ vehiculoId, fecha, pedidoIds: ordered.map((p) => p.id) }, method);
    setSubmitting(false);
    if (error) setSubmitError(error);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="form-stack">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="vehiculo">Vehículo</label>
          <select id="vehiculo" value={vehiculoId} onChange={(e) => { setVehiculoId(e.target.value); setSubmitError(''); }}>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.id}>{v.tipo} {v.placa} · {v.repartidor}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="fecha">Fecha de entrega</label>
          <input id="fecha" type="date" value={fecha} onChange={(e) => { setFecha(e.target.value); setSubmitError(''); }} />
        </div>
      </div>
      <div>
        <p className="picker-title">
          Pedidos por entregar
          <span className={vehiculo && selectedIds.length > vehiculo.capacidad ? 'text-danger' : 'text-muted'}>
            {selectedIds.length} elegidos{vehiculo ? ` de ${vehiculo.capacidad} posibles` : ''}
          </span>
        </p>
        <PedidoPicker pedidos={disponibles} selectedIds={selectedIds} onChange={(ids) => { setSelectedIds(ids); setSubmitError(''); }} />
      </div>
      {submitError && <p className="form-error" role="alert">{submitError}</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Calculando la mejor ruta…' : 'Crear recorrido'}</button>
      </div>
    </form>
  );
}
