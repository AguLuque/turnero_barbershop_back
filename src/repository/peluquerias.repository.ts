import { supabase } from '../config/db.config';
import { ErrorApi } from '../utils/errorApi';
import { Peluqueria } from '../types/dominio.types';

export const peluqueriasRepository = {

  async buscarPrimera(): Promise<Peluqueria> {
    const { data, error } = await supabase
      .from('peluquerias')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) throw ErrorApi.noEncontrado('No hay ninguna peluqueria configurada');
    return data as Peluqueria;
  },
  
  async buscarPorId(idPeluqueria: string): Promise<Peluqueria> {
    const { data, error } = await supabase
      .from('peluquerias')
      .select('*')
      .eq('id', idPeluqueria)
      .single();

    if (error || !data) throw ErrorApi.noEncontrado('Peluqueria no encontrada');
    return data as Peluqueria;
  },

  async actualizarDuracion(idPeluqueria: string, duracionMinutos: number): Promise<Peluqueria> {
    const { data, error } = await supabase
      .from('peluquerias')
      .update({ duracion_turno_minutos: duracionMinutos })
      .eq('id', idPeluqueria)
      .select('*')
      .single();

    if (error || !data) throw ErrorApi.noEncontrado('Peluqueria no encontrada');
    return data as Peluqueria;
  },
};