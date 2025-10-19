import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Esta es la ruta de callback que Supabase llama después de la autenticación de Google.
 * Su función es intercambiar el código de autenticación por una sesión.
 * * CRÍTICO: Verifica si el usuario tiene un perfil (un rol) asignado.
 * Si no lo tiene (porque no está autorizado), cierra su sesión y lo envía a /unauthorized.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // Usamos el cliente de servidor para obtener/establecer la sesión
  const supabase = await createClient();

  if (code) {
    // 1. Intercambio de código para obtener la sesión
    await supabase.auth.exchangeCodeForSession(code);

    // --- LÓGICA DE VERIFICACIÓN DE AUTORIZACIÓN (ROL) ---

    // 2. Obtener la sesión actual
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 3. Buscar el rol del usuario en la tabla 'profiles'
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      // Si hay un error (el perfil NO EXISTE) o no se encontró el rol:
      if (error || !profile?.role) {
        console.warn(`Acceso denegado: Usuario ${user.email} no tiene un perfil/rol asignado.`);

        // Bloquear el acceso: Cierra la sesión forzosamente (cierra las cookies de sesión)
        await supabase.auth.signOut();
        
        // Redirigir a la página de error personalizada
        return NextResponse.redirect(`${requestUrl.origin}/unauthorized`);
      }
      
      // 4. Si el perfil/rol existe: Redirigir al dashboard (Acceso Autorizado)
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
    }
  }

  // Si no hay código de autenticación o el usuario es nulo, redirigir al login
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
