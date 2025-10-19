import { z } from 'zod';

// Definición de las opciones válidas para el estado del cliente (ENUM en Supabase)
export const ClientStatusEnum = z.enum(['Active', 'Inactive', 'Pending'], {
    message: "El estado del cliente debe ser 'Active', 'Inactive' o 'Pending'."
});


export const ClientFormSchema = z.object({
    // id se incluye como opcional para que se pueda usar para el formulario de EDICIÓN
    id: z.string().uuid().optional(), 
    
    // 1. Nombre
    name: z.string()
        .min(3, { message: "El nombre es obligatorio y debe tener al menos 3 caracteres." })
        .max(100, { message: "El nombre no puede exceder los 100 caracteres." }),

    // 2. Email
    email: z.string()
        .email({ message: "El email debe ser una dirección de correo válida." })
        .max(100, { message: "El email no puede exceder los 100 caracteres." }),

    // 3. Teléfono
    phone: z.union([
        z.string().regex(/^\+?\d{8,15}$/, { message: "El teléfono debe ser un número válido (8 a 15 dígitos)." }),
        z.literal(''),
    ]).optional().transform(e => e === "" ? undefined : e),

    // 4. Dirección
    address: z.string()
        .max(255, { message: "La dirección no puede exceder los 255 caracteres." })
        .optional().or(z.literal('')).transform(e => e === "" ? undefined : e),

    // 5. Estado
    status: ClientStatusEnum.default('Active'),
});

// Tipo para la entrada de datos del formulario (creación o edición parcial)
export type ClientFormData = z.infer<typeof ClientFormSchema>;


export const ClientDBSchema = ClientFormSchema.extend({
    //El ID es requerido para un registro existente
    id: z.string().uuid(),
    // Añadir created_at (siempre viene de la DB y es un string ISO)
    created_at: z.string(), 
});

// Tipo para la estructura COMPLETA de un cliente tal como viene de la DB
export type Client = z.infer<typeof ClientDBSchema>;


export const DeleteClientSchema = z.object({
    id: z.string().uuid({ message: "Se requiere un ID de cliente válido (UUID) para eliminar." }),
});

export type DeleteClient = z.infer<typeof DeleteClientSchema>;