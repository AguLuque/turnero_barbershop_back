import { Request, Response } from 'express';
import { notificacionesPushService } from '../service/notificacionesPush.service';
import { ErrorApi } from '../utils/errorApi';

export const notificacionesController = {
  async suscribir(req: Request, res: Response): Promise<void> {
    if (!req.perfil) throw ErrorApi.noAutorizado();

    const { endpoint, p256dh, auth } = req.body;
    if (!endpoint || !p256dh || !auth) {
      throw ErrorApi.solicitudInvalida('Faltan datos de la suscripcion push');
    }

    const suscripcion = await notificacionesPushService.suscribir(req.perfil.id, endpoint, p256dh, auth);
    res.status(201).json({ suscripcion });
  },
};
