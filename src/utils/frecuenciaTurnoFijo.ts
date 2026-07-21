export function calcularPrimeraOcurrencia(fechaInicio: string, diaSemana: number): string {
  const inicio = new Date(`${fechaInicio}T00:00:00`);
  const diaDeInicio = inicio.getDay();
  const diasHastaElDia = (diaSemana - diaDeInicio + 7) % 7;

  const primera = new Date(inicio);
  primera.setDate(primera.getDate() + diasHastaElDia);
  return primera.toISOString().slice(0, 10);
}

export function correspondeSegunFrecuencia(
  fechaInicio: string,
  diaSemana: number,
  frecuenciaDias: number,
  fecha: string
): boolean {
  const primeraOcurrencia = calcularPrimeraOcurrencia(fechaInicio, diaSemana);
  const inicio = new Date(`${primeraOcurrencia}T00:00:00`);
  const objetivo = new Date(`${fecha}T00:00:00`);
  const diffDias = Math.round((objetivo.getTime() - inicio.getTime()) / 86400000);

  return diffDias >= 0 && diffDias % frecuenciaDias === 0;
}

// Logica compartida para saber si una fecha puntual le corresponde a una
// regla de turno fijo, segun su dia de la semana y su frecuencia (cada 7,
// 14, 21 dias, etc). La usan tanto disponibilidad.service.ts (para saber que
// horarios mostrar como ocupados) como turnosFijos.service.ts (para saber
// cuando materializar/generar el turno real). Antes estaba duplicada en los
// dos archivos; se centraliza aca para no tener que corregir el mismo bug
// en dos lugares distintos cada vez.

// fecha_inicio es la fecha en que se CARGO la regla (ej: un lunes), que casi
// nunca coincide con el dia_semana de la regla (ej: "viernes"). Hay que
// encontrar el primer dia_semana correcto a partir de fecha_inicio para que
// el calculo de frecuencia tenga una base valida.