import { supabase } from '../config/db.config';
import { ErrorApi } from '../utils/errorApi';
import { HorarioAtencion, HorarioBloqueado } from '../types/dominio.types';

export const horariosRepository = {
  async buscarHorarioAtencion(idPeluqueria: string, diaSemana: number): Promise<HorarioAtencion | null> {
    const { data, error } = await supabase
      .from('horarios_atencion')
      .select('*')
      .eq('id_peluqueria', idPeluqueria)
      .eq('dia_semana', diaSemana)
      .maybeSingle();

    if (error) throw new ErrorApi(`Error al buscar horario de atencion: ${error.message}`);
    return data as HorarioAtencion | null;
  },

  async buscarBloqueosPorFecha(idPeluqueria: string, fecha: string): Promise<HorarioBloqueado[]> {
    const { data, error } = await supabase
      .from('horarios_bloqueados')
      .select('*')
      .eq('id_peluqueria', idPeluqueria)
      .eq('fecha', fecha);

    if (error) throw new ErrorApi(`Error al buscar bloqueos: ${error.message}`);
    return data as HorarioBloqueado[];
  },

  async crearBloqueo(bloqueo: Omit<HorarioBloqueado, 'id'>): Promise<HorarioBloqueado> {
    const { data, error } = await supabase
      .from('horarios_bloqueados')
      .insert(bloqueo)
      .select('*')
      .single();

    if (error) throw new ErrorApi(`Error al crear el bloqueo: ${error.message}`);
    return data as HorarioBloqueado;
  },

  async guardarHorarioAtencion(horario: Omit<HorarioAtencion, 'id'>): Promise<HorarioAtencion> {
    const { data, error } = await supabase
      .from('horarios_atencion')
      .upsert(horario, { onConflict: 'id_peluqueria,dia_semana' })
      .select('*')
      .single();

    if (error) throw new ErrorApi(`Error al guardar el horario: ${error.message}`);
    return data as HorarioAtencion;
  },
};