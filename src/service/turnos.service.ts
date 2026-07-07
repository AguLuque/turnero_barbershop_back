import { turnosRepository } from '../repository/turnos.repository';
import { peluqueriasRepository } from '../repository/peluquerias.repository';
import { disponibilidadService } from './disponibilidad.service';
import { ErrorApi } from '../utils/errorApi';
import { NuevoTurnoInput, Turno } from '../types/dominio.types';

function esHoy(fecha: string): boolean {
  const hoy = new Date().toISOString().slice(0, 10);
  return fecha === hoy;
}

export const turnosService = {
  async reservar(datos: NuevoTurnoInput): Promise<Turno> {
    const peluqueria = await peluqueriasRepository.buscarPorId(datos.id_peluqueria);

    const slots = await disponibilidadService.calcularSlotsDelDia(
      datos.id_peluqueria,
      datos.fecha,
      peluqueria.duracion_turno_minutos
    );

    const slotElegido = slots.find((slot) => slot.hora === datos.hora);
    if (!slotElegido || !slotElegido.disponible) {
      throw ErrorApi.conflicto('Ese horario ya no esta disponible');
    }

    return turnosRepository.crear(datos, peluqueria.precio_corte);
  },

  async listarPorCliente(idCliente: string): Promise<Turno[]> {
    return turnosRepository.buscarPorCliente(idCliente);
  },

  async listarPorFecha(idPeluqueria: string, fecha: string): Promise<Turno[]> {
    return turnosRepository.buscarPorPeluqueriaYFechaTodos(idPeluqueria, fecha);
  },

  async cancelar(idTurno: string, perfilQueCancela: { id: string; rol: string }): Promise<Turno> {
    const turno = await turnosRepository.buscarPorId(idTurno);
    if (!turno) throw ErrorApi.noEncontrado('Turno no encontrado');

    const esDueño = turno.id_cliente === perfilQueCancela.id;
    const esStaff = perfilQueCancela.rol === 'admin' || perfilQueCancela.rol === 'superadmin';
    if (!esDueño && !esStaff) {
      throw ErrorApi.noAutorizado('No podes cancelar un turno que no es tuyo');
    }

    if (turno.estado !== 'confirmado') {
      throw ErrorApi.solicitudInvalida('Solo se pueden cancelar turnos confirmados');
    }

    const seAplicaRecargo = esHoy(turno.fecha);
    return turnosRepository.actualizarEstado(idTurno, 'cancelado', seAplicaRecargo);
  },

  async marcarFalto(idTurno: string): Promise<Turno> {
    const turno = await turnosRepository.buscarPorId(idTurno);
    if (!turno) throw ErrorApi.noEncontrado('Turno no encontrado');

    return turnosRepository.actualizarEstado(idTurno, 'falto');
  },
};