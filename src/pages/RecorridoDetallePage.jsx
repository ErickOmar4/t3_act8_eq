import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLogistica } from '../context/LogisticaContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { DEPOSITO, ESTADOS } from '../config/constants.js';
import { optimizeStops } from '../services/routingService.js';
import { formatDateLong } from '../utils/format.js';
import Icon from '../components/ui/Icon.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { EmptyState, LoadingState } from '../components/ui/Feedback.jsx';
import PedidoPicker from '../components/pedidos/PedidoPicker.jsx';
import RutaMapa from '../components/recorridos/RutaMapa.jsx';

// Detalle de un recorrido: lista de paradas, cambio de estado y mapa.
export default function RecorridoDetallePage() {
  const { recorridoId } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { recorridos, vehiculosById, pedidos, pedidosById, asignaciones, loading, setEstadoPedido, updateRecorrido, removeRecorrido } = useLogistica();

  const [mapOpen, setMapOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newIds, setNewIds] = useState([]);
  const [addError, setAddError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const recorrido = recorridos.find((r) => r.id === recorridoId);
  const vehiculo = recorrido ? vehiculosById.get(recorrido.vehiculoId) : null;
  const paradas = useMemo(
    () => (recorrido ? recorrido.pedidoIds.map((id) => pedidosById.get(id)).filter(Boolean) : []),
    [recorrido, pedidosById],
  );
  const disponibles = useMemo(() => pedidos.filter((p) => !asignaciones.has(p.id) && p.estado === 'pendiente'), [pedidos, asignaciones]);

  if (!recorrido && loading) return <LoadingState text="Cargando recorrido…" />;
  if (!recorrido) {
    return <EmptyState title="Este recorrido no existe" text="Pudo haberse eliminado." action={<Link className="btn btn-primary" to="/recorridos">Volver a recorridos</Link>} />;
  }

  const entregados = paradas.filter((p) => p.estado === 'entregado').length;
  const pendientes = paradas.filter((p) => p.estado === 'pendiente').length;
  const saveOrder = (orderedParadas) => updateRecorrido(recorrido.id, { pedidoIds: orderedParadas.map((p) => p.id) });

  const moveStop = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= paradas.length) return;
    const next = [...paradas];
    [next[index], next[target]] = [next[target], next[index]];
    saveOrder(next);
  };

  const removeStop = (pedido) => {
    updateRecorrido(recorrido.id, { pedidoIds: recorrido.pedidoIds.filter((id) => id !== pedido.id) });
    // Si no se entregó, el pedido vuelve a estar pendiente para poder reasignarlo.
    if (pedido.estado !== 'entregado') setEstadoPedido(pedido.id, 'pendiente');
    notify(`El pedido #${pedido.id} salió del recorrido.`, 'info');
  };

  // El orden lo calcula la API de OSRM; las paradas ya entregadas se quedan al inicio.
  const optimizeRoute = async () => {
    const done = paradas.filter((p) => p.estado === 'entregado');
    const rest = paradas.filter((p) => p.estado !== 'entregado');
    const origin = done.length > 0 ? done[done.length - 1] : DEPOSITO;
    setOptimizing(true);
    const { ordered, method } = await optimizeStops(origin, rest);
    saveOrder([...done, ...ordered]);
    setOptimizing(false);
    notify(method === 'osrm' ? 'Paradas reordenadas con OSRM para recorrer menos distancia.' : 'OSRM no respondió: se reordenó por cercanía en el navegador.', 'success');
  };

  const startRoute = () => {
    paradas.filter((p) => p.estado === 'pendiente').forEach((p) => setEstadoPedido(p.id, 'en_camino'));
    notify('Recorrido iniciado: las paradas pendientes pasaron a En camino.', 'success');
  };

  const handleAddPedidos = () => {
    if (newIds.length === 0) return setAddError('Elige al menos un pedido.');
    if (paradas.length + newIds.length > vehiculo.capacidad) {
      return setAddError(`Con esos pedidos pasarías la capacidad del vehículo (${vehiculo.capacidad} paquetes).`);
    }
    updateRecorrido(recorrido.id, { pedidoIds: [...recorrido.pedidoIds, ...newIds] });
    notify(`${newIds.length} pedido(s) agregados al recorrido.`, 'success');
    setNewIds([]);
    setAddError('');
    setAddOpen(false);
  };

  const handleDelete = () => {
    removeRecorrido(recorrido.id);
    notify('Recorrido eliminado.', 'success');
    navigate(`/recorridos?fecha=${recorrido.fecha}`);
  };

  return (
    <div className="page">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link to={`/recorridos?fecha=${recorrido.fecha}`}>Recorridos por día</Link>
        <span aria-hidden="true">/</span>
        <span>{vehiculo?.tipo} {vehiculo?.placa}</span>
      </nav>

      <header className="page-header">
        <div>
          <h1>{vehiculo ? `${vehiculo.tipo} ${vehiculo.placa}` : 'Vehículo eliminado'}</h1>
          <p className="text-muted">{vehiculo?.repartidor} · {formatDateLong(recorrido.fecha)}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setMapOpen(true)}>
          <Icon name="map" size={16} /> Abrir mapa de Oaxaca
        </button>
      </header>

      <section className="card summary-card">
        <div className="summary-stats">
          <div><strong>{entregados}</strong><span>entregados</span></div>
          <div><strong>{pendientes}</strong><span>pendientes</span></div>
          <div><strong>{paradas.length}{vehiculo ? ` / ${vehiculo.capacidad}` : ''}</strong><span>paquetes</span></div>
        </div>
        <ProgressBar value={entregados} max={paradas.length} />
        <div className="summary-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={startRoute} disabled={pendientes === 0}><Icon name="play" size={14} /> Iniciar recorrido</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={optimizeRoute} disabled={paradas.length < 2 || optimizing}><Icon name="navigation" size={14} /> {optimizing ? 'Calculando…' : 'Optimizar orden'}</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAddOpen(true)}><Icon name="plus" size={14} /> Agregar pedidos</button>
          <button type="button" className="btn btn-ghost btn-sm text-danger-btn" onClick={() => setConfirmDelete(true)}><Icon name="trash" size={14} /> Eliminar recorrido</button>
        </div>
      </section>

      <section className="card card-flush" aria-label="Paradas del recorrido">
        {paradas.length === 0 ? (
          <EmptyState title="Este recorrido no tiene paradas" text="Agrega pedidos sin asignar para planear la entrega." />
        ) : (
          <ol className="stops">
            {paradas.map((pedido, index) => (
              <li key={pedido.id} className={`stop ${pedido.estado === 'entregado' ? 'is-done' : ''}`}>
                <span className={`stop-number tone-${ESTADOS[pedido.estado]?.tone}`}>{index + 1}</span>
                <div className="stop-info">
                  <strong>{pedido.cliente} <small>#{pedido.id}</small></strong>
                  <span>{pedido.direccion}, {pedido.zona}</span>
                  <small>{pedido.articulos} artículos{pedido.telefono ? ` · ${pedido.telefono}` : ''}{pedido.notas ? ` · ${pedido.notas}` : ''}</small>
                </div>
                <div className="stop-status">
                  <StatusBadge estado={pedido.estado} />
                  <select value={pedido.estado} onChange={(e) => setEstadoPedido(pedido.id, e.target.value)} aria-label={`Cambiar estado del pedido ${pedido.id}`}>
                    {Object.entries(ESTADOS).map(([key, info]) => (<option key={key} value={key}>{info.label}</option>))}
                  </select>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setEstadoPedido(pedido.id, 'entregado')} disabled={pedido.estado === 'entregado'}>
                    <Icon name="check" size={14} /> Entregado
                  </button>
                </div>
                <div className="stop-tools">
                  <button type="button" className="icon-button" onClick={() => moveStop(index, -1)} disabled={index === 0} aria-label="Subir parada"><Icon name="up" size={16} /></button>
                  <button type="button" className="icon-button" onClick={() => moveStop(index, 1)} disabled={index === paradas.length - 1} aria-label="Bajar parada"><Icon name="down" size={16} /></button>
                  <button type="button" className="icon-button icon-danger" onClick={() => removeStop(pedido)} aria-label="Quitar del recorrido" title="Quitar del recorrido"><Icon name="x" size={16} /></button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {mapOpen && (
        <Modal title={`Ruta de ${vehiculo?.tipo ?? 'vehículo'} · ${formatDateLong(recorrido.fecha)}`} size="xl" onClose={() => setMapOpen(false)}>
          <RutaMapa paradas={paradas} />
        </Modal>
      )}

      {addOpen && (
        <Modal title="Agregar pedidos al recorrido" size="lg" onClose={() => setAddOpen(false)}>
          <PedidoPicker pedidos={disponibles} selectedIds={newIds} onChange={(ids) => { setNewIds(ids); setAddError(''); }} />
          {addError && <p className="form-error" role="alert">{addError}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={handleAddPedidos}>Agregar {newIds.length > 0 ? `(${newIds.length})` : ''}</button>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar recorrido"
          message="Se eliminará el recorrido y sus pedidos quedarán libres para asignarlos a otro vehículo. Los estados de entrega no se modifican."
          confirmLabel="Sí, eliminar"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
