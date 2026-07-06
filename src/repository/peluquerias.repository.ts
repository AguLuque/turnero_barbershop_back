import { supabase } from '../config/db.config';
import { ErrorApi } from '../utils/errorApi';
import { Peluqueria } from '../types/dominio.types';

export const peluqueriasRepository = {
  async buscarPorId(idPeluqueria: string): Promise<Peluqueria> {
    const { data, error } = await supabase
      .from('peluquerias')
      .select('*')
      .eq('id', idPeluqueria)
      .single();

    if (error || !data) throw ErrorApi.noEncontrado('Peluqueria no encontrada');
    return data as Peluqueria;
  },
};