import { horariosRepository } from '../repository/horarios.repository';
import { turnosRepository } from '../repository/turnos.repository';
import { ErrorApi } from '../utils/errorApi';
import { HorarioAtencion, HorarioBloqueado } from '../types/dominio.types';
import { obtenerFechaHoyArgentina } from '../utils/fechaHoraArgentina';

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

  async eliminarFranjaHoraria(
    idFranja: string,
    idPeluqueriaAdmin: string
  ): Promise<{ turnosCancelados: number }> {
    const franja = await horariosRepository.buscarFranjaPorId(idFranja);
    if (!franja) throw ErrorApi.noEncontrado('Franja horaria no encontrada');

    if (franja.id_peluqueria !== idPeluqueriaAdmin) {
      throw ErrorApi.noAutorizado('No podes gestionar franjas horarias de otra peluqueria');
    }

    await horariosRepository.eliminarFranjaHoraria(idFranja);

    const turnosCancelados = await turnosRepository.cancelarPorFranjaEliminada(
      franja.id_peluqueria,
      franja.dia_semana,
      franja.hora_inicio.slice(0, 5),
      franja.hora_fin.slice(0, 5),
      obtenerFechaHoyArgentina()
    );

    return { turnosCancelados };
  },

  // Al bloquear un dia (o rango horario), cancela automaticamente los turnos
  // confirmados que caigan dentro de ese bloqueo, para que el cliente vea el
  // cambio reflejado en "Mis turnos" y no vaya a un horario donde no van a atenderlo.
  // Excepcion: si el bloqueo es de tipo 'orden_llegada', los turnos ya reservados
  // en ese rango NO se cancelan (se sigue atendiendo por orden de llegada ademas
  // de los turnos ya agendados).
  async crearBloqueo(
    datos: Omit<HorarioBloqueado, 'id' | 'tipo'> & { tipo?: HorarioBloqueado['tipo'] }
  ): Promise<{ bloqueo: HorarioBloqueado; turnosCancelados: number }> {
    if (datos.hora_inicio && datos.hora_fin) {
      validarRangoHorario(datos.hora_inicio, datos.hora_fin);
    }

    const tipo = datos.tipo ?? 'bloqueado';
    const bloqueo = await horariosRepository.crearBloqueo({ ...datos, tipo });

    const turnosCancelados =
      tipo === 'orden_llegada'
        ? 0
        : await turnosRepository.cancelarPorBloqueo(
            datos.id_peluqueria,
            datos.fecha,
            datos.hora_inicio,
            datos.hora_fin
          );

    return { bloqueo, turnosCancelados };
  },

  // limit/offset paginan sobre la lista ya ordenada (proximos primero, pasados
  // despues). Si ninguno de los dos se manda, se devuelve la lista completa
  // como antes, para no romper otros consumidores que todavia no pasan estos
  // parametros (ej. la app Android).
  async listarBloqueos(
    idPeluqueria: string,
    opciones: { limit?: number; offset?: number } = {}
  ): Promise<{ bloqueos: HorarioBloqueado[]; total: number }> {
    const todos = await horariosRepository.listarBloqueosPorPeluqueria(idPeluqueria);

    if (opciones.limit === undefined && opciones.offset === undefined) {
      return { bloqueos: todos, total: todos.length };
    }

    const limit = opciones.limit ?? 10;
    const offset = opciones.offset ?? 0;

    return {
      bloqueos: todos.slice(offset, offset + limit),
      total: todos.length,
    };
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