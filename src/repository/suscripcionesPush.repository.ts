import { supabase } from '../config/db.config';
import { ErrorApi } from '../utils/errorApi';
import { SuscripcionPush } from '../types/dominio.types';

export const suscripcionesPushRepository = {
  // Upsert por endpoint: un mismo dispositivo puede resuscribirse (ej. cambio de
  // claves) sin generar una fila duplicada para el mismo endpoint.
  async crear(idPerfil: string, endpoint: string, p256dh: string, auth: string): Promise<SuscripcionPush> {
    const { data, error } = await supabase
      .from('suscripciones_push')
      .upsert({ id_perfil: idPerfil, endpoint, p256dh, auth }, { onConflict: 'endpoint' })
      .select('*')
      .single();

    if (error) throw new ErrorApi(`Error al guardar la suscripcion push: ${error.message}`);
    return data as SuscripcionPush;
  },

  async buscarPorPerfil(idPerfil: string): Promise<SuscripcionPush[]> {
    const { data, error } = await supabase.from('suscripciones_push').select('*').eq('id_perfil', idPerfil);

    if (error) throw new ErrorApi(`Error al buscar suscripciones push: ${error.message}`);
    return data as SuscripcionPush[];
  },

  async eliminarPorEndpoint(endpoint: string): Promise<void> {
    const { error } = await supabase.from('suscripciones_push').delete().eq('endpoint', endpoint);
    if (error) throw new ErrorApi(`Error al eliminar la suscripcion push: ${error.message}`);
  },
};
