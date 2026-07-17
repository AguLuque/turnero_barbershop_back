import { perfilesRepository } from '../repository/perfiles.repository';
import { turnosRepository } from '../repository/turnos.repository';
import { ErrorApi } from '../utils/errorApi';
import { turnosFijosRepository } from '../repository/turnosfijos.repository';
import { ClienteAdmin, Perfil } from '../types/dominio.types';

export const perfilesService = {
  async obtenerPerfil(idPerfil: string): Promise<Perfil> {
    return perfilesRepository.buscarPorId(idPerfil);
  },

  async actualizarPerfil(
    idPerfil: string,
    cambios: Partial<Pick<Perfil, 'nombre_completo' | 'telefono' | 'foto_url'>>
  ): Promise<Perfil> {
    if (Object.keys(cambios).length === 0) {
      throw ErrorApi.solicitudInvalida('No se enviaron datos para actualizar');
    }
    return perfilesRepository.actualizar(idPerfil, cambios);
  },

  // Combina dos fuentes en una sola lista para el admin:
  // 1. Clientes con cuenta registrada, ordenados por cantidad de turnos.
  // 2. Clientes que solo tienen un turno fijo cargado por el admin (sin cuenta),
  //    que se muestran con la etiqueta "Cliente fijo" en vez de un contador de turnos.
  async listarClientesParaAdmin(idPeluqueria: string): Promise<ClienteAdmin[]> {
    const [perfilesClientes, turnos, turnosFijosActivos] = await Promise.all([
      perfilesRepository.buscarPorPeluqueria(idPeluqueria),
      turnosRepository.buscarTodosPorPeluqueria(idPeluqueria),
      turnosFijosRepository.buscarPorPeluqueria(idPeluqueria),
    ]);

    const cantidadPorCliente = new Map<string, number>();
    for (const turno of turnos) {
      if (!turno.id_cliente) continue;
      cantidadPorCliente.set(turno.id_cliente, (cantidadPorCliente.get(turno.id_cliente) ?? 0) + 1);
    }

    const idsClientesConTurnoFijo = new Set(
      turnosFijosActivos.filter((tf) => tf.id_cliente).map((tf) => tf.id_cliente as string)
    );

    const registrados: ClienteAdmin[] = perfilesClientes
      .map((perfil) => ({
        id: perfil.id,
        nombre: perfil.nombre_completo ?? 'Cliente sin nombre',
        telefono: perfil.telefono,
        esFijo: idsClientesConTurnoFijo.has(perfil.id),
        cantidadTurnos: cantidadPorCliente.get(perfil.id) ?? 0,
      }))
      .sort((a, b) => b.cantidadTurnos - a.cantidadTurnos);

    // Turnos fijos cargados sin cuenta (id_cliente null): se agrupan por
    // nombre+telefono para no duplicar si el mismo cliente tiene mas de una
    // regla fija cargada.
    const fijosSinCuentaPorClave = new Map<string, ClienteAdmin>();
    for (const tf of turnosFijosActivos) {
      if (tf.id_cliente) continue;
      const nombre = tf.nombre_cliente?.trim() || 'Cliente sin nombre';
      const clave = `${nombre.toLowerCase()}|${tf.telefono_cliente ?? ''}`;
      if (!fijosSinCuentaPorClave.has(clave)) {
        fijosSinCuentaPorClave.set(clave, {
          id: `fijo-${tf.id}`,
          nombre,
          telefono: tf.telefono_cliente,
          esFijo: true,
          cantidadTurnos: 0,
        });
      }
    }

    return [...registrados, ...fijosSinCuentaPorClave.values()];
  },
};