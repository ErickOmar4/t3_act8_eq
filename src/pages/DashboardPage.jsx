import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogistica } from '../context/LogisticaContext.jsx';
import { ESTADOS } from '../config/constants.js';
import { formatDateLong, todayISO } from '../utils/format.js';
import { LoadingState } from '../components/ui/Feedback.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import WorkspaceCard from '../components/ui/WorkspaceCard.jsx';

export default function DashboardPage() {
  const { pedidos, loading, recorridos, vehiculosById, pedidosById, asignaciones, resetDemoData } = useLogistica();
  const [confirmReset, setConfirmReset] = useState(false);
  const today = todayISO();

  if (loading && pedidos.length === 0) return <LoadingState text="Cargando pedidos…" />;

  const count = (estado) => pedidos.filter((p) => p.estado === estado).length;
  const sinAsignar = pedidos.filter((p) => !asignaciones.has(p.id) && p.estado === 'pendiente').length;
  const recorridosHoy = recorridos.filter((r) => r.fecha === today);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Panel general</h1>
          <p className="text-muted">Resumen de la operación al {formatDateLong(today)}.</p>
        </div>
        <Link to={`/recorridos?fecha=${today}`} className="btn btn-primary">Ver recorridos de hoy</Link>
      </header>

      <section className="kpi-grid" aria-label="Indicadores">
        <article className="kpi kpi-focus">
          <p>Pedidos sin asignar</p>
          <strong>{sinAsignar}</strong>
          <Link to="/recorridos">Planear un recorrido</Link>
        </article>
        <article className="kpi"><p>En camino</p><strong>{count('en_camino')}</strong></article>
        <article className="kpi"><p>Entregados</p><strong>{count('entregado')}</strong></article>
        <article className="kpi"><p>No entregados</p><strong>{count('no_entregado')}</strong></article>
      </section>

      <section className="card">
        <h2>Recorridos de hoy</h2>
        {recorridosHoy.length === 0 ? (
          <p className="text-muted">No hay recorridos planeados para hoy. Crea uno desde Recorridos por día.</p>
        ) : (
          <ul className="list-rows">
            {recorridosHoy.map((recorrido) => {
              const vehiculo = vehiculosById.get(recorrido.vehiculoId);
              const total = recorrido.pedidoIds.length;
              const entregados = recorrido.pedidoIds.filter((id) => pedidosById.get(id)?.estado === 'entregado').length;
              return (
                <li key={recorrido.id}>
                  <Link to={`/recorridos/${recorrido.id}`} className="row-link">
                    <div className="row-main">
                      <strong>{vehiculo?.tipo} {vehiculo?.placa}</strong>
                      <span className="text-muted">{vehiculo?.repartidor}</span>
                    </div>
                    <div className="row-progress">
                      <ProgressBar value={entregados} max={total} />
                      <small>{entregados} de {total} entregados</small>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Pedidos por estado</h2>
        <div className="stack-bar" role="img" aria-label="Distribución de pedidos por estado">
          {Object.entries(ESTADOS).map(([key, info]) => {
            const n = count(key);
            return n > 0 ? <span key={key} className={`stack-segment tone-${info.tone}`} style={{ flexGrow: n }} title={`${info.label}: ${n}`} /> : null;
          })}
        </div>
        <ul className="legend">
          {Object.entries(ESTADOS).map(([key, info]) => (
            <li key={key}><span className={`dot tone-${info.tone}`} /> {info.label}: <strong>{count(key)}</strong></li>
          ))}
        </ul>
      </section>

      <WorkspaceCard />

      <p className="page-footnote">
        DummyJSON no conserva las escrituras; por eso vehículos, recorridos y cambios se guardan en JSONBlob (o en este navegador).{' '}
        <button type="button" className="link-button" onClick={() => setConfirmReset(true)}>Restablecer datos de demostración</button>
      </p>

      {confirmReset && (
        <ConfirmDialog
          title="Restablecer datos"
          message="Se borrará la copia guardada en este navegador y se desconectará el documento de JSONBlob (el documento en línea no se elimina). ¿Quieres continuar?"
          confirmLabel="Restablecer"
          danger
          onConfirm={resetDemoData}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
