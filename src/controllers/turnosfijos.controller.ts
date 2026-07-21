import { Request, Response } from 'express';
import { turnosFijosService } from '../service/turnosfijos.service';
import { ErrorApi } from '../utils/errorApi';

export const turnosFijosController = {
  async crear(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const { nombreCliente, telefonoCliente, diaSemana, hora, frecuenciaDias, fechaInicio } = req.body;

    if (diaSemana === undefined || !hora || !nombreCliente?.trim()) {
      throw ErrorApi.solicitudInvalida('Faltan datos para crear el turno fijo');
    }

    const turnoFijo = await turnosFijosService.crear({
      id_peluqueria: req.perfil.id_peluqueria,
      id_cliente: null,
      nombre_cliente: nombreCliente.trim(),
      telefono_cliente: telefonoCliente?.trim() || null,
      dia_semana: diaSemana,
      hora,
      frecuencia_dias: frecuenciaDias ?? 7,
      fecha_inicio: fechaInicio ?? new Date().toISOString().slice(0, 10),
    });

    res.status(201).json({ turnoFijo });
  },

  async listar(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();

    const turnosFijos = await turnosFijosService.listarPorPeluqueria(req.perfil.id_peluqueria);
    res.json({ turnosFijos });
  },

  async darDeBaja(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const { idTurnoFijo } = req.params;
    const turnoFijo = await turnosFijosService.darDeBaja(idTurnoFijo, req.perfil.id_peluqueria);
    res.json({ turnoFijo });
  },

  async generarProximos(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();

    const cantidadGenerados = await turnosFijosService.generarProximosTurnos(req.perfil.id_peluqueria);
    res.json({ cantidadGenerados });
  },
};