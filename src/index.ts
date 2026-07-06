import { Router } from 'express';
import { turnosRouter } from './routes/turnos.routes';
import { disponibilidadRouter } from './routes/disponibilidad.routes';
import { turnosFijosRouter } from './routes/turnosfijos.routes';
import { horariosRouter } from './routes/horarios.routes';
import { perfilesRouter } from './routes/perfiles.routes';

export const rutasPrincipales = Router();

rutasPrincipales.use('/turnos', turnosRouter);
rutasPrincipales.use('/disponibilidad', disponibilidadRouter);
rutasPrincipales.use('/turnos-fijos', turnosFijosRouter);
rutasPrincipales.use('/horarios', horariosRouter);
rutasPrincipales.use('/perfiles', perfilesRouter);