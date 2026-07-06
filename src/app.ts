import express, { Application } from 'express';
import cors from 'cors';
import { entorno } from './config/entorno.config';
import { rutasPrincipales } from './index';
import { manejadorDeErrores } from './middlewares/errores.middleware';
import { registroPeticiones } from './middlewares/peticion.middleware';

export const app: Application = express();

app.use(cors({ origin: entorno.frontendUrl }));
app.use(express.json());
app.use(registroPeticiones);

app.use('/api', rutasPrincipales);

app.use(manejadorDeErrores);