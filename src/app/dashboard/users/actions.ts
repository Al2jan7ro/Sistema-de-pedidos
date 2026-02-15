'use server';

import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

type OptionalField = string | null | undefined;

const normalizeOptionalString = (value: OptionalField) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getStringValue = (value: FormDataEntryValue | null) =>
  typeof value === 'string' ? value : '';

const getOptionalValue = (value: FormDataEntryValue | null) =>
  typeof value === 'string' ? value : undefined;

const CreateUserSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z
    .string()
    .min(1, { message: 'El correo es obligatorio.' })
    .email('Ingresa un correo electrónico válido.'),
  role: z.enum(['admin', 'solicitante']),
});

const UpdateUserSchema = CreateUserSchema.extend({
  id: z.string().uuid('ID de usuario inválido.'),
  email: z
    .string()
    .email('Ingresa un correo electrónico válido.')
    .optional(),
  role: z.enum(['admin', 'solicitante']).optional(),
});

export type UserActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

const initialErrorMessage = 'Revisa los campos del formulario.';

const mapZodErrors = (issues: z.ZodIssue[]): Record<string, string> =>
  issues.reduce<Record<string, string>>((acc, issue) => {
    const path = issue.path.at(0);
    if (typeof path === 'string' && !(path in acc)) {
      acc[path] = issue.message;
    }
    return acc;
  }, {});

export async function getUsers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return users;
}

export async function createUser(
  _prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const supabase = await createClient();
  const serviceSupabase = createServiceClient();

  const rawData = {
    first_name: getOptionalValue(formData.get('first_name')),
    last_name: getOptionalValue(formData.get('last_name')),
    email: getStringValue(formData.get('email')),
    role: getStringValue(formData.get('role')),
  };

  const validated = CreateUserSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      message: initialErrorMessage,
      fieldErrors: mapZodErrors(validated.error.issues),
    };
  }

  const payload = validated.data;

  // Verificar si el usuario actual es administrador
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'No autenticado. No se pueden crear usuarios.' };
  }

  const { data: currentUser } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (currentUser?.role !== 'admin') {
    return { success: false, message: 'No autorizado para crear usuarios.' };
  }

  const normalizedEmail = payload.email.trim().toLowerCase();

  // Verificar si el correo ya existe
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('email')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (existingUser) {
    return { success: false, message: 'El correo electrónico ya está en uso.' };
  }

  const { error: allowlistError } = await serviceSupabase
    .from('allowed_emails')
    .upsert({ email: normalizedEmail });

  if (allowlistError) {
    console.error('Error al registrar el correo:', allowlistError);
    return {
      success: false,
      message: 'No se pudo autorizar el correo electrónico indicado.',
    };
  }

  const temporalPassword = process.env.TEMPORAL_PASS;
  if (!temporalPassword) {
    console.error('Error: La variable de entorno no está configurada.');
    return {
      success: false,
      message: 'Error de configuración del servidor: no se puede crear el usuario.',
    };
  }

  try {
    // Crear usuario en Auth
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: normalizedEmail,
      password: temporalPassword,
      email_confirm: true,
      user_metadata: {
        first_name: normalizeOptionalString(payload.first_name),
        last_name: normalizeOptionalString(payload.last_name),
      },
      app_metadata: {
        provider: 'google',
      },
    });

    if (authError || !authData.user) {
      console.error('Error al crear usuario en Auth:', authError);
      return {
        success: false,
        message: authError?.message || 'Error al crear el usuario en el servicio de autenticación.',
      };
    }

    const insertPayload = {
      id: authData.user.id,
      first_name: normalizeOptionalString(payload.first_name),
      last_name: normalizeOptionalString(payload.last_name),
      email: normalizedEmail,
      role: payload.role,
    };

    const { error: profileError } = await serviceSupabase
      .from('profiles')
      .insert([insertPayload]);

    if (profileError) {
      console.error('Error al crear perfil:', profileError);
      await serviceSupabase.auth.admin.deleteUser(authData.user.id);
      return { success: false, message: `Error al crear el perfil: ${profileError.message}` };
    }

    revalidatePath('/dashboard/users');
    return { success: true, message: 'Usuario creado con éxito.' };
  } finally {
    const { error: cleanupError } = await serviceSupabase
      .from('allowed_emails')
      .delete()
      .eq('email', normalizedEmail);

    if (cleanupError) {
      console.error('Error al limpiar la allowlist de correos:', cleanupError);
    }
  }
}

export async function updateUser(
  _prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const supabase = await createClient();

  const rawData = {
    id: getStringValue(formData.get('id')),
    first_name: getOptionalValue(formData.get('first_name')),
    last_name: getOptionalValue(formData.get('last_name')),
    email: getOptionalValue(formData.get('email')),
    role: getOptionalValue(formData.get('role')),
  };

  const validated = UpdateUserSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      message: initialErrorMessage,
      fieldErrors: mapZodErrors(validated.error.issues),
    };
  }

  const payload = validated.data;

  // Verificar si el usuario actual está autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('Error de autenticación:', authError);
    return { success: false, message: 'No autenticado.' };
  }

  // Obtener el perfil del usuario actual
  const { data: currentUser, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !currentUser) {
    console.error('Error al obtener el perfil del usuario:', profileError);
    return { success: false, message: 'No se pudieron verificar los permisos.' };
  }

  const isAdmin = currentUser.role === 'admin';
  const isOwnProfile = user.id === payload.id;

  if (!isAdmin && !isOwnProfile) {
    return { success: false, message: 'No tienes permiso para actualizar este usuario.' };
  }

  if (payload.role && !isAdmin) {
    return { success: false, message: 'Solo los administradores pueden cambiar roles.' };
  }

  const updates: Record<string, unknown> = {};

  if ('first_name' in payload) {
    updates.first_name = normalizeOptionalString(payload.first_name);
  }
  if ('last_name' in payload) {
    updates.last_name = normalizeOptionalString(payload.last_name);
  }
  if (payload.email) {
    updates.email = payload.email.trim().toLowerCase();
  }
  if (payload.role && isAdmin) {
    updates.role = payload.role;
  }

  if (Object.keys(updates).length === 0) {
    return { success: true, message: 'No hay cambios para actualizar.' };
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', payload.id);

  if (updateError) {
    console.error('Error al actualizar el usuario:', updateError);
    return {
      success: false,
      message: updateError.message || 'Error al actualizar el usuario.',
    };
  }

  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${payload.id}`);

  return { success: true, message: 'Usuario actualizado con éxito.' };
}

export async function deleteUser(id: string) {
  const supabase = await createClient();

  // Verificar si el usuario actual es administrador
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No autenticado');
  }

  const { data: currentUser } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (currentUser?.role !== 'admin') {
    throw new Error('No autorizado');
  }

  // No permitir eliminarse a sí mismo
  if (user.id === id) {
    throw new Error('No puedes eliminarte a ti mismo');
  }

  // Eliminar el perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (profileError) {
    console.error('Error al eliminar perfil:', profileError);
    throw profileError;
  }

  // Eliminar el usuario de Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(id);

  if (authError) {
    console.error('Error al eliminar usuario de Auth:', authError);
    // Revertir la eliminación del perfil si falla la eliminación del usuario de Auth
    await supabase
      .from('profiles')
      .insert([{ id }]);
    throw authError;
  }

  revalidatePath('/dashboard/users');
}
