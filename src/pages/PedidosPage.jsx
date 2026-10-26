import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLogistica } from '../context/LogisticaContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ESTADOS, LIMIT_OPTIONS } from '../config/constants.js';
import { createPedidoRequest, deletePedidoRequest, updatePedidoRequest } from '../services/pedidosService.js';
import { geocodeAddress } from '../services/geocodingService.js';
import { formatDateShort, formatMoney } from '../utils/format.js';
import Icon from '../components/ui/Icon.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback.jsx';
import PedidoForm from '../components/pedidos/PedidoForm.jsx';

export default function PedidosPage() {
  const { pedidos, loading, error, notice, loadPedidos, addPedido, updatePedido, removePedido, asignaciones, vehiculosById } = useLogistica();
  const { notify } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [formModal, setFormModal] = useState(null); // { mode: 'create' } | { mode: 'edit', pedido }
  const [pendingEdit, setPendingEdit] = useState(null); // { pedido, values } esperando confirmación
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  // ---- Filtros y paginación viven en la URL: ?q=&estado=&zona=&page=&limit= ----
  const q = searchParams.get('q') ?? '';
  const estado = searchParams.get('estado') ?? '';
  const zona = searchParams.get('zona') ?? '';
  const limitParam = Number(searchParams.get('limit'));
  const limit = LIMIT_OPTIONS.includes(limitParam) ? limitParam : LIMIT_OPTIONS[0];
  const requestedPage = Math.max(1, Number(searchParams.get('page')) || 1);

  const updateParams = (changes, { replace = false } = {}) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next, { replace });
  };

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (estado && p.estado !== estado) return false;
      if (zona && p.zona !== zona) return false;
      if (!text) return true;
      return `${p.id} ${p.cliente} ${p.direccion} ${p.zona}`.toLowerCase().includes(text);
    });
  }, [pedidos, q, estado, zona]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const page = Math.min(requestedPage, totalPages);
  const rows = filtered.slice((page - 1) * limit, page * limit);
  const hasFilters = Boolean(q || estado || zona);
  const zonas = useMemo(() => [...new Set(pedidos.map((p) => p.zona))].sort((a, b) => a.localeCompare(b, 'es')), [pedidos]);

  // ---- Crear ----
  const handleCreate = async (values) => {
    setSaving(true);
    try {
      const place = await geocodeAddress(values.direccion, values.zona); // 1) API de geocodificación (Nominatim)
      const apiResponse = await createPedidoRequest(values); // 2) petición real a la API de pedidos
      addPedido({ ...values, lat: place.lat, lng: place.lng, resumen: 'Pedido capturado en el sistema' }); // 3) reflejar en el estado local
      notify(`Pedido creado. La API respondió con el folio ${apiResponse.id} (simulado, no se guarda en su servidor).`, 'success');
      setFormModal(null);
      updateParams({ page: 1 });
    } catch (err) {
      notify(`No se pudo crear el pedido: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ---- Editar (primero se pide confirmación) ----
  const handleConfirmEdit = async () => {
    const { pedido, values } = pendingEdit;
    setSaving(true);
    const changes = { ...values };

    try {
      if (values.direccion !== pedido.direccion || values.zona !== pedido.zona) {
        const place = await geocodeAddress(values.direccion, values.zona); // API de geocodificación
        changes.lat = place.lat;
        changes.lng = place.lng;
      }
    } catch (err) {
      notify(`No se pudo ubicar la dirección: ${err.message}`, 'error');
      setSaving(false);
      setPendingEdit(null);
      return;
    }

    try {
      await updatePedidoRequest(pedido.id, values);
      notify(`Pedido #${pedido.id} actualizado.`, 'success');
    } catch (err) {
      // Los pedidos creados en la app no existen en la API de prueba, así que ahí es normal que falle.
      if (!pedido.local) {
        notify(`No se pudo editar el pedido: ${err.message}`, 'error');
        setSaving(false);
        setPendingEdit(null);
        return;
      }
      notify(`Pedido #${pedido.id} actualizado solo en la app (la API no conoce los pedidos nuevos).`, 'info');
    }
    updatePedido(pedido.id, changes);
    setSaving(false);
    setPendingEdit(null);
    setFormModal(null);
  };

  // ---- Eliminar (con confirmación) ----
  const handleConfirmDelete = async () => {
    const pedido = pendingDelete;
    setSaving(true);
    try {
      await deletePedidoRequest(pedido.id);
      notify(`Pedido #${pedido.id} eliminado.`, 'success');
    } catch (err) {
      if (!pedido.local) {
        notify(`No se pudo eliminar el pedido: ${err.message}`, 'error');
        setSaving(false);
        setPendingDelete(null);
        return;
      }
      notify(`Pedido #${pedido.id} eliminado solo en la app (la API no conoce los pedidos nuevos).`, 'info');
    }
    removePedido(pedido.id);
    setSaving(false);
    setPendingDelete(null);
  };

  const assigned = pendingDelete ? asignaciones.get(pendingDelete.id) : null;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Pedidos</h1>
          <p className="text-muted">Consulta, crea y corrige los pedidos antes de asignarlos a un recorrido.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setFormModal({ mode: 'create' })}>
          <Icon name="plus" size={16} /> Nuevo pedido
        </button>
      </header>

      <section className="card card-flush">
        <div className="toolbar">
          <div className="search-box">
            <Icon name="search" size={16} />
            <input type="search" placeholder="Buscar por cliente, dirección o folio" value={q} onChange={(e) => updateParams({ q: e.target.value, page: 1 }, { replace: true })} aria-label="Buscar pedidos" />
          </div>
          <select value={estado} onChange={(e) => updateParams({ estado: e.target.value, page: 1 })} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            {Object.entries(ESTADOS).map(([key, info]) => (<option key={key} value={key}>{info.label}</option>))}
          </select>
          <select value={zona} onChange={(e) => updateParams({ zona: e.target.value, page: 1 })} aria-label="Filtrar por zona">
            <option value="">Todas las zonas</option>
            {zonas.map((z) => (<option key={z} value={z}>{z}</option>))}
          </select>
          {hasFilters && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateParams({ q: '', estado: '', zona: '', page: 1 })}>Limpiar filtros</button>
          )}
          <button type="button" className="btn btn-secondary btn-sm toolbar-end" onClick={loadPedidos} disabled={loading}>
            <Icon name="refresh" size={14} /> Sincronizar con la API
          </button>
        </div>

        {error && pedidos.length > 0 && <div className="alert alert-warning" role="alert">{error}</div>}
        {notice && <div className="alert alert-warning" role="alert">{notice}</div>}

        {loading && pedidos.length === 0 ? (
          <LoadingState text="Cargando pedidos desde la API…" />
        ) : error && pedidos.length === 0 ? (
          <ErrorState message={`No pudimos cargar los pedidos. ${error}`} onRetry={loadPedidos} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No hay pedidos con esos filtros" text="Prueba con otra búsqueda o limpia los filtros." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Folio</th><th>Cliente</th><th>Entrega en</th><th className="num">Artículos</th><th className="num">Total</th><th>Estado</th><th>Recorrido</th><th><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((pedido) => {
                    const recorrido = asignaciones.get(pedido.id);
                    const vehiculo = recorrido ? vehiculosById.get(recorrido.vehiculoId) : null;
                    return (
                      <tr key={pedido.id}>
                        <td className="num-id">#{pedido.id}</td>
                        <td><strong>{pedido.cliente}</strong><small>{pedido.telefono || 'Sin teléfono'}</small></td>
                        <td>{pedido.direccion}<small>{pedido.zona}</small></td>
                        <td className="num">{pedido.articulos}</td>
                        <td className="num">{formatMoney(pedido.total)}</td>
                        <td><StatusBadge estado={pedido.estado} /></td>
                        <td>
                          {recorrido ? (
                            <Link to={`/recorridos/${recorrido.id}`} className="text-link">{vehiculo?.tipo ?? 'Vehículo'} · {formatDateShort(recorrido.fecha)}</Link>
                          ) : (<span className="text-muted">Sin asignar</span>)}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button type="button" className="icon-button" title="Editar pedido" aria-label={`Editar pedido ${pedido.id}`} onClick={() => setFormModal({ mode: 'edit', pedido })}><Icon name="edit" size={16} /></button>
                            <button type="button" className="icon-button icon-danger" title="Eliminar pedido" aria-label={`Eliminar pedido ${pedido.id}`} onClick={() => setPendingDelete(pedido)}><Icon name="trash" size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} limit={limit} totalItems={filtered.length} onPageChange={(n) => updateParams({ page: n })} onLimitChange={(n) => updateParams({ limit: n, page: 1 })} />
          </>
        )}
      </section>

      {formModal && (
        <Modal title={formModal.mode === 'edit' ? `Editar pedido #${formModal.pedido.id}` : 'Nuevo pedido'} onClose={() => !saving && setFormModal(null)}>
          <PedidoForm
            mode={formModal.mode}
            initial={formModal.pedido}
            saving={saving}
            zonas={zonas}
            onCancel={() => setFormModal(null)}
            onSubmit={(values) => (formModal.mode === 'edit' ? setPendingEdit({ pedido: formModal.pedido, values }) : handleCreate(values))}
          />
        </Modal>
      )}

      {pendingEdit && (
        <ConfirmDialog title="Confirmar edición" message={`¿Quieres guardar los cambios del pedido #${pendingEdit.pedido.id} de ${pendingEdit.pedido.cliente}?`} confirmLabel="Sí, guardar cambios" loading={saving} onConfirm={handleConfirmEdit} onCancel={() => setPendingEdit(null)} />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar pedido"
          message={`¿Eliminar el pedido #${pendingDelete.id} de ${pendingDelete.cliente}?${assigned ? ' También saldrá del recorrido al que está asignado.' : ''} Esta acción no se puede deshacer.`}
          confirmLabel="Sí, eliminar"
          danger
          loading={saving}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
