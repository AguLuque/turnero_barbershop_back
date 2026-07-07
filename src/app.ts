import express, { Application } from 'express';
import cors from 'cors';
import { entorno } from './config/entorno.config';
import { rutasPrincipales } from './index';
import { manejadorDeErrores } from './middlewares/errores.middleware';
import { registroPeticiones } from './middlewares/peticion.middleware';

export const app: Application = express();

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

app.use('/api', rutasPrincipales);

app.use(manejadorDeErrores);