import { Request, Response, NextFunction } from 'express';
import { ErrorApi } from '../utils/errorApi';

export function manejadorDeErrores(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof ErrorApi) {
    res.locals.errorRespuesta = { mensaje: error.message, codigoEstado: error.codigoEstado };
    res.status(error.codigoEstado).json({ error: error.message });
    return;
  }

  res.locals.errorRespuesta = { mensaje: error.message, stack: error.stack };
  console.error('Error no controlado:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
}