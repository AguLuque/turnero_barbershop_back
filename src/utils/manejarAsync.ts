import { Request, Response, NextFunction, RequestHandler } from 'express';

type ControladorAsync = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function manejarAsync(controlador: ControladorAsync): RequestHandler {
  return (req, res, next) => {
    controlador(req, res, next).catch(next);
  };
}