import { Router } from 'express';
import { turnosFijosController } from '../controllers/turnosfijos.controller';
import { manejarAsync } from '../utils/manejarAsync';
import { requiereAutenticacion, requiereRol } from '../middlewares/auth.middleware';

export const turnosFijosRouter = Router();

turnosFijosRouter.use(requiereAutenticacion, requiereRol('admin', 'superadmin'));

turnosFijosRouter.post('/', manejarAsync(turnosFijosController.crear));
turnosFijosRouter.get('/', manejarAsync(turnosFijosController.listar));
turnosFijosRouter.patch('/:idTurnoFijo/baja', manejarAsync(turnosFijosController.darDeBaja));
turnosFijosRouter.post('/generar-proximos', manejarAsync(turnosFijosController.generarProximos));