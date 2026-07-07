import { Request, Response } from 'express';
import { horariosService } from '../service/horarios.service';
import { ErrorApi } from '../utils/errorApi';

export const horariosController = {
  async agregarFranjaHoraria(req: Request, res: Response): Promise<void> {
    const { idPeluqueria, diaSemana, horaInicio, horaFin } = req.body;

    if (!idPeluqueria || diaSemana === undefined || !horaInicio || !horaFin) {
      throw ErrorApi.solicitudInvalida('Faltan datos para agregar la franja horaria');
    }

    const franja = await horariosService.agregarFranjaHoraria({
      id_peluqueria: idPeluqueria,
      dia_semana: diaSemana,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
    });

    res.status(201).json({ franja });
  },

  async eliminarFranjaHoraria(req: Request, res: Response): Promise<void> {
    const { idFranja } = req.params;
    await horariosService.eliminarFranjaHoraria(idFranja);
    res.status(204).send();
  },

  async listarFranjasDelDia(req: Request, res: Response): Promise<void> {
    const { idPeluqueria, diaSemana } = req.query;

    if (typeof idPeluqueria !== 'string' || diaSemana === undefined) {
      throw ErrorApi.solicitudInvalida('idPeluqueria y diaSemana son requeridos');
    }

    const franjas = await horariosService.obtenerFranjasDelDia(idPeluqueria, Number(diaSemana));
    res.json({ franjas });
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