export class ErrorApi extends Error {
  public readonly codigoEstado: number;

  constructor(mensaje: string, codigoEstado: number = 500) {
    super(mensaje);
    this.codigoEstado = codigoEstado;
    this.name = 'ErrorApi';
  }

  static noEncontrado(mensaje: string = 'Recurso no encontrado'): ErrorApi {
    return new ErrorApi(mensaje, 404);
  }

  static solicitudInvalida(mensaje: string): ErrorApi {
    return new ErrorApi(mensaje, 400);
  }

  static noAutorizado(mensaje: string = 'No autorizado'): ErrorApi {
    return new ErrorApi(mensaje, 401);
  }

  static conflicto(mensaje: string): ErrorApi {
    return new ErrorApi(mensaje, 409);
  }
}