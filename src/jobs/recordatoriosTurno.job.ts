import { turnosRepository } from '../repository/turnos.repository';
import { notificacionesPushService } from '../service/notificacionesPush.service';
import { obtenerFechaHoraConMargen } from '../utils/fechaHoraArgentina';

export const recordatoriosTurnoJob = {
  // Busca turnos confirmados que empiezan en aprox. 1 hora (ventana de 55 a 65
  // minutos, para tolerar que el cron corre cada 5) y les manda un push de
  // recordatorio. Se ejecuta en background: nunca debe tirar una excepcion
  // hacia arriba, solo loguear si algo sale mal.
  async ejecutar(): Promise<void> {
    try {
      const desde = obtenerFechaHoraConMargen(55);
      const hasta = obtenerFechaHoraConMargen(65);

      const turnos = await turnosRepository.buscarPendientesDeRecordatorio(desde, hasta);

      for (const turno of turnos) {
        if (turno.id_cliente) {
          await notificacionesPushService.enviarPush(turno.id_cliente, {
            title: 'Recordatorio de turno',
            body: `Tu turno es a las ${turno.hora.slice(0, 5)} hs`,
          });
        }

        // Se marca como enviado siempre, haya salido bien o mal el push puntual,
        // para no reintentar infinitamente en las proximas corridas del cron.
        await turnosRepository.marcarRecordatorioEnviado(turno.id);
      }
    } catch (error) {
      console.error('Error al ejecutar el job de recordatorios de turno:', error);
    }
  },
};
