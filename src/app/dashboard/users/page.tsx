import { UsersTable } from '@/components/users/UsersTable';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getUsers } from './actions';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Image from "next/image";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

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

  const handleDelete = async () => {
    'use server';
    // La lógica de eliminación se manejará en el cliente
  };

  return (
    <div className="w-full space-y-6">
      <Card className="w-full border-border shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/assets/gaviotylogo.png" alt="Logo" width={120} height={120} />
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">Gestión de Usuarios</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Administra los roles y accesos del personal de Gavioty Solutions.
                </CardDescription>
              </div>
            </div>

            <Button asChild className="h-10 bg-foreground hover:bg-foreground/90 text-background shadow-md transition-all font-semibold">
              <Link href="/dashboard/users/new" className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pb-6">
          <UsersTable
            users={users || []}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}