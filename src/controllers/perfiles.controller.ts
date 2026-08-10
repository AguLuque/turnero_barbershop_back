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
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const { limit, offset, busqueda } = req.query;

    const resultado = await perfilesService.listarClientesParaAdmin(req.perfil.id_peluqueria, {
      limit: limit !== undefined ? Number(limit) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
      busqueda: typeof busqueda === 'string' ? busqueda : undefined,
    });

    res.json(resultado);
  },
};