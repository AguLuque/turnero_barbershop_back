import { app } from './app';
import { entorno } from './config/entorno.config';

app.listen(entorno.puerto, () => {
  console.log(`Servidor corriendo en el puerto ${entorno.puerto}`);
});