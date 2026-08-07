import { horariosRepository } from '../repository/horarios.repository';
import { turnosRepository } from '../repository/turnos.repository';
import { turnosFijosRepository } from '../repository/turnosfijos.repository';
import { correspondeSegunFrecuencia } from '../utils/frecuenciaTurnoFijo';
import { obtenerFechaHoyArgentina, sumarMinutosAHoraActual } from '../utils/fechaHoraArgentina';
import { estaHoraDentroDeBloqueo, obtenerHoraCierreDelDia } from '../utils/bloqueoHorario';
import { SlotDisponible } from '../types/dominio.types';

export interface AvisoOrdenLlegada {
  horaInicio: string;
  horaFin: string;
}

function generarHorasEntreRango(horaInicio: string, horaFin: string, duracionMinutos: number): string[] {
  const horas: string[] = [];
  const [horaIni, minIni] = horaInicio.split(':').map(Number);
  const [horaFinN, minFinN] = horaFin.split(':').map(Number);

  let minutosActuales = horaIni * 60 + minIni;
  const minutosFin = horaFinN * 60 + minFinN;

  while (minutosActuales <= minutosFin) {
    const h = Math.floor(minutosActuales / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutosActuales % 60).toString().padStart(2, '0');
    horas.push(`${h}:${m}`);
    minutosActuales += duracionMinutos;
  }

  return horas;
}

function pad(numero: number): string {
  return numero.toString().padStart(2, '0');
}

function obtenerFechaYHoraLimite(margenMinutos: number): { fecha: string; horaLimite: string } {
  const ahora = new Date();
  const conMargen = new Date(ahora.getTime() + margenMinutos * 60000);

  const fecha = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}`;
  const horaLimite = `${pad(conMargen.getHours())}:${pad(conMargen.getMinutes())}`;

  return { fecha, horaLimite };
}

export const disponibilidadService = {
  async calcularSlotsDelDia(
    idPeluqueria: string,
    fecha: string,
    duracionTurnoMinutos: number
  ): Promise<SlotDisponible[]> {
    const diaSemana = new Date(`${fecha}T00:00:00`).getDay();

    const [franjasDelDia, bloqueos, turnosDelDiaTodos, turnosFijos] = await Promise.all([
      horariosRepository.buscarHorariosAtencion(idPeluqueria, diaSemana),
      horariosRepository.buscarBloqueosPorFecha(idPeluqueria, fecha),
      turnosRepository.buscarPorPeluqueriaYFechaTodos(idPeluqueria, fecha),
      turnosFijosRepository.buscarPorPeluqueria(idPeluqueria),
    ]);

    if (franjasDelDia.length === 0) {
      return [];
    }

    const horasOcupadas = new Set(
      turnosDelDiaTodos.filter((t) => t.estado !== 'cancelado').map((t) => t.hora.slice(0, 5))
    );

    const idsTurnoFijoCanceladosEstaFecha = new Set(
      turnosDelDiaTodos
        .filter((t) => t.id_turno_fijo && t.estado === 'cancelado')
        .map((t) => t.id_turno_fijo as string)
    );

    const horasDeTurnosFijos = new Set(
      turnosFijos
        .filter(
          (tf) =>
            tf.dia_semana === diaSemana &&
            tf.fecha_inicio <= fecha &&
            correspondeSegunFrecuencia(tf.fecha_inicio, tf.dia_semana, tf.frecuencia_dias, fecha) &&
            !idsTurnoFijoCanceladosEstaFecha.has(tf.id)
        )
        .map((tf) => tf.hora.slice(0, 5))
    );

    const hoy = obtenerFechaHoyArgentina();
    const horaLimite = sumarMinutosAHoraActual(5);
    const esHoy = fecha === hoy;
    const horaCierreDelDia = obtenerHoraCierreDelDia(franjasDelDia);

    const todasLasHoras = franjasDelDia.flatMap((franja) =>
      generarHorasEntreRango(franja.hora_inicio, franja.hora_fin, duracionTurnoMinutos)
    );

    return todasLasHoras.map((hora) => {
      const bloqueada = bloqueos.some((bloqueo) => estaHoraDentroDeBloqueo(hora, bloqueo, horaCierreDelDia));
      const ocupada = horasOcupadas.has(hora) || horasDeTurnosFijos.has(hora);
      const yaPaso = esHoy && hora < horaLimite;

      return { hora, disponible: !bloqueada && !ocupada && !yaPaso };
    });
  },

  // Busca si hay algun bloqueo de tipo 'orden_llegada' para la fecha, para avisarle
  // al cliente que en ese rango se atiende por orden de llegada ademas de los turnos
  // ya agendados. Si hay mas de uno, combina el rango mas amplio entre todos.
  async obtenerAvisoOrdenLlegada(idPeluqueria: string, fecha: string): Promise<AvisoOrdenLlegada | null> {
    const bloqueos = await horariosRepository.buscarBloqueosPorFecha(idPeluqueria, fecha);
    const bloqueosOrdenLlegada = bloqueos.filter((bloqueo) => bloqueo.tipo === 'orden_llegada');

    if (bloqueosOrdenLlegada.length === 0) return null;

    const inicios = bloqueosOrdenLlegada.map((b) => (b.hora_inicio ?? '00:00').slice(0, 5)).sort();
    const fines = bloqueosOrdenLlegada.map((b) => (b.hora_fin ?? '23:59').slice(0, 5)).sort();

    return {
      horaInicio: inicios[0],
      horaFin: fines[fines.length - 1],
    };
  },
};
