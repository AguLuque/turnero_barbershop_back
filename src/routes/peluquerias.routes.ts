import { Router } from 'express';
import { peluqueriasController } from '../controllers/peluquerias.controller';
import { manejarAsync } from '../utils/manejarAsync';

export const peluqueriasRouter = Router();

peluqueriasRouter.get('/actual', manejarAsync(peluqueriasController.obtenerActual));