import { AppSidebar } from "@/components/sidebar";
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
// Asumimos que Database está tipada y accesible desde @/lib/database.types

// La función se convierte en asíncrona para poder obtener datos del servidor
export default async function LayoutNavigation(
    { children }: { children: React.ReactNode }
) {
    const supabase = await createClient();

    // 1. OBTENER SESIÓN (Fallo Seguro)
    const { data: { user } } = await supabase.auth.getUser();

    // Redirigir si no hay usuario autenticado (aunque el middleware ya lo hace)
    if (!user) {
        redirect('/login');
    }

    // 2. OBTENER ROL Y DATOS DEL PERFIL
    // Leemos la tabla 'profiles' para obtener el rol y el nombre (Regla 2.3).
    const { data: profile } = await supabase
        .from('profiles')
        // Asegúrate de que estos campos existen en tu tabla profiles
        .select('role, first_name, email')
        .eq('id', user.id)
        .single();

    // Definir las props a pasar al Sidebar (control de roles)
    const userRole = profile?.role || 'solicitante';
    const userName = profile?.first_name || 'Usuario';
    const userEmail = profile?.email || user.email || 'N/A';

    return (
        <div className="">
            <div className="">
                {/* 3. PASAR PROPS DE AUTORIZACIÓN Y PERFIL AL SIDEBAR */}
                <AppSidebar
                    userRole={userRole}
                    userName={userName}
                    userEmail={userEmail}
                    // La inicial del usuario para el avatar
                    userInitial={userName ? userName[0].toUpperCase() : 'GS'}
                />
            </div>
            {/* Ajustar el padding/margin para compensar el sidebar fijo */}
            <div className="">
                {children}
            </div>
        </div>
    )
}