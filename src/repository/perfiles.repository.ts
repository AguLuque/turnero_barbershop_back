import { supabase } from '../config/db.config';
import { ErrorApi } from '../utils/errorApi';
import { Perfil } from '../types/dominio.types';

export const perfilesRepository = {
  async buscarPorId(idPerfil: string): Promise<Perfil> {
    const { data, error } = await supabase.from('perfiles').select('*').eq('id', idPerfil).single();

    if (error || !data) throw ErrorApi.noEncontrado('Perfil no encontrado');
    return data as Perfil;
  },

  async buscarPorPeluqueria(idPeluqueria: string): Promise<Perfil[]> {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id_peluqueria', idPeluqueria)
      .eq('rol', 'cliente');

    if (error) throw new ErrorApi(`Error al buscar clientes: ${error.message}`);
    return data as Perfil[];
  },

  async actualizar(idPerfil: string, cambios: Partial<Pick<Perfil, 'nombre_completo' | 'telefono' | 'foto_url'>>): Promise<Perfil> {
    const { data, error } = await supabase
      .from('perfiles')
      .update(cambios)
      .eq('id', idPerfil)
      .select('*')
      .single();

    if (error) throw new ErrorApi(`Error al actualizar el perfil: ${error.message}`);
    return data as Perfil;
  },
};