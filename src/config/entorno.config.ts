import dotenv from 'dotenv';

dotenv.config();

interface EntornoConfig {
  puerto: number;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  frontendUrl: string;
  resendApiKey: string;
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidSubject: string;
}

function obtenerVariable(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno: ${nombre}`);
  }
  return valor;
}

export const entorno: EntornoConfig = {
  puerto: Number(process.env.PORT) || 3000,
  supabaseUrl: obtenerVariable('SUPABASE_URL'),
  supabaseServiceRoleKey: obtenerVariable('SUPABASE_SERVICE_ROLE_KEY'),
  frontendUrl: obtenerVariable('FRONTEND_URL'),
  resendApiKey: process.env.RESEND_API_KEY || '',
  // Claves del par VAPID para firmar las Web Push notifications (ver web-push).
  vapidPublicKey: obtenerVariable('VAPID_PUBLIC_KEY'),
  vapidPrivateKey: obtenerVariable('VAPID_PRIVATE_KEY'),
  // mailto: o URL de contacto que exige la spec de Web Push para identificar
  // al emisor ante los servidores push (ej: 'mailto:contacto@tuturnobarber.com').
  vapidSubject: obtenerVariable('VAPID_SUBJECT'),
};