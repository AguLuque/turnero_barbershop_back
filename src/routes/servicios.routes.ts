import { Router } from 'express';
import { serviciosController } from '../controllers/servicios.controller';
import { manejarAsync } from '../utils/manejarAsync';
import { requiereAutenticacion, requiereRol } from '../middlewares/auth.middleware';

export const serviciosRouter = Router();

const soloStaff = [requiereAutenticacion, requiereRol('admin', 'superadmin')];

// Publico: lo usa el cliente para elegir servicio al reservar.
serviciosRouter.get('/', manejarAsync(serviciosController.listarActivos));

// Panel admin: incluye los servicios desactivados.
serviciosRouter.get('/admin', ...soloStaff, manejarAsync(serviciosController.listarParaAdmin));
serviciosRouter.post('/', ...soloStaff, manejarAsync(serviciosController.crear));
serviciosRouter.patch('/:idServicio', ...soloStaff, manejarAsync(serviciosController.actualizar));
serviciosRouter.delete('/:idServicio', ...soloStaff, manejarAsync(serviciosController.eliminar));
