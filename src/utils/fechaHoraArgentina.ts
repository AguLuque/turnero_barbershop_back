// Calcula la fecha y hora actual en la zona horaria de Argentina de forma
// EXPLICITA, sin depender de como este configurado el reloj del servidor
// (proceso, contenedor, SO). Esto evita que el codigo se rompa silenciosamente
// si el dia de mañana se hace el deploy en un servidor configurado en UTC
// u otra zona horaria distinta a la de Argentina.

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

function obtenerPartes(): Record<string, string> {
  const formateador = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const partes: Record<string, string> = {};
  for (const parte of formateador.formatToParts(new Date())) {
    if (parte.type !== 'literal') partes[parte.type] = parte.value;
  }
  return partes;
}

// Devuelve la fecha de hoy en Argentina, formato "YYYY-MM-DD".
export function obtenerFechaHoyArgentina(): string {
  const p = obtenerPartes();
  return `${p.year}-${p.month}-${p.day}`;
}

// Devuelve la hora actual en Argentina, formato "HH:MM".
export function obtenerHoraActualArgentina(): string {
  const p = obtenerPartes();
  return `${p.hour}:${p.minute}`;
}

// Suma minutos a la hora actual y devuelve el resultado en formato "HH:MM".
// Si el resultado cruza medianoche, devuelve "23:59" (el uso real de esto es
// para calcular un margen chico, tipo 5 minutos, dentro del mismo dia).
export function sumarMinutosAHoraActual(minutos: number): string {
  const p = obtenerPartes();
  const fechaBase = new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00`);
  fechaBase.setMinutes(fechaBase.getMinutes() + minutos);

  const mismodia = fechaBase.getDate() === Number(p.day);
  if (!mismodia) return '23:59';

  const h = fechaBase.getHours().toString().padStart(2, '0');
  const m = fechaBase.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// Suma minutos al momento actual (en Argentina) y devuelve fecha y hora del
// resultado por separado, ya cruzando de dia si corresponde (a diferencia de
// sumarMinutosAHoraActual, que recorta a "23:59" del mismo dia). Se usa para
// calcular ventanas de tiempo futuras, como la del job de recordatorios de turno.
export function obtenerFechaHoraConMargen(minutos: number): { fecha: string; hora: string } {
  const p = obtenerPartes();
  const fechaBase = new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00`);
  fechaBase.setMinutes(fechaBase.getMinutes() + minutos);

  const anio = fechaBase.getFullYear().toString();
  const mes = (fechaBase.getMonth() + 1).toString().padStart(2, '0');
  const dia = fechaBase.getDate().toString().padStart(2, '0');
  const h = fechaBase.getHours().toString().padStart(2, '0');
  const m = fechaBase.getMinutes().toString().padStart(2, '0');

  return { fecha: `${anio}-${mes}-${dia}`, hora: `${h}:${m}` };
}