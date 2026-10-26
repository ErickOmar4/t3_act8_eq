import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLogistica } from '../context/LogisticaContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { addDays, formatDateLong, todayISO } from '../utils/format.js';
import Icon from '../components/ui/Icon.jsx';
import Modal from '../components/ui/Modal.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import { EmptyState, LoadingState } from '../components/ui/Feedback.jsx';
import RecorridoForm from '../components/recorridos/RecorridoForm.jsx';

// Agenda por día: qué vehículo entrega qué pedidos en la fecha elegida.
export default function RecorridosPage() {
  const { vehiculos, recorridos, pedidosById, addRecorrido, loading } = useLogistica();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formModal, setFormModal] = useState(null); // { vehiculoId? }

  const fecha = searchParams.get('fecha') || todayISO();
  const setFecha = (value) => setSearchParams(value ? { fecha: value } : {});

  const delDia = recorridos.filter((r) => r.fecha === fecha);
  const libres = vehiculos.filter((v) => !delDia.some((r) => r.vehiculoId === v.id));

  const handleCreate = (data, method) => {
    const result = addRecorrido(data);
    if (!result.ok) return result.error;
    notify(method === 'osrm' ? 'Recorrido creado. OSRM ordenó las paradas para recorrer menos distancia.' : 'Recorrido creado. OSRM no respondió, así que las paradas se ordenaron por cercanía en el navegador.', 'success');
    setFormModal(null);
    navigate(`/recorridos/${result.recorrido.id}`);
    return null;
  };

  if (loading && vehiculos.length === 0) return <LoadingState text="Cargando recorridos…" />;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Recorridos por día</h1>
          <p className="text-muted">Cada vehículo tiene un solo recorrido por fecha. Cambia el día para ver o planear otros.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setFormModal({})} disabled={vehiculos.length === 0}>
          <Icon name="plus" size={16} /> Nuevo recorrido
        </button>
      </header>

      <div className="date-nav card">
        <button type="button" className="icon-button" onClick={() => setFecha(addDays(fecha, -1))} aria-label="Día anterior"><Icon name="left" /></button>
        <div className="date-nav-center">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} aria-label="Fecha" />
          <span className="date-nav-label">{formatDateLong(fecha)}</span>
        </div>
        <button type="button" className="icon-button" onClick={() => setFecha(addDays(fecha, 1))} aria-label="Día siguiente"><Icon name="right" /></button>
        {fecha !== todayISO() && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFecha('')}>Ir a hoy</button>}
      </div>

      {vehiculos.length === 0 ? (
        <EmptyState title="Primero registra un vehículo" text="Los recorridos se asignan a un vehículo con su repartidor." action={<Link className="btn btn-primary" to="/vehiculos">Ir a Vehículos</Link>} />
      ) : (
        <>
          <section aria-label="Recorridos del día">
            {delDia.length === 0 ? (
              <div className="card"><p className="text-muted">Ningún vehículo sale este día. Elige un vehículo disponible abajo o usa Nuevo recorrido.</p></div>
            ) : (
              <div className="route-grid">
                {delDia.map((recorrido) => {
                  const vehiculo = vehiculos.find((v) => v.id === recorrido.vehiculoId);
                  const paradas = recorrido.pedidoIds.map((id) => pedidosById.get(id)).filter(Boolean);
                  const entregados = paradas.filter((p) => p.estado === 'entregado').length;
                  const zonas = [...new Set(paradas.map((p) => p.zona))];
                  return (
                    <Link key={recorrido.id} to={`/recorridos/${recorrido.id}`} className="route-card">
                      <div className="route-card-head">
                        <strong>{vehiculo?.tipo} {vehiculo?.placa}</strong>
                        <span className="text-muted">{vehiculo?.repartidor}</span>
                      </div>
                      <ProgressBar value={entregados} max={paradas.length} />
                      <p className="route-card-count"><strong>{entregados}</strong> de {paradas.length} entregados</p>
                      <p className="text-muted route-card-zones">{zonas.length > 0 ? zonas.slice(0, 3).join(', ') + (zonas.length > 3 ? ` y ${zonas.length - 3} más` : '') : 'Sin paradas'}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {libres.length > 0 && (
            <section className="card">
              <h2>Vehículos sin recorrido este día</h2>
              <ul className="list-rows">
                {libres.map((vehiculo) => (
                  <li key={vehiculo.id} className="row-simple">
                    <div className="row-main"><strong>{vehiculo.tipo} {vehiculo.placa}</strong><span className="text-muted">{vehiculo.repartidor} · hasta {vehiculo.capacidad} paquetes</span></div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFormModal({ vehiculoId: vehiculo.id })}>Planear entregas</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {formModal && (
        <Modal title="Nuevo recorrido" size="lg" onClose={() => setFormModal(null)}>
          <RecorridoForm defaultFecha={fecha} defaultVehiculoId={formModal.vehiculoId} onSubmit={handleCreate} onCancel={() => setFormModal(null)} />
        </Modal>
      )}
    </div>
  );
}
