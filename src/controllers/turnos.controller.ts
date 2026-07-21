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

    const esStaff = req.perfil?.rol === 'admin' || req.perfil?.rol === 'superadmin';

    const datos: NuevoTurnoInput = {
      id_peluqueria: idPeluqueria,
      id_cliente: esStaff ? null : (req.perfil?.id ?? null),
      nombre_cliente: nombreCliente,
      telefono_cliente: telefonoCliente,
      fecha,
      hora,
      creado_por: esStaff ? 'admin' : 'cliente',
    };

    const turno = await turnosService.reservar(datos);
    res.status(201).json({ turno });
  },

  async listarMisTurnos(req: Request, res: Response): Promise<void> {
    if (!req.perfil) throw ErrorApi.noAutorizado();
    const turnos = await turnosService.listarPorCliente(req.perfil.id, req.perfil.id_peluqueria);
    res.json({ turnos });
  },

  async listarPorFecha(req: Request, res: Response): Promise<void> {
    const { fecha } = req.query;
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    if (typeof fecha !== 'string') throw ErrorApi.solicitudInvalida('fecha es requerida');

    const turnos = await turnosService.listarPorFecha(req.perfil.id_peluqueria, fecha);
    res.json({ turnos });
  },

  async cancelar(req: Request, res: Response): Promise<void> {
    if (!req.perfil) throw ErrorApi.noAutorizado();
    const { idTurno } = req.params;
    const turno = await turnosService.cancelar(idTurno, {
      id: req.perfil.id,
      rol: req.perfil.rol,
      id_peluqueria: req.perfil.id_peluqueria,
    });
    res.json({ turno });
  },

  async marcarFalto(req: Request, res: Response): Promise<void> {
    if (!req.perfil) throw ErrorApi.noAutorizado();
    const { idTurno } = req.params;
    const turno = await turnosService.marcarFalto(idTurno, req.perfil.id_peluqueria);
    res.json({ turno });
  },

  async listarHistorialParaAdmin(req: Request, res: Response): Promise<void> {
    if (!req.perfil?.id_peluqueria) throw ErrorApi.noAutorizado();
    const { idCliente, nombreCliente, telefonoCliente } = req.query;

    const turnos = await turnosService.listarHistorialParaAdmin(
      req.perfil.id_peluqueria,
      typeof idCliente === 'string' ? idCliente : null,
      typeof nombreCliente === 'string' ? nombreCliente : null,
      typeof telefonoCliente === 'string' ? telefonoCliente : null
    );
    res.json({ turnos });
  },

};