import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogistica } from '../context/LogisticaContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDateShort, todayISO } from '../utils/format.js';
import Icon from '../components/ui/Icon.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { EmptyState, LoadingState } from '../components/ui/Feedback.jsx';
import VehiculoForm from '../components/vehiculos/VehiculoForm.jsx';

export default function VehiculosPage() {
  const { vehiculos, recorridos, addVehiculo, updateVehiculo, removeVehiculo, loading } = useLogistica();
  const { notify } = useToast();
  const [formModal, setFormModal] = useState(null); // { vehiculo? }
  const [pendingDelete, setPendingDelete] = useState(null);
  const today = todayISO();

  if (loading && vehiculos.length === 0) return <LoadingState text="Cargando vehículos…" />;

  const recorridosDe = (vehiculoId) =>
    recorridos.filter((r) => r.vehiculoId === vehiculoId && r.fecha >= today).sort((a, b) => a.fecha.localeCompare(b.fecha));

  const handleSubmit = (values) => {
    if (formModal.vehiculo) {
      updateVehiculo(formModal.vehiculo.id, values);
      notify('Vehículo actualizado.', 'success');
    } else {
      addVehiculo(values);
      notify('Vehículo registrado.', 'success');
    }
    setFormModal(null);
  };

  const handleDelete = () => {
    removeVehiculo(pendingDelete.id);
    notify(`Se eliminó ${pendingDelete.tipo} ${pendingDelete.placa}.`, 'success');
    setPendingDelete(null);
  };

  const otherPlacas = (current) => vehiculos.filter((v) => v.id !== current?.id).map((v) => v.placa);
  const deleteCount = pendingDelete ? recorridos.filter((r) => r.vehiculoId === pendingDelete.id).length : 0;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Vehículos y repartidores</h1>
          <p className="text-muted">Registra cada vehículo con su repartidor. Después podrás darle un recorrido distinto cada día.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setFormModal({})}>
          <Icon name="plus" size={16} /> Registrar vehículo
        </button>
      </header>

      <section className="card card-flush">
        {vehiculos.length === 0 ? (
          <EmptyState title="Aún no hay vehículos" text="Registra el primero para empezar a planear entregas." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Vehículo</th><th>Repartidor</th><th>Teléfono</th><th className="num">Capacidad</th><th>Próximos recorridos</th><th><span className="sr-only">Acciones</span></th></tr>
              </thead>
              <tbody>
                {vehiculos.map((vehiculo) => {
                  const proximos = recorridosDe(vehiculo.id);
                  return (
                    <tr key={vehiculo.id}>
                      <td><strong>{vehiculo.tipo}</strong><small>{vehiculo.placa}</small></td>
                      <td>{vehiculo.repartidor}</td>
                      <td>{vehiculo.telefono || <span className="text-muted">Sin teléfono</span>}</td>
                      <td className="num">{vehiculo.capacidad} paquetes</td>
                      <td>
                        {proximos.length === 0 ? (
                          <span className="text-muted">Sin recorridos</span>
                        ) : (
                          <div className="chip-row">
                            {proximos.slice(0, 3).map((r) => (
                              <Link key={r.id} to={`/recorridos/${r.id}`} className="chip">{formatDateShort(r.fecha)} · {r.pedidoIds.length} paq.</Link>
                            ))}
                            {proximos.length > 3 && <span className="text-muted">+{proximos.length - 3} más</span>}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="icon-button" title="Editar vehículo" aria-label={`Editar ${vehiculo.placa}`} onClick={() => setFormModal({ vehiculo })}><Icon name="edit" size={16} /></button>
                          <button type="button" className="icon-button icon-danger" title="Eliminar vehículo" aria-label={`Eliminar ${vehiculo.placa}`} onClick={() => setPendingDelete(vehiculo)}><Icon name="trash" size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formModal && (
        <Modal title={formModal.vehiculo ? 'Editar vehículo' : 'Registrar vehículo'} onClose={() => setFormModal(null)}>
          <VehiculoForm initial={formModal.vehiculo} existingPlacas={otherPlacas(formModal.vehiculo)} onSubmit={handleSubmit} onCancel={() => setFormModal(null)} />
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar vehículo"
          message={`¿Eliminar ${pendingDelete.tipo} ${pendingDelete.placa}?${deleteCount > 0 ? ` También se borrarán sus ${deleteCount} recorridos y los pedidos quedarán libres para reasignarse.` : ''}`}
          confirmLabel="Sí, eliminar"
          danger
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
