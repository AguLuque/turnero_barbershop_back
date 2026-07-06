import { Router } from 'express';
import { perfilesController } from '../controllers/perfiles.controller';
import { manejarAsync } from '../utils/manejarAsync';
import { requiereAutenticacion, requiereRol } from '../middlewares/auth.middleware';

export const perfilesRouter = Router();

perfilesRouter.get('/mi-perfil', requiereAutenticacion, manejarAsync(perfilesController.obtenerMiPerfil));
perfilesRouter.patch('/mi-perfil', requiereAutenticacion, manejarAsync(perfilesController.actualizarMiPerfil));
perfilesRouter.get(
  '/clientes',
  requiereAutenticacion,
  requiereRol('admin', 'superadmin'),
  manejarAsync(perfilesController.listarClientes)
);