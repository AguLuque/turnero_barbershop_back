import { horariosRepository } from '../repository/horarios.repository';
import { turnosRepository } from '../repository/turnos.repository';
import { turnosFijosRepository } from '../repository/turnosfijos.repository';
import { SlotDisponible } from '../types/dominio.types';

function generarHorasEntreRango(horaInicio: string, horaFin: string, duracionMinutos: number): string[] {
  const horas: string[] = [];
  const [horaIni, minIni] = horaInicio.split(':').map(Number);
  const [horaFinN, minFinN] = horaFin.split(':').map(Number);

  let minutosActuales = horaIni * 60 + minIni;
  const minutosFin = horaFinN * 60 + minFinN;

  while (minutosActuales < minutosFin) {
    const h = Math.floor(minutosActuales / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutosActuales % 60).toString().padStart(2, '0');
    horas.push(`${h}:${m}`);
    minutosActuales += duracionMinutos;
  }

  return horas;
}

function estaDentroDeBloqueo(hora: string, horaInicioBloqueo: string | null, horaFinBloqueo: string | null): boolean {
  if (!horaInicioBloqueo || !horaFinBloqueo) return true; // bloqueo de dia completo
  return hora >= horaInicioBloqueo && hora < horaFinBloqueo;
}

export const disponibilidadService = {
  async calcularSlotsDelDia(
    idPeluqueria: string,
    fecha: string,
    duracionTurnoMinutos: number
  ): Promise<SlotDisponible[]> {
    const diaSemana = new Date(`${fecha}T00:00:00`).getDay();

    const franjasDelDia = await horariosRepository.buscarHorariosAtencion(idPeluqueria, diaSemana);
    if (franjasDelDia.length === 0) {
      return []; // el peluquero no atiende ese dia de la semana
    }

    const [bloqueos, turnosDelDia, turnosFijos] = await Promise.all([
      horariosRepository.buscarBloqueosPorFecha(idPeluqueria, fecha),
      turnosRepository.buscarPorPeluqueriaYFecha(idPeluqueria, fecha),
      turnosFijosRepository.buscarPorPeluqueria(idPeluqueria),
    ]);

    const horasOcupadas = new Set(turnosDelDia.map((turno) => turno.hora.slice(0, 5)));

    // Un turno fijo ocupa su horario todas las semanas que le correspondan,
    // aunque el turno real de esa fecha puntual todavia no se haya generado.
    const horasDeTurnosFijos = new Set(
      turnosFijos
        .filter((tf) => tf.dia_semana === diaSemana && tf.fecha_inicio <= fecha)
        .map((tf) => tf.hora.slice(0, 5))
    );

    const todasLasHoras = franjasDelDia.flatMap((franja) =>
      generarHorasEntreRango(franja.hora_inicio, franja.hora_fin, duracionTurnoMinutos)
    );

    return todasLasHoras.map((hora) => {
      const bloqueada = bloqueos.some((bloqueo) =>
        estaDentroDeBloqueo(hora, bloqueo.hora_inicio, bloqueo.hora_fin)
      );
      const ocupada = horasOcupadas.has(hora) || horasDeTurnosFijos.has(hora);

      return { hora, disponible: !bloqueada && !ocupada };
    });
  },
};