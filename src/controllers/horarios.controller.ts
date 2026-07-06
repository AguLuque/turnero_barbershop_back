import { Request, Response } from 'express';
import { horariosService } from '../service/horarios.service';
import { ErrorApi } from '../utils/errorApi';

export const horariosController = {
  async configurarDia(req: Request, res: Response): Promise<void> {
    const { idPeluqueria, diaSemana, horaInicio, horaFin } = req.body;

    if (!idPeluqueria || diaSemana === undefined || !horaInicio || !horaFin) {
      throw ErrorApi.solicitudInvalida('Faltan datos para configurar el horario');
    }

    const horario = await horariosService.configurarDia({
      id_peluqueria: idPeluqueria,
      dia_semana: diaSemana,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
    });

    res.status(201).json({ horario });
  },

  async crearBloqueo(req: Request, res: Response): Promise<void> {
    const { idPeluqueria, fecha, horaInicio, horaFin, motivo } = req.body;

    if (!idPeluqueria || !fecha) {
      throw ErrorApi.solicitudInvalida('Faltan datos para crear el bloqueo');
    }

    const bloqueo = await horariosService.crearBloqueo({
      id_peluqueria: idPeluqueria,
      fecha,
      hora_inicio: horaInicio ?? null,
      hora_fin: horaFin ?? null,
      motivo: motivo ?? null,
    });

    res.status(201).json({ bloqueo });
  },
};