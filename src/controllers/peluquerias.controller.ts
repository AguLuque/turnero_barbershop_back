import { Request, Response } from 'express';
import { peluqueriasRepository } from '../repository/peluquerias.repository';
import { ErrorApi } from '../utils/errorApi';

export const peluqueriasController = {
  async obtenerActual(_req: Request, res: Response): Promise<void> {
    const peluqueria = await peluqueriasRepository.buscarPrimera();
    res.json({ peluqueria });
  },

  async actualizarDuracion(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();

    const { duracionMinutos } = req.body;

    if (typeof duracionMinutos !== 'number' || duracionMinutos < 5 || duracionMinutos > 240) {
      throw ErrorApi.solicitudInvalida('La duracion del turno debe ser un numero entre 5 y 240 minutos');
    }

    const peluqueria = await peluqueriasRepository.actualizarDuracion(req.perfil.id_peluqueria, duracionMinutos);
    res.json({ peluqueria });
  },
};