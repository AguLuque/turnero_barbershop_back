import { supabase } from '../config/db.config';
import { ErrorApi } from '../utils/errorApi';
import { Servicio } from '../types/dominio.types';

export type CamposEditablesServicio = Partial<Pick<Servicio, 'nombre' | 'precio' | 'activo' | 'orden'>>;

export const serviciosRepository = {
  async listarPorPeluqueria(idPeluqueria: string, soloActivos: boolean): Promise<Servicio[]> {
    let query = supabase
      .from('servicios')
      .select('*')
      .eq('id_peluqueria', idPeluqueria)
      .order('orden', { ascending: true })
      .order('creado_en', { ascending: true });

    if (soloActivos) query = query.eq('activo', true);

    const { data, error } = await query;
    if (error) throw new ErrorApi(`Error al listar servicios: ${error.message}`);
    return data as Servicio[];
  },

  async buscarPorId(idServicio: string): Promise<Servicio | null> {
    const { data, error } = await supabase.from('servicios').select('*').eq('id', idServicio).maybeSingle();

    if (error) throw new ErrorApi(`Error al buscar servicio: ${error.message}`);
    return data as Servicio | null;
  },

  async crear(servicio: Omit<Servicio, 'id' | 'creado_en'>): Promise<Servicio> {
    const { data, error } = await supabase.from('servicios').insert(servicio).select('*').single();

    if (error) throw new ErrorApi(`Error al crear el servicio: ${error.message}`);
    return data as Servicio;
  },

  async actualizar(idServicio: string, cambios: CamposEditablesServicio): Promise<Servicio> {
    const { data, error } = await supabase
      .from('servicios')
      .update(cambios)
      .eq('id', idServicio)
      .select('*')
      .single();

    if (error) throw new ErrorApi(`Error al actualizar el servicio: ${error.message}`);
    return data as Servicio;
  },

  async eliminar(idServicio: string): Promise<void> {
    const { error } = await supabase.from('servicios').delete().eq('id', idServicio);
    if (error) throw new ErrorApi(`Error al eliminar el servicio: ${error.message}`);
  },
};
