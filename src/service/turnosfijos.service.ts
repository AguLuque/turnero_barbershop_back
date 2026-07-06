import { turnosFijosRepository } from '../repository/turnosfijos.repository';
import { turnosRepository } from '../repository/turnos.repository';
import { horariosRepository } from '../repository/horarios.repository';
import { peluqueriasRepository } from '../repository/peluquerias.repository';
import { perfilesRepository } from '../repository/perfiles.repository';
import { ErrorApi } from '../utils/errorApi';
import { TurnoFijo } from '../types/dominio.types';

const DIAS_DE_ANTICIPACION = 14;

function sumarDias(fecha: string, dias: number): string {
    const nuevaFecha = new Date(`${fecha}T00:00:00`);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    return nuevaFecha.toISOString().slice(0, 10);
}

function calcularProximaFecha(turnoFijo: TurnoFijo, ultimaFechaGenerada: string | null): string {
    if (!ultimaFechaGenerada) return turnoFijo.fecha_inicio;
    return sumarDias(ultimaFechaGenerada, turnoFijo.frecuencia_dias);
}

function estaDentroDeLaVentana(fecha: string): boolean {
    const hoy = new Date().toISOString().slice(0, 10);
    const limite = sumarDias(hoy, DIAS_DE_ANTICIPACION);
    return fecha >= hoy && fecha <= limite;
}

export const turnosFijosService = {
    async crear(datos: Omit<TurnoFijo, 'id' | 'activo' | 'creado_en'>): Promise<TurnoFijo> {
        return turnosFijosRepository.crear(datos);
    },

    async listarPorPeluqueria(idPeluqueria: string): Promise<TurnoFijo[]> {
        return turnosFijosRepository.buscarPorPeluqueria(idPeluqueria);
    },

    async darDeBaja(idTurnoFijo: string): Promise<TurnoFijo> {
        const turnoFijo = await turnosFijosRepository.buscarPorId(idTurnoFijo);
        if (!turnoFijo) throw ErrorApi.noEncontrado('Turno fijo no encontrado');

        return turnosFijosRepository.darDeBaja(idTurnoFijo);
    },

    // Genera el proximo turno real de cada regla activa, si entra en la ventana de anticipacion
    // y el horario no esta bloqueado. Pensado para llamarse desde un endpoint o cron periodico.
    async generarProximosTurnos(idPeluqueria: string): Promise<number> {
        const reglasActivas = await turnosFijosRepository.buscarPorPeluqueria(idPeluqueria);
        const peluqueria = await peluqueriasRepository.buscarPorId(idPeluqueria);

        let generados = 0;

        for (const regla of reglasActivas) {
            const ultimoTurno = await turnosRepository.buscarUltimoPorTurnoFijo(regla.id);
            const proximaFecha = calcularProximaFecha(regla, ultimoTurno?.fecha ?? null);

            if (!estaDentroDeLaVentana(proximaFecha)) continue;

            const bloqueos = await horariosRepository.buscarBloqueosPorFecha(idPeluqueria, proximaFecha);
            const horaBloqueada = bloqueos.some(
                (bloqueo) =>
                    !bloqueo.hora_inicio || (regla.hora >= bloqueo.hora_inicio && regla.hora < (bloqueo.hora_fin ?? '23:59'))
            );
            if (horaBloqueada) continue;

            const perfilCliente = await perfilesRepository.buscarPorId(regla.id_cliente);

            await turnosRepository.crear(
                {
                    id_peluqueria: idPeluqueria,
                    id_cliente: regla.id_cliente,
                    nombre_cliente: perfilCliente.nombre_completo ?? 'Cliente turno fijo',
                    telefono_cliente: perfilCliente.telefono ?? undefined,
                    fecha: proximaFecha,
                    hora: regla.hora,
                    creado_por: 'admin',
                    id_turno_fijo: regla.id,
                },
                peluqueria.precio_corte
            );
            generados++;
        }

        return generados;
    },
};