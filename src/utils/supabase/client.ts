import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/database.types'; // Importamos nuestros tipos

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Crea un cliente de Supabase para Componentes de Cliente.
 * No necesita pasar cookies.
 */
export const createClient = () =>
  createBrowserClient<Database>( // Tipamos el cliente con 'Database'
    supabaseUrl!,
    supabaseKey!
  );
