import { UserForm } from '@/components/users/UserForm';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function NewUserPage() {
  const supabase = await createClient();
  
  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Verificar si el usuario es administrador
  const { data: currentUser } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (currentUser?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Usuario</h1>
        <p className="text-muted-foreground">
          Completa el formulario para crear un nuevo usuario
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <UserForm />
      </div>
    </div>
  );
}