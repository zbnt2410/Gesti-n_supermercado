// =============================================
// frontend/src/utils/formatters.js
// =============================================

// Formatear moneda
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// ✅ Helper interno: parsea fechas ISO sin desfase de zona horaria
// "2025-01-11" o "2025-01-11T..." → Date local correcta
const parseLocalDate = (date) => {
  if (!date) return null;
  if (date instanceof Date) return date;
  // Toma solo la parte de fecha (YYYY-MM-DD) e interpreta como local
  const [year, month, day] = date.split('T')[0].split('-');
  return new Date(year, month - 1, day); // month es 0-indexed
};

// Formatear fecha larga
export const formatDate = (date) => {
  if (!date) return "";
  const parsed = parseLocalDate(date);
  if (!parsed) return "";
  return new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed);
};

// Formatear fecha corta
export const formatDateShort = (date) => {
  if (!date) return "";
  const parsed = parseLocalDate(date);
  if (!parsed) return "";
  return new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
};

// Formatear hora
export const formatTime = (time) => {
  if (!time) return "";

  let d;

  if (time instanceof Date) {
    // Prisma devuelve Date para TIME
    d = time;
  } else if (typeof time === "string") {
    // Si viene como string "13:26" o "13:26:00"
    d = new Date(`1970-01-01T${time}`);
  } else {
    return "";
  }

  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};