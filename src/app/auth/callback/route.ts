import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Ruta de Servidor (GET) que maneja la respuesta (código) de Google OAuth.
 * Intercambia el código por una sesión segura de Supabase y redirige al dashboard.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // Usamos el cliente de servidor para el intercambio de código
    const supabase = await createClient();

    // Intercambia el código de autorización por una sesión real de Supabase.
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error al intercambiar código por sesión:', error);
      // En caso de error, redirigir al login
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
    }
  }

  // Redirigir al Dashboard después de un login exitoso.
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}