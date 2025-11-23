import { UsersTable } from '@/components/users/UsersTable';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getUsers } from './actions';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
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

  // Obtener la lista de usuarios
  const users = await getUsers();

  const handleDelete = async (id: string) => {
    'use server';
    // La lógica de eliminación se manejará en el cliente
  };

  return (


    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema y sus permisos
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/users/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Link>
        </Button>
      </div>
      <UsersTable
        users={users || []}
        onDelete={handleDelete}
      />
    </div>
  );
}