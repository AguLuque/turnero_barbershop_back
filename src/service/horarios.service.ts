import { horariosRepository } from '../repository/horarios.repository';
import { ErrorApi } from '../utils/errorApi';
import { HorarioAtencion, HorarioBloqueado } from '../types/dominio.types';

function validarRangoHorario(horaInicio: string, horaFin: string): void {
  if (horaInicio >= horaFin) {
    throw ErrorApi.solicitudInvalida('La hora de inicio debe ser anterior a la hora de fin');
  }
}

export const horariosService = {
  async configurarDia(datos: Omit<HorarioAtencion, 'id'>): Promise<HorarioAtencion> {
    validarRangoHorario(datos.hora_inicio, datos.hora_fin);
    return horariosRepository.guardarHorarioAtencion(datos);
  },

  async crearBloqueo(datos: Omit<HorarioBloqueado, 'id'>): Promise<HorarioBloqueado> {
    if (datos.hora_inicio && datos.hora_fin) {
      validarRangoHorario(datos.hora_inicio, datos.hora_fin);
    }
    return horariosRepository.crearBloqueo(datos);
  },

  async obtenerHorarioDelDia(idPeluqueria: string, diaSemana: number): Promise<HorarioAtencion | null> {
    return horariosRepository.buscarHorarioAtencion(idPeluqueria, diaSemana);
  },
};