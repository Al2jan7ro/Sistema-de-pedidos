import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { UserForm } from '@/components/users/UserForm';
import { mapDatabaseUserToFormValues } from '@/lib/schemas/users';

export default async function EditUserPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  
  // Verificar autenticación
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) {
    return notFound();
  }

  // Obtener el usuario a editar
  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !user) {
    return notFound();
  }

  // Verificar permisos (solo administradores o el propio usuario pueden editar)
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single();

  const isAdmin = currentUserProfile?.role === 'admin';
  const isOwnProfile = currentUser.id === user.id;

  if (!isAdmin && !isOwnProfile) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Usuario</h1>
        <p className="text-muted-foreground">
          Actualiza la información del usuario
        </p>
      </div>
      
      <div className="rounded-lg border bg-card p-6">
        <UserForm 
          initialData={mapDatabaseUserToFormValues(user)} 
          isEdit={true} 
        />
      </div>
    </div>
  );
}
