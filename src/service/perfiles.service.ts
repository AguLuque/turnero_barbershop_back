import { perfilesRepository } from '../repository/perfiles.repository';
import { turnosRepository } from '../repository/turnos.repository';
import { ErrorApi } from '../utils/errorApi';
import { ClienteConRanking, Perfil } from '../types/dominio.types';

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

  async listarClientesConRanking(idPeluqueria: string): Promise<ClienteConRanking[]> {
    const [clientes, turnos] = await Promise.all([
      perfilesRepository.buscarPorPeluqueria(idPeluqueria),
      turnosRepository.buscarTodosPorPeluqueria(idPeluqueria),
    ]);

    const cantidadPorCliente = new Map<string, number>();
    for (const turno of turnos) {
      if (!turno.id_cliente) continue;
      cantidadPorCliente.set(turno.id_cliente, (cantidadPorCliente.get(turno.id_cliente) ?? 0) + 1);
    }

    return clientes
      .map((perfil) => ({
        perfil,
        cantidadTurnos: cantidadPorCliente.get(perfil.id) ?? 0,
      }))
      .sort((a, b) => b.cantidadTurnos - a.cantidadTurnos);
  },
};