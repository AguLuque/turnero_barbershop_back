import { Router } from 'express';
import { turnosController } from '../controllers/turnos.controller';
import { manejarAsync } from '../utils/manejarAsync';
import { requiereAutenticacion, requiereRol } from '../middlewares/auth.middleware';

export const turnosRouter = Router();

turnosRouter.post('/', requiereAutenticacion, manejarAsync(turnosController.reservar));
turnosRouter.get('/mis-turnos', requiereAutenticacion, manejarAsync(turnosController.listarMisTurnos));
turnosRouter.get(
  '/admin',
  requiereAutenticacion,
  requiereRol('admin', 'superadmin'),
  manejarAsync(turnosController.listarPorFecha)
);
turnosRouter.patch('/:idTurno/cancelar', requiereAutenticacion, manejarAsync(turnosController.cancelar));
turnosRouter.patch(
  '/:idTurno/falto',
  requiereAutenticacion,
  requiereRol('admin', 'superadmin'),
  manejarAsync(turnosController.marcarFalto)
);