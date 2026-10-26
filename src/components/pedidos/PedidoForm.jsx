import { useState } from 'react';
import { ESTADOS } from '../../config/constants.js';

function validate(values) {
  const errors = {};
  if (!values.cliente.trim()) errors.cliente = 'Escribe el nombre del cliente.';
  if (values.telefono && !/^[\d\s+()-]{10,}$/.test(values.telefono.trim())) errors.telefono = 'Escribe un teléfono de al menos 10 dígitos.';
  if (!values.direccion.trim()) errors.direccion = 'Escribe la dirección de entrega.';
  if (!values.zona.trim()) errors.zona = 'Escribe la colonia o zona.';
  if (!(Number(values.articulos) >= 1)) errors.articulos = 'Debe haber al menos 1 artículo.';
  if (values.total === '' || Number(values.total) < 0) errors.total = 'Escribe un total válido (0 o mayor).';
  return errors;
}

// Formulario compartido para crear y editar pedidos.
export default function PedidoForm({ initial, mode, saving, zonas = [], onSubmit, onCancel }) {
  const [values, setValues] = useState({
    cliente: initial?.cliente ?? '',
    telefono: initial?.telefono ?? '',
    direccion: initial?.direccion ?? '',
    zona: initial?.zona ?? '',
    articulos: initial?.articulos ?? 1,
    total: initial?.total ?? '',
    estado: initial?.estado ?? 'pendiente',
    notas: initial?.notas ?? '',
  });
  const [submitted, setSubmitted] = useState(false);
  const errors = validate(values);
  const showError = (field) => submitted && errors[field];

  const handleChange = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    onSubmit({ ...values, cliente: values.cliente.trim(), direccion: values.direccion.trim(), zona: values.zona.trim(), articulos: Number(values.articulos), total: Number(values.total) });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="form-grid">
      <div className="field field-wide">
        <label htmlFor="cliente">Cliente</label>
        <input id="cliente" name="cliente" value={values.cliente} onChange={handleChange} aria-invalid={Boolean(showError('cliente'))} />
        {showError('cliente') && <p className="field-error">{errors.cliente}</p>}
      </div>
      <div className="field">
        <label htmlFor="telefono">Teléfono (opcional)</label>
        <input id="telefono" name="telefono" value={values.telefono} onChange={handleChange} aria-invalid={Boolean(showError('telefono'))} />
        {showError('telefono') && <p className="field-error">{errors.telefono}</p>}
      </div>
      <div className="field">
        <label htmlFor="zona">Colonia o zona</label>
        <input id="zona" name="zona" list="zonas-sugeridas" value={values.zona} onChange={handleChange} aria-invalid={Boolean(showError('zona'))} />
        <datalist id="zonas-sugeridas">
          {zonas.map((zona) => (<option key={zona} value={zona} />))}
        </datalist>
        {showError('zona') && <p className="field-error">{errors.zona}</p>}
      </div>
      <div className="field field-wide">
        <label htmlFor="direccion">Calle y número</label>
        <input id="direccion" name="direccion" value={values.direccion} onChange={handleChange} aria-invalid={Boolean(showError('direccion'))} />
        {showError('direccion') && <p className="field-error">{errors.direccion}</p>}
        <small>La ubicación en el mapa se obtiene de OpenStreetMap con esta calle y colonia.</small>
      </div>
      <div className="field">
        <label htmlFor="articulos">Artículos</label>
        <input id="articulos" name="articulos" type="number" min="1" value={values.articulos} onChange={handleChange} aria-invalid={Boolean(showError('articulos'))} />
        {showError('articulos') && <p className="field-error">{errors.articulos}</p>}
      </div>
      <div className="field">
        <label htmlFor="total">Total (MXN)</label>
        <input id="total" name="total" type="number" min="0" step="0.01" value={values.total} onChange={handleChange} aria-invalid={Boolean(showError('total'))} />
        {showError('total') && <p className="field-error">{errors.total}</p>}
      </div>
      {mode === 'edit' && (
        <div className="field field-wide">
          <label htmlFor="estado">Estado</label>
          <select id="estado" name="estado" value={values.estado} onChange={handleChange}>
            {Object.entries(ESTADOS).map(([key, info]) => (
              <option key={key} value={key}>{info.label}</option>
            ))}
          </select>
        </div>
      )}
      <div className="field field-wide">
        <label htmlFor="notas">Indicaciones para el repartidor (opcional)</label>
        <textarea id="notas" name="notas" rows="2" value={values.notas} onChange={handleChange} />
      </div>
      <div className="form-actions field-wide">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Buscando dirección y guardando…' : mode === 'edit' ? 'Guardar cambios' : 'Crear pedido'}
        </button>
      </div>
    </form>
  );
}
