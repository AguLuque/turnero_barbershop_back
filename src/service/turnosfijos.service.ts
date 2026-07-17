import { turnosFijosRepository } from '../repository/turnosfijos.repository';
import { turnosRepository } from '../repository/turnos.repository';
import { horariosRepository } from '../repository/horarios.repository';
import { peluqueriasRepository } from '../repository/peluquerias.repository';
import { ErrorApi } from '../utils/errorApi';
import { TurnoFijo } from '../types/dominio.types';

const DIAS_DE_ANTICIPACION = 14;

function sumarDias(fecha: string, dias: number): string {
  const nuevaFecha = new Date(`${fecha}T00:00:00`);
  nuevaFecha.setDate(nuevaFecha.getDate() + dias);
  return nuevaFecha.toISOString().slice(0, 10);
}

function calcularProximaFecha(turnoFijo: TurnoFijo, ultimaFechaGenerada: string | null): string {
  if (!ultimaFechaGenerada) return turnoFijo.fecha_inicio;
  return sumarDias(ultimaFechaGenerada, turnoFijo.frecuencia_dias);
}

function estaDentroDeLaVentana(fecha: string): boolean {
  const hoy = new Date().toISOString().slice(0, 10);
  const limite = sumarDias(hoy, DIAS_DE_ANTICIPACION);
  return fecha >= hoy && fecha <= limite;
}

async function horaEstaBloqueada(idPeluqueria: string, fecha: string, hora: string): Promise<boolean> {
  const bloqueos = await horariosRepository.buscarBloqueosPorFecha(idPeluqueria, fecha);
  return bloqueos.some(
    (bloqueo) => !bloqueo.hora_inicio || (hora >= bloqueo.hora_inicio && hora < (bloqueo.hora_fin ?? '23:59'))
  );
}

export const turnosFijosService = {
  async crear(datos: Omit<TurnoFijo, 'id' | 'activo' | 'creado_en'>): Promise<TurnoFijo> {
    if (!datos.id_cliente && !datos.nombre_cliente?.trim()) {
      throw ErrorApi.solicitudInvalida('Falta el nombre del cliente para el turno fijo');
    }
    return turnosFijosRepository.crear(datos);
  },

  async listarPorPeluqueria(idPeluqueria: string): Promise<TurnoFijo[]> {
    return turnosFijosRepository.buscarPorPeluqueria(idPeluqueria);
  },

  async darDeBaja(idTurnoFijo: string): Promise<TurnoFijo> {
    const turnoFijo = await turnosFijosRepository.buscarPorId(idTurnoFijo);
    if (!turnoFijo) throw ErrorApi.noEncontrado('Turno fijo no encontrado');

    return turnosFijosRepository.darDeBaja(idTurnoFijo);
  },

  // Genera el proximo turno real de cada regla activa, si entra en la ventana de anticipacion
  // y el horario no esta bloqueado. Pensado para llamarse desde un endpoint o cron periodico.
  async generarProximosTurnos(idPeluqueria: string): Promise<number> {
    const reglasActivas = await turnosFijosRepository.buscarPorPeluqueria(idPeluqueria);
    const peluqueria = await peluqueriasRepository.buscarPorId(idPeluqueria);

    let generados = 0;

    for (const regla of reglasActivas) {
      const ultimoTurno = await turnosRepository.buscarUltimoPorTurnoFijo(regla.id);
      const proximaFecha = calcularProximaFecha(regla, ultimoTurno?.fecha ?? null);

      if (!estaDentroDeLaVentana(proximaFecha)) continue;
      if (await horaEstaBloqueada(idPeluqueria, proximaFecha, regla.hora)) continue;

      await turnosRepository.crear(
        {
          id_peluqueria: idPeluqueria,
          id_cliente: regla.id_cliente,
          nombre_cliente: regla.nombre_cliente ?? 'Cliente turno fijo',
          telefono_cliente: regla.telefono_cliente ?? undefined,
          fecha: proximaFecha,
          hora: regla.hora,
          creado_por: 'admin',
          id_turno_fijo: regla.id,
        },
        peluqueria.precio_corte
      );
      generados++;
    }

    return generados;
  },

  // Se llama cada vez que se consulta una fecha puntual (ej: el admin navega a un dia
  // futuro). Si ese dia le corresponde a alguna regla de turno fijo activa y todavia
  // no existe el turno real para esa fecha, lo crea en el momento. Asi el admin siempre
  // ve el turno con un id real (puede cancelarlo o marcarlo falto sin problema) y el
  // horario queda automaticamente ocupado para los clientes.
  async materializarParaFecha(idPeluqueria: string, fecha: string): Promise<void> {
    const diaSemana = new Date(`${fecha}T00:00:00`).getDay();
    const reglasActivas = await turnosFijosRepository.buscarPorPeluqueria(idPeluqueria);

    const reglasDelDia = reglasActivas.filter(
      (regla) => regla.dia_semana === diaSemana && regla.fecha_inicio <= fecha
    );

    if (reglasDelDia.length === 0) return;

    const peluqueria = await peluqueriasRepository.buscarPorId(idPeluqueria);

    for (const regla of reglasDelDia) {
      const yaExiste = await turnosRepository.buscarPorTurnoFijoYFecha(regla.id, fecha);
      if (yaExiste) continue;

      if (await horaEstaBloqueada(idPeluqueria, fecha, regla.hora)) continue;

      try {
        await turnosRepository.crear(
          {
            id_peluqueria: idPeluqueria,
            id_cliente: regla.id_cliente,
            nombre_cliente: regla.nombre_cliente ?? 'Cliente turno fijo',
            telefono_cliente: regla.telefono_cliente ?? undefined,
            fecha,
            hora: regla.hora,
            creado_por: 'admin',
            id_turno_fijo: regla.id,
          },
          peluqueria.precio_corte
        );
      } catch (error) {
        // Si dos peticiones concurrentes (ej. Strict Mode del front, o dos pestañas)
        // intentan materializar el mismo turno fijo al mismo tiempo, la primera gana
        // y la segunda choca contra la constraint unica. Eso no es un error real para
        // el usuario: el turno ya quedo creado, asi que simplemente lo ignoramos.
        if (!(error instanceof ErrorApi && error.codigoEstado === 409)) {
          throw error;
        }
      }
    }
  },
};