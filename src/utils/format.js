const pad = (n) => String(n).padStart(2, '0');

export const toISODate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const todayISO = () => toISODate(new Date());

const parseISO = (iso) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function addDays(iso, days) {
  const date = parseISO(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export const formatDateLong = (iso) =>
  parseISO(iso).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const formatDateShort = (iso) => parseISO(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

export const formatMoney = (amount) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount ?? 0);
