import { serviciosRepository, CamposEditablesServicio } from '../repository/servicios.repository';
import { ErrorApi } from '../utils/errorApi';
import { Peluqueria, Servicio } from '../types/dominio.types';

const LARGO_MAXIMO_NOMBRE = 60;
const PRECIO_MAXIMO = 10_000_000;

// Lo que se copia al turno al reservar: precio y nombre quedan fijos aunque
// despues el barbero cambie o borre el servicio.
export interface CobroTurno {
  precio: number;
  id_servicio: string | null;
  nombre_servicio: string | null;
}

function validarCampos(datos: Record<string, unknown>, esCreacion: boolean): CamposEditablesServicio {
  const { nombre, precio, activo, orden } = datos;
  const campos: CamposEditablesServicio = {};

  if (nombre !== undefined || esCreacion) {
    if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > LARGO_MAXIMO_NOMBRE) {
      throw ErrorApi.solicitudInvalida(`El nombre del servicio es obligatorio (hasta ${LARGO_MAXIMO_NOMBRE} caracteres)`);
    }
    campos.nombre = nombre.trim();
  }

  if (precio !== undefined || esCreacion) {
    if (typeof precio !== 'number' || !Number.isFinite(precio) || precio < 0 || precio > PRECIO_MAXIMO) {
      throw ErrorApi.solicitudInvalida('El precio debe ser un numero mayor o igual a 0');
    }
    campos.precio = precio;
  }

  if (activo !== undefined) {
    if (typeof activo !== 'boolean') throw ErrorApi.solicitudInvalida('activo debe ser true o false');
    campos.activo = activo;
  }

  if (orden !== undefined) {
    if (typeof orden !== 'number' || !Number.isInteger(orden)) {
      throw ErrorApi.solicitudInvalida('orden debe ser un numero entero');
    }
    campos.orden = orden;
  }

  return campos;
}

async function buscarPropio(idServicio: string, idPeluqueriaAdmin: string): Promise<Servicio> {
  const servicio = await serviciosRepository.buscarPorId(idServicio);
  if (!servicio) throw ErrorApi.noEncontrado('Servicio no encontrado');

  if (servicio.id_peluqueria !== idPeluqueriaAdmin) {
    throw ErrorApi.noAutorizado('No podes gestionar servicios de otra peluqueria');
  }
  return servicio;
}

export const serviciosService = {
  async listarActivos(idPeluqueria: string): Promise<Servicio[]> {
    return serviciosRepository.listarPorPeluqueria(idPeluqueria, true);
  },

  async listarParaAdmin(idPeluqueria: string): Promise<Servicio[]> {
    return serviciosRepository.listarPorPeluqueria(idPeluqueria, false);
  },

  async crear(idPeluqueria: string, datos: Record<string, unknown>): Promise<Servicio> {
    const campos = validarCampos(datos, true);
    return serviciosRepository.crear({
      id_peluqueria: idPeluqueria,
      nombre: campos.nombre!,
      precio: campos.precio!,
      activo: campos.activo ?? true,
      orden: campos.orden ?? 0,
    });
  },

  async actualizar(idServicio: string, idPeluqueriaAdmin: string, datos: Record<string, unknown>): Promise<Servicio> {
    const campos = validarCampos(datos, false);
    if (Object.keys(campos).length === 0) {
      throw ErrorApi.solicitudInvalida('No se envio ningun campo para actualizar');
    }

    await buscarPropio(idServicio, idPeluqueriaAdmin);
    return serviciosRepository.actualizar(idServicio, campos);
  },

  // Recibe todos los ids de servicios de la peluqueria en el orden deseado
  // (como quedan despues de arrastrarlos en el panel) y guarda esa posicion.
  async reordenar(idPeluqueriaAdmin: string, idsEnOrden: unknown): Promise<Servicio[]> {
    if (!Array.isArray(idsEnOrden) || !idsEnOrden.every((id) => typeof id === 'string')) {
      throw ErrorApi.solicitudInvalida('ids debe ser una lista de ids de servicios');
    }

    const actuales = await serviciosRepository.listarPorPeluqueria(idPeluqueriaAdmin, false);
    const idsActuales = new Set(actuales.map((s) => s.id));
    const mismosServicios =
      idsEnOrden.length === idsActuales.size &&
      new Set(idsEnOrden).size === idsEnOrden.length &&
      idsEnOrden.every((id) => idsActuales.has(id));

    if (!mismosServicios) {
      throw ErrorApi.conflicto('La lista de servicios cambio. Recargá la pantalla e intentá de nuevo.');
    }

    const ordenActual = new Map(actuales.map((s) => [s.id, s.orden]));
    await Promise.all(
      idsEnOrden
        .map((id, posicion) => ({ id, posicion }))
        .filter(({ id, posicion }) => ordenActual.get(id) !== posicion)
        .map(({ id, posicion }) => serviciosRepository.actualizar(id, { orden: posicion }))
    );

    return serviciosRepository.listarPorPeluqueria(idPeluqueriaAdmin, false);
  },

  // Los turnos ya reservados con este servicio conservan su precio y nombre
  // (la FK queda en null), asi que borrar no altera el historial.
  async eliminar(idServicio: string, idPeluqueriaAdmin: string): Promise<void> {
    await buscarPropio(idServicio, idPeluqueriaAdmin);
    await serviciosRepository.eliminar(idServicio);
  },

  // Define con que servicio y precio se guarda un turno. Si no se eligio servicio
  // (clientes viejos como la app Android, o turnos fijos) se usa el primer servicio
  // activo; si la peluqueria todavia no cargo ninguno, se cae a precio_corte.
  async resolverCobroTurno(peluqueria: Peluqueria, idServicio?: string | null): Promise<CobroTurno> {
    if (idServicio) {
      const servicio = await serviciosRepository.buscarPorId(idServicio);
      if (!servicio || servicio.id_peluqueria !== peluqueria.id || !servicio.activo) {
        throw ErrorApi.solicitudInvalida('El servicio elegido no esta disponible');
      }
      return { precio: servicio.precio, id_servicio: servicio.id, nombre_servicio: servicio.nombre };
    }

    const [servicioPorDefecto] = await serviciosRepository.listarPorPeluqueria(peluqueria.id, true);
    if (servicioPorDefecto) {
      return {
        precio: servicioPorDefecto.precio,
        id_servicio: servicioPorDefecto.id,
        nombre_servicio: servicioPorDefecto.nombre,
      };
    }

    return { precio: peluqueria.precio_corte, id_servicio: null, nombre_servicio: null };
  },
};
