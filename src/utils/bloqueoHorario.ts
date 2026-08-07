import { HorarioAtencion, HorarioBloqueado } from '../types/dominio.types';

// Logica compartida para saber si un horario puntual cae dentro de un bloqueo
// (tipo 'bloqueado' u 'orden_llegada'). La usan tanto disponibilidad.service.ts
// (para saber que horarios mostrar como no disponibles) como turnosFijos.service.ts
// (para no materializar un turno fijo en un horario bloqueado). Antes estaba
// duplicada en los dos archivos; se centraliza aca para no tener que corregir
// el mismo bug en dos lugares distintos cada vez.

// La hora de cierre mas tardia entre las franjas de atencion de un dia. Null si
// no hay ninguna franja configurada para ese dia.
export function obtenerHoraCierreDelDia(franjasDelDia: Pick<HorarioAtencion, 'hora_fin'>[]): string | null {
  if (franjasDelDia.length === 0) return null;
  return franjasDelDia.reduce(
    (masTardia, franja) => (franja.hora_fin > masTardia ? franja.hora_fin : masTardia),
    franjasDelDia[0].hora_fin
  );
}

// El limite de fin es INCLUYENTE: un horario igual al limite de fin del bloqueo
// se considera parte del rango bloqueado.
//
// Para bloqueos de tipo 'orden_llegada', el "Hasta" cargado por el admin es solo
// informativo: en la practica no se puede saber cuando termina, asi que el
// bloqueo real se extiende hasta el cierre de la ultima franja de atencion del
// dia (horaCierreDelDia). Los bloqueos de tipo 'bloqueado' siguen usando su
// hora_fin exacta, sin cambios.
export function estaHoraDentroDeBloqueo(
  hora: string,
  bloqueo: Pick<HorarioBloqueado, 'hora_inicio' | 'hora_fin' | 'tipo'>,
  horaCierreDelDia: string | null
): boolean {
  if (!bloqueo.hora_inicio || !bloqueo.hora_fin) return true; // bloqueo de dia completo

  const horaFinEfectiva = bloqueo.tipo === 'orden_llegada' && horaCierreDelDia ? horaCierreDelDia : bloqueo.hora_fin;

  const horaComparar = hora.slice(0, 5);
  const inicio = bloqueo.hora_inicio.slice(0, 5);
  const fin = horaFinEfectiva.slice(0, 5);

  return horaComparar >= inicio && horaComparar <= fin;
}
