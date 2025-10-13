import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Ruta de Servidor (POST) que maneja el cierre de sesión.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  // Cierra la sesión del usuario en Supabase y borra las cookies
  await supabase.auth.signOut();

  // Redirige al login. Usamos 301 (Moved Permanently) para asegurar que las cookies se borren correctamente.
  return NextResponse.redirect(new URL('/login', request.url), {
    status: 301,
  });
}