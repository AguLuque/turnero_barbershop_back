import { horariosRepository } from '../repository/horarios.repository';
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

  async eliminarFranjaHoraria(idFranja: string): Promise<void> {
    return horariosRepository.eliminarFranjaHoraria(idFranja);
  },

  async crearBloqueo(datos: Omit<HorarioBloqueado, 'id'>): Promise<HorarioBloqueado> {
    if (datos.hora_inicio && datos.hora_fin) {
      validarRangoHorario(datos.hora_inicio, datos.hora_fin);
    }
    return horariosRepository.crearBloqueo(datos);
  },

  async obtenerFranjasDelDia(idPeluqueria: string, diaSemana: number): Promise<HorarioAtencion[]> {
    return horariosRepository.buscarHorariosAtencion(idPeluqueria, diaSemana);
  },
};