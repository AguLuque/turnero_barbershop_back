import { supabase } from '../config/db.config';
import { ErrorApi } from '../utils/errorApi';
import { HorarioAtencion, HorarioBloqueado } from '../types/dominio.types';
import { obtenerFechaHoyArgentina } from '../utils/fechaHoraArgentina';

export const horariosRepository = {
  async buscarHorariosAtencion(idPeluqueria: string, diaSemana: number): Promise<HorarioAtencion[]> {
    const { data, error } = await supabase
      .from('horarios_atencion')
      .select('*')
      .eq('id_peluqueria', idPeluqueria)
      .eq('dia_semana', diaSemana)
      .order('hora_inicio', { ascending: true });

    if (error) throw new ErrorApi(`Error al buscar horario de atencion: ${error.message}`);
    return data as HorarioAtencion[];
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

  async buscarBloqueoPorId(idBloqueo: string): Promise<HorarioBloqueado | null> {
    const { data, error } = await supabase
      .from('horarios_bloqueados')
      .select('*')
      .eq('id', idBloqueo)
      .single();

    if (error) return null;
    return data as HorarioBloqueado;
  },

  // Trae primero los bloqueos de hoy en adelante (los mas cercanos primero) y
  // despues los que ya quedaron en el pasado (los mas recientes primero), para
  // que arriba de la lista este siempre lo proximo y abajo lo mas viejo. Se
  // resuelve con dos consultas porque el orden compuesto (futuro asc, pasado
  // desc) no se puede expresar en un solo .order() del query builder.
  async listarBloqueosPorPeluqueria(idPeluqueria: string): Promise<HorarioBloqueado[]> {
    const hoy = obtenerFechaHoyArgentina();

    const [proximos, pasados] = await Promise.all([
      supabase
        .from('horarios_bloqueados')
        .select('*')
        .eq('id_peluqueria', idPeluqueria)
        .gte('fecha', hoy)
        .order('fecha', { ascending: true }),
      supabase
        .from('horarios_bloqueados')
        .select('*')
        .eq('id_peluqueria', idPeluqueria)
        .lt('fecha', hoy)
        .order('fecha', { ascending: false }),
    ]);

    if (proximos.error) throw new ErrorApi(`Error al listar bloqueos: ${proximos.error.message}`);
    if (pasados.error) throw new ErrorApi(`Error al listar bloqueos: ${pasados.error.message}`);

    return [...(proximos.data as HorarioBloqueado[]), ...(pasados.data as HorarioBloqueado[])];
  },

  async eliminarBloqueo(idBloqueo: string): Promise<void> {
    const { error } = await supabase.from('horarios_bloqueados').delete().eq('id', idBloqueo);
    if (error) throw new ErrorApi(`Error al eliminar el bloqueo: ${error.message}`);
  },

  async agregarFranjaHoraria(horario: Omit<HorarioAtencion, 'id'>): Promise<HorarioAtencion> {
    const { data, error } = await supabase
      .from('horarios_atencion')
      .insert(horario)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw ErrorApi.conflicto('Esa franja horaria ya existe para ese dia');
      }
      throw new ErrorApi(`Error al guardar el horario: ${error.message}`);
    }
    return data as HorarioAtencion;
  },

  async buscarFranjaPorId(idFranja: string): Promise<HorarioAtencion | null> {
    const { data, error } = await supabase
      .from('horarios_atencion')
      .select('*')
      .eq('id', idFranja)
      .single();

    if (error) return null;
    return data as HorarioAtencion;
  },

  async eliminarFranjaHoraria(idFranja: string): Promise<void> {
    const { error } = await supabase.from('horarios_atencion').delete().eq('id', idFranja);
    if (error) throw new ErrorApi(`Error al eliminar la franja horaria: ${error.message}`);
  },
};