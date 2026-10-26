import { ESTADOS } from '../../config/constants.js';

export default function StatusBadge({ estado }) {
  const info = ESTADOS[estado] ?? { label: estado, tone: 'neutral' };
  return <span className={`badge badge-${info.tone}`}>{info.label}</span>;
}
