import { useState } from 'react';
import { TIPOS_VEHICULO } from '../../config/constants.js';

export default function VehiculoForm({ initial, existingPlacas, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    tipo: initial?.tipo ?? TIPOS_VEHICULO[0],
    placa: initial?.placa ?? '',
    repartidor: initial?.repartidor ?? '',
    telefono: initial?.telefono ?? '',
    capacidad: initial?.capacidad ?? 10,
  });
  const [submitted, setSubmitted] = useState(false);

  const errors = {};
  const placa = values.placa.trim().toUpperCase();
  if (!placa) errors.placa = 'Escribe la placa o identificador del vehículo.';
  else if (existingPlacas.includes(placa)) errors.placa = 'Ya existe un vehículo con esa placa.';
  if (!values.repartidor.trim()) errors.repartidor = 'Escribe el nombre del repartidor asignado.';
  if (values.telefono && !/^[\d\s+()-]{10,}$/.test(values.telefono.trim())) errors.telefono = 'Escribe un teléfono de al menos 10 dígitos.';
  if (!(Number(values.capacidad) >= 1)) errors.capacidad = 'La capacidad debe ser de al menos 1 paquete.';

  const handleChange = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  const showError = (field) => submitted && errors[field];

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    onSubmit({ ...values, placa, repartidor: values.repartidor.trim(), telefono: values.telefono.trim(), capacidad: Number(values.capacidad) });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="form-grid">
      <div className="field">
        <label htmlFor="tipo">Tipo de vehículo</label>
        <select id="tipo" name="tipo" value={values.tipo} onChange={handleChange}>
          {TIPOS_VEHICULO.map((tipo) => (<option key={tipo} value={tipo}>{tipo}</option>))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="placa">Placa</label>
        <input id="placa" name="placa" value={values.placa} onChange={handleChange} aria-invalid={Boolean(showError('placa'))} />
        {showError('placa') && <p className="field-error">{errors.placa}</p>}
      </div>
      <div className="field field-wide">
        <label htmlFor="repartidor">Repartidor asignado</label>
        <input id="repartidor" name="repartidor" value={values.repartidor} onChange={handleChange} aria-invalid={Boolean(showError('repartidor'))} />
        {showError('repartidor') && <p className="field-error">{errors.repartidor}</p>}
      </div>
      <div className="field">
        <label htmlFor="telefono">Teléfono (opcional)</label>
        <input id="telefono" name="telefono" value={values.telefono} onChange={handleChange} aria-invalid={Boolean(showError('telefono'))} />
        {showError('telefono') && <p className="field-error">{errors.telefono}</p>}
      </div>
      <div className="field">
        <label htmlFor="capacidad">Capacidad (paquetes)</label>
        <input id="capacidad" name="capacidad" type="number" min="1" value={values.capacidad} onChange={handleChange} aria-invalid={Boolean(showError('capacidad'))} />
        {showError('capacidad') && <p className="field-error">{errors.capacidad}</p>}
      </div>
      <div className="form-actions field-wide">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">{initial ? 'Guardar cambios' : 'Registrar vehículo'}</button>
      </div>
    </form>
  );
}
