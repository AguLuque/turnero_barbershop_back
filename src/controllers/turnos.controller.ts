import { Request, Response } from 'express';
import { turnosService } from '../service/turnos.service';
import { ErrorApi } from '../utils/errorApi';
import { NuevoTurnoInput } from '../types/dominio.types';

export const turnosController = {
  async reservar(req: Request, res: Response): Promise<void> {
    const { idPeluqueria, fecha, hora, nombreCliente, telefonoCliente } = req.body;

    if (!idPeluqueria || !fecha || !hora || !nombreCliente) {
      throw ErrorApi.solicitudInvalida('Faltan datos para reservar el turno');
    }

    const datos: NuevoTurnoInput = {
      id_peluqueria: idPeluqueria,
      id_cliente: req.perfil?.id ?? null,
      nombre_cliente: nombreCliente,
      telefono_cliente: telefonoCliente,
      fecha,
      hora,
      creado_por: req.perfil?.rol === 'admin' || req.perfil?.rol === 'superadmin' ? 'admin' : 'cliente',
    };

    const turno = await turnosService.reservar(datos);
    res.status(201).json({ turno });
  },

  async listarMisTurnos(req: Request, res: Response): Promise<void> {
    if (!req.perfil) throw ErrorApi.noAutorizado();
    const turnos = await turnosService.listarPorCliente(req.perfil.id);
    res.json({ turnos });
  },

  async cancelar(req: Request, res: Response): Promise<void> {
    if (!req.perfil) throw ErrorApi.noAutorizado();
    const { idTurno } = req.params;
    const turno = await turnosService.cancelar(idTurno, { id: req.perfil.id, rol: req.perfil.rol });
    res.json({ turno });
  },

  async marcarFalto(req: Request, res: Response): Promise<void> {
    const { idTurno } = req.params;
    const turno = await turnosService.marcarFalto(idTurno);
    res.json({ turno });
  },
};