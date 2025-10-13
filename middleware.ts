import { createClient } from '@/utils/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware principal para la seguridad de la aplicación.
 * 1. Crea un cliente de Supabase para el middleware (refrescando cookies).
 * 2. Verifica la sesión del usuario.
 * 3. Si no hay sesión, redirige al usuario a /login.
 */
export async function middleware(request: NextRequest) {
  try {
    // 1. Crear el cliente de Supabase para el middleware.
    const { supabase, supabaseResponse } = createClient(request);

    // 2. Intentar obtener la sesión del usuario. Esto refresca las cookies si es necesario.
    const { data, error } = await supabase.auth.getSession();

    // 3. Lógica de Redirección y Protección
    const pathname = request.nextUrl.pathname;

    // Si hay un error de Supabase, loguearlo y dejar que el flujo continúe (podría ser un problema de red)
    if (error) {
      console.error('Supabase Middleware Error:', error);
    }

    // A) Si el usuario está intentando acceder a /dashboard sin sesión, redirigir a /login
    if (pathname.startsWith('/dashboard') && !data.session) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // B) Si el usuario está autenticado y trata de acceder a /login, redirigir a /dashboard
    // Esto previene que un usuario con sesión vea la página de login.
    if (pathname.startsWith('/login') && data.session) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // 4. Devolver la respuesta de Supabase. Esto es crucial para actualizar las cookies.
    return supabaseResponse;

  } catch (error) {
    // Manejo de errores generales durante la ejecución del middleware
    console.error('General Middleware Error:', error);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

/**
 * Configuración del Matcher: Define qué rutas serán interceptadas por el middleware.
 * - /dashboard/:path* : Protege todas las rutas bajo /dashboard.
 * - /auth/:path* : Necesario para interceptar la redirección de Google OAuth y el callback.
 * - /login : También es necesario para redirigir si el usuario ya tiene sesión.
 */
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/auth/:path*',
    '/login'
  ],
};