import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from '../components/ui/Icon.jsx';

const DEMO_USER = { identifier: 'emilys', password: 'emilyspass' };

function validate({ identifier, password }) {
  const errors = {};
  const id = identifier.trim();
  if (!id) errors.identifier = 'Escribe tu usuario o correo.';
  else if (id.length < 3) errors.identifier = 'Debe tener al menos 3 caracteres.';
  if (!password) errors.password = 'Escribe tu contraseña.';
  else if (password.length < 4) errors.password = 'La contraseña debe tener al menos 4 caracteres.';
  return errors;
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [values, setValues] = useState({ identifier: '', password: '' });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const errors = validate(values);
  const from = location.state?.from ? `${location.state.from.pathname}${location.state.from.search}` : '/';

  // Con sesión iniciada se entra directo al sistema (o a la página que se quería abrir).
  if (user) return <Navigate to={from} replace />;

  const handleChange = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
    setApiError('');
  };
  const handleBlur = (event) => setTouched((current) => ({ ...current, [event.target.name]: true }));
  const showError = (field) => touched[field] && errors[field];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ identifier: true, password: true });
    if (Object.keys(errors).length > 0) return; // Validación antes de hacer la petición

    setSubmitting(true);
    setApiError('');
    try {
      await login(values.identifier.trim(), values.password);
    } catch (err) {
      setApiError(err.status === 400 || err.status === 401 ? 'Usuario o contraseña incorrectos.' : err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoUser = () => {
    setValues(DEMO_USER);
    setTouched({});
    setApiError('');
  };

  return (
    <div className="login-page">
      <section className="login-hero" aria-hidden="true">
        <div>
          <h1>Cada paquete, en su parada.</h1>
          <p>Planea los recorridos de tus repartidores en Oaxaca y sigue cada entrega desde un solo lugar.</p>
        </div>
        <svg viewBox="0 0 420 260" className="login-route">
          <path d="M30 220 C110 220 90 120 190 120 S300 150 340 60" fill="none" stroke="#E0A526" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 14" />
          <circle cx="30" cy="220" r="14" fill="#fff" />
          <circle cx="190" cy="120" r="14" fill="#4CB59B" />
          <circle cx="340" cy="60" r="14" fill="#4CB59B" />
          <text x="30" y="225" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1E2A47">S</text>
          <text x="190" y="125" textAnchor="middle" fontSize="13" fontWeight="700" fill="#10261F">1</text>
          <text x="340" y="65" textAnchor="middle" fontSize="13" fontWeight="700" fill="#10261F">2</text>
        </svg>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <h2>Inicia sesión</h2>
          <p className="text-muted">Entra para administrar pedidos, vehículos y recorridos.</p>

          {apiError && <div className="alert alert-error" role="alert">{apiError}</div>}

          <div className="field">
            <label htmlFor="identifier">Usuario o correo</label>
            <input id="identifier" name="identifier" autoComplete="username" value={values.identifier} onChange={handleChange} onBlur={handleBlur} aria-invalid={Boolean(showError('identifier'))} />
            {showError('identifier') && <p className="field-error">{errors.identifier}</p>}
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <div className="input-with-button">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={values.password} onChange={handleChange} onBlur={handleBlur} aria-invalid={Boolean(showError('password'))} />
              <button type="button" className="icon-button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                <Icon name="eye" size={18} />
              </button>
            </div>
            {showError('password') && <p className="field-error">{errors.password}</p>}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Verificando…' : 'Entrar al sistema'}
          </button>

          <div className="demo-box">
            <p>Para probar usa el usuario <strong>emilys</strong> con la contraseña <strong>emilyspass</strong>.</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={fillDemoUser}>Llenar datos de prueba</button>
          </div>
        </form>
      </section>
    </div>
  );
}
