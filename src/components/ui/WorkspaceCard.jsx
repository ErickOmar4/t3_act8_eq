import { useState } from 'react';
import { useLogistica } from '../../context/LogisticaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const STATUS_LABEL = {
  local: 'Solo en este navegador',
  saving: 'Guardando…',
  saved: 'Guardado en línea',
  error: 'Con problemas',
};

// Conexión con JSONBlob: el documento en línea donde se guardan vehículos, recorridos y cambios.
export default function WorkspaceCard() {
  const { sync, workspaceId, createWorkspace, connectWorkspace, disconnectWorkspace } = useLogistica();
  const { notify } = useToast();
  const [inputId, setInputId] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action, okMessage) => {
    setBusy(true);
    try {
      await action();
      if (okMessage) notify(okMessage, 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <div className="workspace-head">
        <h2>Datos en línea (JSONBlob)</h2>
        <span className={`sync-pill sync-pill-${sync.status}`}>{STATUS_LABEL[sync.status]}</span>
      </div>
      <p className="text-muted">{sync.message}</p>

      {workspaceId ? (
        <div className="workspace-connected">
          <p>ID del documento: <code>{workspaceId}</code></p>
          <p className="text-muted">Quien conecte este mismo ID verá los mismos vehículos y recorridos. Si dos personas guardan a la vez, gana el último guardado.</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={disconnectWorkspace}>Desconectar</button>
        </div>
      ) : (
        <div className="workspace-actions">
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(createWorkspace, 'Documento creado en JSONBlob.')}>
            Crear documento en línea
          </button>
          <form
            className="workspace-connect"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => connectWorkspace(inputId), 'Documento conectado.');
            }}
          >
            <input value={inputId} onChange={(e) => setInputId(e.target.value)} placeholder="Pegar el ID de un documento existente" aria-label="ID del documento de JSONBlob" />
            <button type="submit" className="btn btn-secondary btn-sm" disabled={busy || !inputId.trim()}>Conectar</button>
          </form>
        </div>
      )}
    </section>
  );
}
