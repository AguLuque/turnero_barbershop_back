import { Router } from 'express';
import { horariosController } from '../controllers/horarios.controller';
import { manejarAsync } from '../utils/manejarAsync';
import { requiereAutenticacion, requiereRol } from '../middlewares/auth.middleware';

export const horariosRouter = Router();

horariosRouter.use(requiereAutenticacion, requiereRol('admin', 'superadmin'));

horariosRouter.post('/dia', manejarAsync(horariosController.configurarDia));
horariosRouter.post('/bloqueo', manejarAsync(horariosController.crearBloqueo));