import { supabase } from '../config/db.config';
import { ErrorApi } from '../utils/errorApi';
import { TurnoFijo } from '../types/dominio.types';

export const turnosFijosRepository = {
  async buscarPorPeluqueria(idPeluqueria: string): Promise<TurnoFijo[]> {
    const { data, error } = await supabase
      .from('turnos_fijos')
      .select('*')
      .eq('id_peluqueria', idPeluqueria)
      .eq('activo', true);

    if (error) throw new ErrorApi(`Error al buscar turnos fijos: ${error.message}`);
    return data as TurnoFijo[];
  },

  async buscarPorId(idTurnoFijo: string): Promise<TurnoFijo | null> {
    const { data, error } = await supabase
      .from('turnos_fijos')
      .select('*')
      .eq('id', idTurnoFijo)
      .single();

    if (error) return null;
    return data as TurnoFijo;
  },

  async crear(datos: Omit<TurnoFijo, 'id' | 'activo' | 'creado_en'>): Promise<TurnoFijo> {
    const { data, error } = await supabase
      .from('turnos_fijos')
      .insert({ ...datos, activo: true })
      .select('*')
      .single();

    if (error) throw new ErrorApi(`Error al crear el turno fijo: ${error.message}`);
    return data as TurnoFijo;
  },

  async darDeBaja(idTurnoFijo: string): Promise<TurnoFijo> {
    const { data, error } = await supabase
      .from('turnos_fijos')
      .update({ activo: false })
      .eq('id', idTurnoFijo)
      .select('*')
      .single();

    if (error) throw new ErrorApi(`Error al dar de baja el turno fijo: ${error.message}`);
    return data as TurnoFijo;
  },
};