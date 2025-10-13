import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types'; // Importamos nuestros tipos

// Usamos el ID y la clave pública (ANON_KEY) desde .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Crea un cliente de Supabase para Componentes de Servidor y Server Actions.
 * Lee las cookies para manejar la sesión del usuario autenticado.
 */
export async function createClient() {
  const cookieStore = await cookies();
  
  return createServerClient<Database>( // Tipamos el cliente con 'Database'
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            // Este método solo se llama en Server Actions.
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se ignora si se llama desde un Server Component (no puede cambiar cookies)
          }
        },
      },
    }
  );
}
