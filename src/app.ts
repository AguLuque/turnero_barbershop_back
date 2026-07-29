import express, { Application } from 'express';
import cors from 'cors';
import { entorno } from './config/entorno.config';
import { rutasPrincipales } from './index';
import { manejadorDeErrores } from './middlewares/errores.middleware';
import { registroPeticiones } from './middlewares/peticion.middleware';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

export const app: Application = express();

const limitadorGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // maximo de peticiones por IP en esa ventana
  message: { error: 'Demasiadas peticiones. Intentá de nuevo en unos minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const limitadorReservas = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // maximo de reservas/cancelaciones por IP en esa ventana
  message: { error: 'Demasiados intentos. Esperá unos minutos antes de reservar de nuevo.' },
});

// Desactivado a proposito: en una API donde los datos cambian todo el tiempo,
// el ETag automatico de Express puede hacer que el navegador reciba un 304
// (sin body) en vez de la data real, rompiendo el parseo de la respuesta.
app.set('etag', false);
app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use(cors({ origin: entorno.frontendUrl }));
app.use(express.json());
app.use(registroPeticiones);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', rutasPrincipales);

app.use(manejadorDeErrores);

app.use('/api', limitadorGeneral);
app.use('/api/turnos', limitadorReservas);
app.use(helmet());