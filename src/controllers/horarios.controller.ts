import { Request, Response } from 'express';
import { horariosService } from '../service/horarios.service';
import { ErrorApi } from '../utils/errorApi';

export const horariosController = {
  async agregarFranjaHoraria(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const { diaSemana, horaInicio, horaFin } = req.body;

    if (diaSemana === undefined || !horaInicio || !horaFin) {
      throw ErrorApi.solicitudInvalida('Faltan datos para agregar la franja horaria');
    }

    const franja = await horariosService.agregarFranjaHoraria({
      id_peluqueria: req.perfil.id_peluqueria,
      dia_semana: diaSemana,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
    });

    res.status(201).json({ franja });
  },

  async eliminarFranjaHoraria(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const { idFranja } = req.params;
    const { turnosCancelados } = await horariosService.eliminarFranjaHoraria(
      idFranja,
      req.perfil.id_peluqueria
    );
    res.json({ eliminado: true, turnosCancelados });
  },

  async listarFranjasDelDia(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const { diaSemana } = req.query;

    if (diaSemana === undefined) {
      throw ErrorApi.solicitudInvalida('diaSemana es requerido');
    }

    const franjas = await horariosService.obtenerFranjasDelDia(req.perfil.id_peluqueria, Number(diaSemana));
    res.json({ franjas });
  },

  async crearBloqueo(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const { fecha, horaInicio, horaFin, motivo, tipo } = req.body;

    if (!fecha) {
      throw ErrorApi.solicitudInvalida('Faltan datos para crear el bloqueo');
    }

    if (tipo !== undefined && tipo !== 'bloqueado' && tipo !== 'orden_llegada') {
      throw ErrorApi.solicitudInvalida("El tipo de bloqueo debe ser 'bloqueado' u 'orden_llegada'");
    }

    const { bloqueo, turnosCancelados } = await horariosService.crearBloqueo({
      id_peluqueria: req.perfil.id_peluqueria,
      fecha,
      hora_inicio: horaInicio ?? null,
      hora_fin: horaFin ?? null,
      motivo: motivo ?? null,
      tipo,
    });

    res.status(201).json({ bloqueo, turnosCancelados });
  },

  async listarBloqueos(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const { limit, offset } = req.query;

    const resultado = await horariosService.listarBloqueos(req.perfil.id_peluqueria, {
      limit: limit !== undefined ? Number(limit) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
    });

    res.json(resultado);
  },

  async eliminarBloqueo(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const { idBloqueo } = req.params;
    await horariosService.eliminarBloqueo(idBloqueo, req.perfil.id_peluqueria);
    res.status(200).json({ eliminado: true });
  },
};