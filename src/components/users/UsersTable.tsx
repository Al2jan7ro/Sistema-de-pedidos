'use client';

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Plus } from "lucide-react";

type User = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  created_at: string | null;
};

type UsersTableProps = {
  users: User[];
  onDelete: (id: string) => Promise<void>;
};

export function UsersTable({ users, onDelete }: UsersTableProps) {
  return (



    <div className="rounded-md border">



      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Apellido</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Fecha de creación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No hay usuarios registrados
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.first_name || '-'}</TableCell>
                <TableCell>{user.last_name || '-'}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                    }`}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>
                  {user.created_at ? (
                    new Date(user.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Link href={`/dashboard/users/${user.id}`}>
                    <Button variant="outline" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDelete(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
