import { turnosRepository } from '../repository/turnos.repository';
import { peluqueriasRepository } from '../repository/peluquerias.repository';
import { disponibilidadService } from './disponibilidad.service';
import { turnosFijosService } from './turnosfijos.service';
import { obtenerFechaHoyArgentina } from '../utils/fechaHoraArgentina';
import { ErrorApi } from '../utils/errorApi';
import { NuevoTurnoInput, Turno } from '../types/dominio.types';

function esHoy(fecha: string): boolean {
  return fecha === obtenerFechaHoyArgentina();
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

  async listarPorCliente(idCliente: string, idPeluqueria: string | null): Promise<Turno[]> {
    if (idPeluqueria) {
      await turnosRepository.marcarVencidosComoCompletados(idPeluqueria);
    }
    return turnosRepository.buscarPorCliente(idCliente);
  },

  async listarPorFecha(idPeluqueria: string, fecha: string): Promise<Turno[]> {
    // Materializa cualquier turno fijo que corresponda a esta fecha antes de listar,
    // asi el admin ve siempre el turno real (con id valido para poder gestionarlo).
    await turnosFijosService.materializarParaFecha(idPeluqueria, fecha);
    return turnosRepository.buscarPorPeluqueriaYFechaTodos(idPeluqueria, fecha);
  },

  async cancelar(
    idTurno: string,
    perfilQueCancela: { id: string; rol: string; id_peluqueria: string | null }
  ): Promise<Turno> {
    const turno = await turnosRepository.buscarPorId(idTurno);
    if (!turno) throw ErrorApi.noEncontrado('Turno no encontrado');

    const esDueño = turno.id_cliente === perfilQueCancela.id;
    const esStaffDeEstaPeluqueria =
      (perfilQueCancela.rol === 'admin' || perfilQueCancela.rol === 'superadmin') &&
      turno.id_peluqueria === perfilQueCancela.id_peluqueria;
    if (!esDueño && !esStaffDeEstaPeluqueria) {
      throw ErrorApi.noAutorizado('No podes cancelar un turno que no es tuyo');
    }

    if (turno.estado !== 'confirmado') {
      throw ErrorApi.solicitudInvalida('Solo se pueden cancelar turnos confirmados');
    }

    const seAplicaRecargo = esHoy(turno.fecha);
    return turnosRepository.actualizarEstado(idTurno, 'cancelado', seAplicaRecargo);
  },

  async marcarFalto(idTurno: string, idPeluqueriaAdmin: string | null): Promise<Turno> {
    const turno = await turnosRepository.buscarPorId(idTurno);
    if (!turno) throw ErrorApi.noEncontrado('Turno no encontrado');

    if (turno.id_peluqueria !== idPeluqueriaAdmin) {
      throw ErrorApi.noAutorizado('No podes gestionar turnos de otra peluqueria');
    }

    const hoy = obtenerFechaHoyArgentina();
    if (turno.fecha > hoy) {
      throw ErrorApi.solicitudInvalida('No se puede marcar falto a un turno que todavía no ocurrió');
    }

    if (turno.estado !== 'confirmado') {
      throw ErrorApi.solicitudInvalida('Solo se pueden marcar como falto turnos confirmados');
    }

    return turnosRepository.actualizarEstado(idTurno, 'falto');
  },

  async listarHistorialParaAdmin(
    idPeluqueria: string,
    idCliente: string | null,
    nombreCliente: string | null,
    telefonoCliente: string | null
  ): Promise<Turno[]> {
    if (idCliente) {
      return turnosRepository.buscarPorClienteYPeluqueria(idCliente, idPeluqueria);
    }
    if (nombreCliente) {
      return turnosRepository.buscarPorNombreYTelefono(idPeluqueria, nombreCliente, telefonoCliente);
    }
    throw ErrorApi.solicitudInvalida('Falta idCliente o nombreCliente');
  },

};