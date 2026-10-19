import { Request, Response } from 'express';
import { serviciosService } from '../service/servicios.service';
import { ErrorApi } from '../utils/errorApi';

export const serviciosController = {
  async listarActivos(req: Request, res: Response): Promise<void> {
    const { idPeluqueria } = req.query;
    if (typeof idPeluqueria !== 'string' || !idPeluqueria) {
      throw ErrorApi.solicitudInvalida('idPeluqueria es requerido');
    }

    const servicios = await serviciosService.listarActivos(idPeluqueria);
    res.json({ servicios });
  },

  async listarParaAdmin(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const servicios = await serviciosService.listarParaAdmin(req.perfil.id_peluqueria);
    res.json({ servicios });
  },

  async crear(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const servicio = await serviciosService.crear(req.perfil.id_peluqueria, req.body ?? {});
    res.status(201).json({ servicio });
  },

  async reordenar(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const servicios = await serviciosService.reordenar(req.perfil.id_peluqueria, req.body?.ids);
    res.json({ servicios });
  },

  async actualizar(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const { idServicio } = req.params;
    const servicio = await serviciosService.actualizar(idServicio, req.perfil.id_peluqueria, req.body ?? {});
    res.json({ servicio });
  },

  async eliminar(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const { idServicio } = req.params;
    await serviciosService.eliminar(idServicio, req.perfil.id_peluqueria);
    res.json({ eliminado: true });
  },
};
