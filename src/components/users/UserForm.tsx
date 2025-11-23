'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { toast } from "sonner";
import type { UserFormValues } from '@/lib/schemas/users';
import { createUser, updateUser, type UserActionState } from '@/app/dashboard/users/actions';

interface UserFormProps {
  initialData?: UserFormValues & { id?: string };
  isEdit?: boolean;
}

const initialState: UserActionState = {
  success: false,
  message: '',
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="flex-1 h-10">
      {pending ? 'Guardando…' : isEdit ? 'Actualizar usuario' : 'Crear usuario'}
    </Button>
  );
}

export function UserForm({ initialData, isEdit = false }: UserFormProps) {
  const router = useRouter();
  const actionHandler = isEdit ? updateUser : createUser;
  const [state, formAction] = useActionState<UserActionState, FormData>(
    actionHandler,
    initialState
  );
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
      const timer = setTimeout(() => {
        router.push('/dashboard/users');
        router.refresh();
      }, 1200);
      return () => clearTimeout(timer);
    }

    toast.error(state.message);
  }, [state, router]);

  return (
    <div className="flex items-center justify-center">
      <form action={formAction} className="w-full">
        <Card className="border-border shadow-sm">
          <CardContent className="space-y-6 pt-6">
            {state.message && !state.success && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <p>{state.message}</p>
              </div>
            )}

            {isEdit && initialData?.id && (
              <input type="hidden" name="id" value={initialData.id} />
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">Nombre</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  placeholder="Ingresa el nombre"
                  defaultValue={initialData?.first_name ?? ''}
                />
                {errors.first_name && (
                  <p className="text-xs text-destructive">{errors.first_name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="last_name">Apellido</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Ingresa el apellido"
                  defaultValue={initialData?.last_name ?? ''}
                />
                {errors.last_name && (
                  <p className="text-xs text-destructive">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                defaultValue={initialData?.email ?? ''}
                disabled={isEdit}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Rol</Label>
              <Select
                name="role"
                defaultValue={initialData?.role ?? 'solicitante'}
                disabled={state.success === false && state.message === 'Solo los administradores pueden cambiar roles.' && !isEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="solicitante">Solicitante</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role}</p>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-4 md:flex-row md:justify-end">
              <Button
                type="button"
                variant="outline"
                className="flex-1 md:flex-none"
                onClick={() => router.push('/dashboard/users')}
              >
                Cancelar
              </Button>
              <SubmitButton isEdit={isEdit} />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
