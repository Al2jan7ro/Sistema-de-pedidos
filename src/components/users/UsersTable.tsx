'use client';

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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



    <div className="relative border border-border/50 rounded-xl overflow-hidden bg-background/30 shadow-inner mt-4">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="font-bold text-foreground w-[120px]">Acciones</TableHead>
            <TableHead className="font-bold text-foreground">Nombre</TableHead>
            <TableHead className="font-bold text-foreground">Apellido</TableHead>
            <TableHead className="font-bold text-foreground">Email</TableHead>
            <TableHead className="font-bold text-foreground">Rol</TableHead>
            <TableHead className="font-bold text-foreground">Creación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                No hay usuarios registrados en el sistema.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className="hover:bg-foreground/[0.02] border-border/40 transition-colors">
                <TableCell className="text-left">
                  <div className="flex justify-start gap-2">
                    <Link href={`/dashboard/users/${user.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-foreground hover:text-background transition-all">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                      onClick={() => onDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">{user.first_name || '-'}</TableCell>
                <TableCell>{user.last_name || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant="default"
                    className={`text-xs font-medium border ${user.role === 'admin'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-green-100 text-green-800 border-green-200'
                      } hover:bg-transparent cursor-default capitalize`}
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {user.created_at ? (
                    new Date(user.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  ) : (
                    'N/A'
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
