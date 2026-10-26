import Modal from './Modal.jsx';

// Mensaje de confirmación antes de acciones importantes (editar / eliminar).
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={loading ? () => {} : onCancel} size="sm" layer={5}>
      <p className="confirm-message">{message}</p>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
          {loading ? 'Procesando…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
