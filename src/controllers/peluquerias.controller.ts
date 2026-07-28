import { Request, Response } from 'express';
import { peluqueriasRepository } from '../repository/peluquerias.repository';

export const peluqueriasController = {
  async obtenerActual(_req: Request, res: Response): Promise<void> {
    const peluqueria = await peluqueriasRepository.buscarPrimera();
    res.json({ peluqueria });
  },
};