import { Request, Response } from 'express';
import { perfilesService } from '../service/perfiles.service';
import { ErrorApi } from '../utils/errorApi';

export const perfilesController = {
  async obtenerMiPerfil(req: Request, res: Response): Promise<void> {
    if (!req.perfil) throw ErrorApi.noAutorizado();
    const perfil = await perfilesService.obtenerPerfil(req.perfil.id);
    res.json({ perfil });
  },

  async actualizarMiPerfil(req: Request, res: Response): Promise<void> {
    if (!req.perfil) throw ErrorApi.noAutorizado();

    const { nombreCompleto, telefono, fotoUrl } = req.body;
    const perfil = await perfilesService.actualizarPerfil(req.perfil.id, {
      ...(nombreCompleto !== undefined && { nombre_completo: nombreCompleto }),
      ...(telefono !== undefined && { telefono }),
      ...(fotoUrl !== undefined && { foto_url: fotoUrl }),
    });

    res.json({ perfil });
  },

  async listarClientes(req: Request, res: Response): Promise<void> {
    const { idPeluqueria } = req.query;
    if (typeof idPeluqueria !== 'string') {
      throw ErrorApi.solicitudInvalida('idPeluqueria es requerido');
    }

    const clientes = await perfilesService.listarClientesConRanking(idPeluqueria);
    res.json({ clientes });
  },
};