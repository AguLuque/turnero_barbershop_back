import { horariosRepository } from '../repository/horarios.repository';
import { turnosRepository } from '../repository/turnos.repository';
import { ErrorApi } from '../utils/errorApi';
import { HorarioAtencion, HorarioBloqueado } from '../types/dominio.types';

function validarRangoHorario(horaInicio: string, horaFin: string): void {
  if (horaInicio >= horaFin) {
    throw ErrorApi.solicitudInvalida('La hora de inicio debe ser anterior a la hora de fin');
  }
}

export const horariosService = {
  async agregarFranjaHoraria(datos: Omit<HorarioAtencion, 'id'>): Promise<HorarioAtencion> {
    validarRangoHorario(datos.hora_inicio, datos.hora_fin);
    return horariosRepository.agregarFranjaHoraria(datos);
  },

  async eliminarFranjaHoraria(idFranja: string, idPeluqueriaAdmin: string): Promise<void> {
    const franja = await horariosRepository.buscarFranjaPorId(idFranja);
    if (!franja) throw ErrorApi.noEncontrado('Franja horaria no encontrada');

    if (franja.id_peluqueria !== idPeluqueriaAdmin) {
      throw ErrorApi.noAutorizado('No podes gestionar horarios de otra peluqueria');
    }

    return horariosRepository.eliminarFranjaHoraria(idFranja);
  },

  // Al bloquear un dia (o rango horario), cancela automaticamente los turnos
  // confirmados que caigan dentro de ese bloqueo, para que el cliente vea el
  // cambio reflejado en "Mis turnos" y no vaya a un horario donde no van a atenderlo.
  async crearBloqueo(
    datos: Omit<HorarioBloqueado, 'id'>
  ): Promise<{ bloqueo: HorarioBloqueado; turnosCancelados: number }> {
    if (datos.hora_inicio && datos.hora_fin) {
      validarRangoHorario(datos.hora_inicio, datos.hora_fin);
    }

    const bloqueo = await horariosRepository.crearBloqueo(datos);
    const turnosCancelados = await turnosRepository.cancelarPorBloqueo(
      datos.id_peluqueria,
      datos.fecha,
      datos.hora_inicio,
      datos.hora_fin
    );

    return { bloqueo, turnosCancelados };
  },

  async listarBloqueos(idPeluqueria: string): Promise<HorarioBloqueado[]> {
    return horariosRepository.listarBloqueosPorPeluqueria(idPeluqueria);
  },

  async eliminarBloqueo(idBloqueo: string, idPeluqueriaAdmin: string): Promise<void> {
    const bloqueo = await horariosRepository.buscarBloqueoPorId(idBloqueo);
    if (!bloqueo) throw ErrorApi.noEncontrado('Bloqueo no encontrado');

    if (bloqueo.id_peluqueria !== idPeluqueriaAdmin) {
      throw ErrorApi.noAutorizado('No podes gestionar bloqueos de otra peluqueria');
    }

    return horariosRepository.eliminarBloqueo(idBloqueo);
  },

  async obtenerFranjasDelDia(idPeluqueria: string, diaSemana: number): Promise<HorarioAtencion[]> {
    return horariosRepository.buscarHorariosAtencion(idPeluqueria, diaSemana);
  },
};