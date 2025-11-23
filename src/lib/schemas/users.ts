import * as z from 'zod';

// Definir roles permitidos
export const UserRole = {
  ADMIN: 'admin',
  SOLICITANTE: 'solicitante'
} as const;

export type UserRoleType = 'admin' | 'solicitante';

// Esquema base para el formulario
export const userFormSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email("Por favor ingresa un correo electrónico válido."),
  role: z.enum(['admin', 'solicitante']).default('solicitante'),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable()
});
export type UserFormValues = z.infer<typeof userFormSchema>;


// Tipo para los datos que vienen de la base de datos
export type DatabaseUser = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string | null;
  updated_at: string | null;
};

// Función para convertir de DatabaseUser a UserFormValues
export function mapDatabaseUserToFormValues(user: Partial<DatabaseUser>): UserFormValues {
  return {
    id: user.id,
    email: user.email || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    role: (user.role as UserRoleType) || UserRole.SOLICITANTE,
    created_at: user.created_at || undefined,
    updated_at: user.updated_at || undefined
  };
}
