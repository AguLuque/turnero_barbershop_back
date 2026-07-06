import { supabase } from '../config/db.config';
import { ErrorApi } from '../utils/errorApi';
import { NuevoTurnoInput, Turno } from '../types/dominio.types';

export const turnosRepository = {
  async buscarPorPeluqueriaYFecha(idPeluqueria: string, fecha: string): Promise<Turno[]> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id_peluqueria', idPeluqueria)
      .eq('fecha', fecha)
      .neq('estado', 'cancelado');
 
    if (error) throw new ErrorApi(`Error al buscar turnos: ${error.message}`);
    return data as Turno[];
  },
 
  async buscarPorCliente(idCliente: string): Promise<Turno[]> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id_cliente', idCliente)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });
 
    if (error) throw new ErrorApi(`Error al buscar turnos del cliente: ${error.message}`);
    return data as Turno[];
  },
 
  async buscarTodosPorPeluqueria(idPeluqueria: string): Promise<Turno[]> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id_peluqueria', idPeluqueria)
      .neq('estado', 'cancelado');
 
    if (error) throw new ErrorApi(`Error al buscar turnos de la peluqueria: ${error.message}`);
    return data as Turno[];
  },
 
  async buscarPorId(idTurno: string): Promise<Turno | null> {
    const { data, error } = await supabase.from('turnos').select('*').eq('id', idTurno).single();
 
    if (error) return null;
    return data as Turno;
  },
 
  async buscarUltimoPorTurnoFijo(idTurnoFijo: string): Promise<Turno | null> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id_turno_fijo', idTurnoFijo)
      .order('fecha', { ascending: false })
      .limit(1)
      .maybeSingle();
 
    if (error) throw new ErrorApi(`Error al buscar ultimo turno de la regla fija: ${error.message}`);
    return data as Turno | null;
  },
 
  async crear(datos: NuevoTurnoInput, precio: number): Promise<Turno> {
    const { data, error } = await supabase
      .from('turnos')
      .insert({ ...datos, precio })
      .select('*')
      .single();
 
    if (error) {
      if (error.code === '23505') {
        throw ErrorApi.conflicto('Ese horario ya fue reservado');
      }
      throw new ErrorApi(`Error al crear el turno: ${error.message}`);
    }
    return data as Turno;
  },
 
  async actualizarEstado(
    idTurno: string,
    estado: Turno['estado'],
    seAplicoRecargo: boolean = false
  ): Promise<Turno> {
    const { data, error } = await supabase
      .from('turnos')
      .update({ estado, se_aplico_recargo_cancelacion: seAplicoRecargo })
      .eq('id', idTurno)
      .select('*')
      .single();
 
    if (error) throw new ErrorApi(`Error al actualizar el turno: ${error.message}`);
    return data as Turno;
  },
};