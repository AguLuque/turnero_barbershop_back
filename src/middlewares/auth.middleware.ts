import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/db.config';
import { ErrorApi } from '../utils/errorApi';
import { Perfil } from '../types/dominio.types';

declare global {
  namespace Express {
    interface Request {
      perfil?: Perfil;
    }
  }
}

export async function requiereAutenticacion(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const encabezado = req.headers.authorization;
    if (!encabezado?.startsWith('Bearer ')) {
      throw ErrorApi.noAutorizado('Falta el token de autenticacion');
    }

    const token = encabezado.replace('Bearer ', '');
    const { data: datosUsuario, error: errorToken } = await supabase.auth.getUser(token);

    if (errorToken || !datosUsuario.user) {
      throw ErrorApi.noAutorizado('Token invalido o expirado');
    }

    const { data: perfil, error: errorPerfil } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', datosUsuario.user.id)
      .single();

    if (errorPerfil || !perfil) {
      throw ErrorApi.noEncontrado('Perfil no encontrado para este usuario');
    }

    req.perfil = perfil as Perfil;
    next();
  } catch (error) {
    next(error);
  }
}

export function requiereRol(...rolesPermitidos: Array<'admin' | 'superadmin' | 'cliente'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.perfil || !rolesPermitidos.includes(req.perfil.rol)) {
      next(ErrorApi.noAutorizado('No tenes permisos para esta accion'));
      return;
    }
    next();
  };
}