import { Request, Response } from 'express';
import { disponibilidadService } from '../service/disponibilidad.service';
import { peluqueriasRepository } from '../repository/peluquerias.repository';
import { ErrorApi } from '../utils/errorApi';

export const disponibilidadController = {
  async obtenerSlotsDelDia(req: Request, res: Response): Promise<void> {
    const { idPeluqueria, fecha } = req.query;

    if (typeof idPeluqueria !== 'string' || typeof fecha !== 'string') {
      throw ErrorApi.solicitudInvalida('idPeluqueria y fecha son requeridos');
    }

    const peluqueria = await peluqueriasRepository.buscarPorId(idPeluqueria);
    const slots = await disponibilidadService.calcularSlotsDelDia(
      idPeluqueria,
      fecha,
      peluqueria.duracion_turno_minutos
    );

    res.json({ slots });
  },
};