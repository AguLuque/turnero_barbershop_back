import { Router } from 'express';
import { peluqueriasController } from '../controllers/peluquerias.controller';
import { manejarAsync } from '../utils/manejarAsync';
import { requiereAutenticacion, requiereRol } from '../middlewares/auth.middleware';

export const peluqueriasRouter = Router();

peluqueriasRouter.get('/actual', manejarAsync(peluqueriasController.obtenerActual));
peluqueriasRouter.patch(
  '/actual',
  requiereAutenticacion,
  requiereRol('admin', 'superadmin'),
  manejarAsync(peluqueriasController.actualizarDuracion)
);