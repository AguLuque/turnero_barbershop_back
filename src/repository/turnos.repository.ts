import { supabase } from '../config/db.config';
import { ErrorApi } from '../utils/errorApi';
import { NuevoTurnoInput, Turno } from '../types/dominio.types';
import { obtenerFechaHoyArgentina, obtenerHoraActualArgentina } from '../utils/fechaHoraArgentina';

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

  async buscarPorClienteYPeluqueria(idCliente: string, idPeluqueria: string): Promise<Turno[]> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id_cliente', idCliente)
      .eq('id_peluqueria', idPeluqueria)
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

  async buscarPorPeluqueriaYFechaTodos(idPeluqueria: string, fecha: string): Promise<Turno[]> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id_peluqueria', idPeluqueria)
      .eq('fecha', fecha)
      .order('hora', { ascending: true });

    if (error) throw new ErrorApi(`Error al buscar turnos del dia: ${error.message}`);
    return data as Turno[];
  },

  // Completa automaticamente cualquier turno confirmado cuya fecha+hora ya haya
  // pasado (dia anterior, o mismo dia con hora ya transcurrida). Sin idPeluqueria
  // corre sobre todas las peluquerias (uso desde el cron periodico).
  async marcarVencidosComoCompletados(idPeluqueria?: string): Promise<number> {
    const hoy = obtenerFechaHoyArgentina();
    const horaActual = obtenerHoraActualArgentina();

    let query = supabase
      .from('turnos')
      .update({ estado: 'completado' })
      .eq('estado', 'confirmado')
      .or(`fecha.lt.${hoy},and(fecha.eq.${hoy},hora.lte.${horaActual})`);

    if (idPeluqueria) {
      query = query.eq('id_peluqueria', idPeluqueria);
    }

    const { data, error } = await query.select('id');

    if (error) throw new ErrorApi(`Error al marcar turnos vencidos: ${error.message}`);
    return data?.length ?? 0;
  },

  async cancelarPorBloqueo(
    idPeluqueria: string,
    fecha: string,
    horaInicio: string | null,
    horaFin: string | null
  ): Promise<number> {
    let query = supabase
      .from('turnos')
      .update({ estado: 'cancelado' })
      .eq('id_peluqueria', idPeluqueria)
      .eq('fecha', fecha)
      .eq('estado', 'confirmado');

    // Si el bloqueo es de dia completo (sin horas), cancela todos los turnos del dia.
    // Si el bloqueo es de un rango horario puntual, solo cancela los turnos dentro de ese rango.
    if (horaInicio && horaFin) {
      query = query.gte('hora', horaInicio).lt('hora', horaFin);
    }

    const { data, error } = await query.select('id');

    if (error) throw new ErrorApi(`Error al cancelar turnos por bloqueo: ${error.message}`);
    return data?.length ?? 0;
  },

  async buscarPorId(idTurno: string): Promise<Turno | null> {
    const { data, error } = await supabase.from('turnos').select('*').eq('id', idTurno).single();

    if (error) return null;
    return data as Turno;
  },

  async buscarPorTurnoFijoYFecha(idTurnoFijo: string, fecha: string): Promise<Turno | null> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id_turno_fijo', idTurnoFijo)
      .eq('fecha', fecha)
      .maybeSingle();

    if (error) throw new ErrorApi(`Error al buscar turno por regla fija y fecha: ${error.message}`);
    return data as Turno | null;
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

  // Para clientes que solo tienen turnos fijos cargados por el admin, sin cuenta
  // (id_cliente null): se busca su historial por nombre + telefono exactos.
  async buscarPorNombreYTelefono(
    idPeluqueria: string,
    nombreCliente: string,
    telefonoCliente: string | null
  ): Promise<Turno[]> {
    let query = supabase
      .from('turnos')
      .select('*')
      .eq('id_peluqueria', idPeluqueria)
      .eq('nombre_cliente', nombreCliente)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });

    query = telefonoCliente ? query.eq('telefono_cliente', telefonoCliente) : query.is('telefono_cliente', null);

    const { data, error } = await query;

    if (error) throw new ErrorApi(`Error al buscar turnos del cliente: ${error.message}`);
    return data as Turno[];
  },

  async cancelarFuturosPorTurnoFijo(idTurnoFijo: string, hoy: string): Promise<number> {
    const { data, error } = await supabase
      .from('turnos')
      .update({ estado: 'cancelado' })
      .eq('id_turno_fijo', idTurnoFijo)
      .eq('estado', 'confirmado')
      .gte('fecha', hoy)
      .select('id');

    if (error) throw new ErrorApi(`Error al cancelar turnos del turno fijo: ${error.message}`);
    return data?.length ?? 0;
  },

  // Cancela los turnos confirmados de un dia de la semana especifico (en fechas futuras,
  // incluyendo hoy) que caigan dentro de un rango horario dado. Se usa cuando se elimina
  // una franja de atencion, para no dejar turnos "fantasma" en un horario que ya no existe.
  async cancelarPorFranjaEliminada(
    idPeluqueria: string,
    diaSemana: number,
    horaInicio: string,
    horaFin: string,
    hoy: string
  ): Promise<number> {
    // Traemos los turnos confirmados desde hoy en adelante, y filtramos en memoria
    // por dia de la semana (Supabase no tiene una forma directa de filtrar por
    // dia-de-semana de una columna date sin una funcion SQL propia).
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id_peluqueria', idPeluqueria)
      .eq('estado', 'confirmado')
      .gte('fecha', hoy);

    if (error) throw new ErrorApi(`Error al buscar turnos para cancelar: ${error.message}`);

    const turnosAfectados = (data as Turno[]).filter((turno) => {
      const diaDelTurno = new Date(`${turno.fecha}T00:00:00`).getDay();
      const horaTurno = turno.hora.slice(0, 5);
      return diaDelTurno === diaSemana && horaTurno >= horaInicio && horaTurno < horaFin;
    });

    if (turnosAfectados.length === 0) return 0;

    const idsACancelar = turnosAfectados.map((t) => t.id);
    const { error: errorUpdate } = await supabase
      .from('turnos')
      .update({ estado: 'cancelado' })
      .in('id', idsACancelar);

    if (errorUpdate) throw new ErrorApi(`Error al cancelar turnos: ${errorUpdate.message}`);
    return idsACancelar.length;
  },

  // Busca turnos confirmados, con cuenta de cliente y sin recordatorio enviado
  // todavia, cuya fecha+hora caiga dentro de la ventana [desde, hasta]. Se usa
  // desde el job de recordatorios (la ventana normalmente es "dentro de 55 a 65
  // minutos"). Contempla el caso raro en que la ventana cruce la medianoche.
  async buscarPendientesDeRecordatorio(
    desde: { fecha: string; hora: string },
    hasta: { fecha: string; hora: string }
  ): Promise<Turno[]> {
    let query = supabase
      .from('turnos')
      .select('*')
      .eq('estado', 'confirmado')
      .eq('recordatorio_enviado', false)
      .not('id_cliente', 'is', null);

    if (desde.fecha === hasta.fecha) {
      query = query.eq('fecha', desde.fecha).gte('hora', desde.hora).lte('hora', hasta.hora);
    } else {
      query = query.or(
        `and(fecha.eq.${desde.fecha},hora.gte.${desde.hora}),and(fecha.eq.${hasta.fecha},hora.lte.${hasta.hora})`
      );
    }

    const { data, error } = await query;
    if (error) throw new ErrorApi(`Error al buscar turnos pendientes de recordatorio: ${error.message}`);
    return data as Turno[];
  },

  async marcarRecordatorioEnviado(idTurno: string): Promise<void> {
    const { error } = await supabase.from('turnos').update({ recordatorio_enviado: true }).eq('id', idTurno);
    if (error) throw new ErrorApi(`Error al marcar el recordatorio como enviado: ${error.message}`);
  },
};