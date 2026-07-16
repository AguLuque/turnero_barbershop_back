import { Router } from 'express';
import { horariosController } from '../controllers/horarios.controller';
import { manejarAsync } from '../utils/manejarAsync';
import { requiereAutenticacion, requiereRol } from '../middlewares/auth.middleware';

export const horariosRouter = Router();

horariosRouter.use(requiereAutenticacion, requiereRol('admin', 'superadmin'));

horariosRouter.get('/dia', manejarAsync(horariosController.listarFranjasDelDia));
horariosRouter.post('/dia', manejarAsync(horariosController.agregarFranjaHoraria));
horariosRouter.delete('/dia/:idFranja', manejarAsync(horariosController.eliminarFranjaHoraria));
horariosRouter.post('/bloqueo', manejarAsync(horariosController.crearBloqueo));
horariosRouter.get('/bloqueo', manejarAsync(horariosController.listarBloqueos));
horariosRouter.delete('/bloqueo/:idBloqueo', manejarAsync(horariosController.eliminarBloqueo));