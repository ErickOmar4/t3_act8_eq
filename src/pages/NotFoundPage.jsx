import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/Feedback.jsx';

export default function NotFoundPage() {
  return (
    <EmptyState
      title="No encontramos esa página"
      text="Revisa la dirección o regresa al panel general."
      action={<Link className="btn btn-primary" to="/">Ir al panel general</Link>}
    />
  );
}
