import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL para inicializar el cliente de servicio.');
}

if (!serviceRoleKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY para inicializar el cliente de servicio.');
}

/**
 * Crea un cliente con la service role key para ejecutar acciones privilegiadas
 * exclusivamente en el servidor (sin exponer la clave al cliente).
 */
export const createServiceClient = () =>
    createClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
