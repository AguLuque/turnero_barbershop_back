import webpush from 'web-push';
import { entorno } from '../config/entorno.config';
import { suscripcionesPushRepository } from '../repository/suscripcionesPush.repository';
import { SuscripcionPush } from '../types/dominio.types';

webpush.setVapidDetails(entorno.vapidSubject, entorno.vapidPublicKey, entorno.vapidPrivateKey);

interface PayloadPush {
  title: string;
  body: string;
}

export const notificacionesPushService = {
  async suscribir(idPerfil: string, endpoint: string, p256dh: string, auth: string): Promise<SuscripcionPush> {
    return suscripcionesPushRepository.crear(idPerfil, endpoint, p256dh, auth);
  },

  // Manda el push a todas las suscripciones del perfil (puede tener varias, una
  // por dispositivo/navegador). Si una suscripcion puntual ya no es valida
  // (404/410, el navegador la dio de baja de su lado), se elimina y se sigue
  // con el resto sin cortar el envio para las demas.
  async enviarPush(idPerfil: string, payload: PayloadPush): Promise<void> {
    const suscripciones = await suscripcionesPushRepository.buscarPorPerfil(idPerfil);

    await Promise.all(
      suscripciones.map(async (suscripcion) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: suscripcion.endpoint,
              keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth },
            },
            JSON.stringify(payload)
          );
        } catch (error) {
          const codigoEstado = (error as { statusCode?: number }).statusCode;
          if (codigoEstado === 404 || codigoEstado === 410) {
            await suscripcionesPushRepository.eliminarPorEndpoint(suscripcion.endpoint);
          } else {
            console.error(`Error al enviar push a la suscripcion ${suscripcion.id}:`, error);
          }
        }
      })
    );
  },
};
