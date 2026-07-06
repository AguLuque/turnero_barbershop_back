import { Request, Response, NextFunction } from 'express';

const COLOR_RESET = '\x1b[0m';
const COLOR_VERDE = '\x1b[32m';
const COLOR_AMARILLO = '\x1b[33m';
const COLOR_ROJO = '\x1b[31m';
const COLOR_GRIS = '\x1b[90m';

function colorSegunStatus(status: number): string {
  if (status >= 500) return COLOR_ROJO;
  if (status >= 400) return COLOR_AMARILLO;
  return COLOR_VERDE;
}

export function registroPeticiones(req: Request, res: Response, next: NextFunction): void {
  const inicio = Date.now();
  const { method, originalUrl, body, query, params } = req;

  res.on('finish', () => {
    const duracionMs = Date.now() - inicio;
    const color = colorSegunStatus(res.statusCode);

    console.log(
      `${color}[${method}] ${originalUrl} -> ${res.statusCode}${COLOR_RESET} ${COLOR_GRIS}(${duracionMs}ms)${COLOR_RESET}`
    );

    if (Object.keys(query).length > 0) {
      console.log(`${COLOR_GRIS}  query:${COLOR_RESET}`, query);
    }
    if (Object.keys(params).length > 0) {
      console.log(`${COLOR_GRIS}  params:${COLOR_RESET}`, params);
    }
    if (body && Object.keys(body).length > 0) {
      console.log(`${COLOR_GRIS}  body:${COLOR_RESET}`, body);
    }

    if (res.statusCode >= 400) {
      const errorGuardado = res.locals.errorRespuesta;
      if (errorGuardado) {
        console.log(`${COLOR_ROJO}  error:${COLOR_RESET}`, errorGuardado);
      }
    }
  });

  next();
}