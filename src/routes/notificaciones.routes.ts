import { Router } from 'express';
import { notificacionesController } from '../controllers/notificaciones.controller';
import { manejarAsync } from '../utils/manejarAsync';
import { requiereAutenticacion } from '../middlewares/auth.middleware';

export const notificacionesRouter = Router();

notificacionesRouter.post(
  '/suscribir',
  requiereAutenticacion,
  manejarAsync(notificacionesController.suscribir)
);
