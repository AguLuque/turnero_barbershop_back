import cron from 'node-cron';
import { app } from './app';
import { entorno } from './config/entorno.config';
import { turnosService } from './service/turnos.service';
import { recordatoriosTurnoJob } from './jobs/recordatoriosTurno.job';

const INTERVALO_AUTOCOMPLETAR_MS = 15 * 60 * 1000;

function autoCompletarVencidos(): void {
  turnosService.autoCompletarVencidos().catch((error) => {
    console.error('Error al auto-completar turnos vencidos:', error);
  });
}

app.listen(entorno.puerto, () => {
  console.log(`Servidor corriendo en el puerto ${entorno.puerto}`);
  autoCompletarVencidos();
  setInterval(autoCompletarVencidos, INTERVALO_AUTOCOMPLETAR_MS);

  cron.schedule('*/5 * * * *', () => {
    recordatoriosTurnoJob.ejecutar();
  });
  console.log('Job de recordatorios de turno programado (cada 5 minutos)');
});