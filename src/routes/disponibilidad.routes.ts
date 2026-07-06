import { Router } from 'express';
import { disponibilidadController } from '../controllers/disponibilidad.controller';
import { manejarAsync } from '../utils/manejarAsync';

export const disponibilidadRouter = Router();

disponibilidadRouter.get('/', manejarAsync(disponibilidadController.obtenerSlotsDelDia));