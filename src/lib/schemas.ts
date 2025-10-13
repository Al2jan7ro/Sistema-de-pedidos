
import { z } from 'zod';

export const ClientSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email("Formato de correo inválido."),
  phone: z.string().optional(),
  address: z.string().min(10, "La dirección es obligatoria.")
});

// Zod automáticamente nos da un tipo de TypeScript:
export type ClientFormType = z.infer<typeof ClientSchema>;