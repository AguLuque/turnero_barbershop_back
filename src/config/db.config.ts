import { createClient } from '@supabase/supabase-js';
import { entorno } from './entorno.config';

export const supabase = createClient(entorno.supabaseUrl, entorno.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});