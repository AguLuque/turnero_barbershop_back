import { Request, Response } from 'express';
import { turnosFijosService } from '../service/turnosfijos.service';
import { ErrorApi } from '../utils/errorApi';

export const turnosFijosController = {
  async crear(req: Request, res: Response): Promise<void> {
    const { idPeluqueria, idCliente, diaSemana, hora, frecuenciaDias, fechaInicio } = req.body;

    if (!idPeluqueria || !idCliente || diaSemana === undefined || !hora) {
      throw ErrorApi.solicitudInvalida('Faltan datos para crear el turno fijo');
    }

    const turnoFijo = await turnosFijosService.crear({
      id_peluqueria: idPeluqueria,
      id_cliente: idCliente,
      dia_semana: diaSemana,
      hora,
      frecuencia_dias: frecuenciaDias ?? 7,
      fecha_inicio: fechaInicio ?? new Date().toISOString().slice(0, 10),
    });

    res.status(201).json({ turnoFijo });
  },

  async listar(req: Request, res: Response): Promise<void> {
    const { idPeluqueria } = req.query;
    if (typeof idPeluqueria !== 'string') {
      throw ErrorApi.solicitudInvalida('idPeluqueria es requerido');
    }

    const turnosFijos = await turnosFijosService.listarPorPeluqueria(idPeluqueria);
    res.json({ turnosFijos });
  },

  async darDeBaja(req: Request, res: Response): Promise<void> {
    const { idTurnoFijo } = req.params;
    const turnoFijo = await turnosFijosService.darDeBaja(idTurnoFijo);
    res.json({ turnoFijo });
  },

  async generarProximos(req: Request, res: Response): Promise<void> {
    const { idPeluqueria } = req.body;
    if (!idPeluqueria) throw ErrorApi.solicitudInvalida('idPeluqueria es requerido');

    const cantidadGenerados = await turnosFijosService.generarProximosTurnos(idPeluqueria);
    res.json({ cantidadGenerados });
  },
};