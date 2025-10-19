import { z } from 'zod';

// 1. Enum con los 6 tipos de producto fijos (Para validación de consistencia si es necesario)
export const GaviotyProductTypeEnum = z.enum([
    'Gaviobox',
    'Gavioterranet',
    'GavioFlex',
    'GavioWallnet',
    'GavioMatress',
    'GavioSacks'
]);
export type GaviotyProductType = z.infer<typeof GaviotyProductTypeEnum>;

// 2. Esquema Base para la estructura de la base de datos
export const ProductDBSchema = z.object({
    id: z.string().uuid(),
    name: GaviotyProductTypeEnum.or(z.string()), // El nombre debe coincidir con uno de los tipos o ser string (si se permite custom)
    description: z.string().nullable().optional(),
    created_at: z.string().datetime(),
});

export type Product = z.infer<typeof ProductDBSchema>;

// 3. Esquema para la Creación de un Tipo de Producto
export const AddProductSchema = z.object({
    name: z.string({
        message: "El nombre del tipo de producto es obligatorio."
    }).min(3, { message: "El nombre debe tener al menos 3 caracteres." }),

    description: z.string().nullable().optional(), // La descripción es opcional
});

export type AddProductFields = z.infer<typeof AddProductSchema>;

// 4. Esquema para la Actualización de un Tipo de Producto (Incluye el ID)
export const UpdateProductSchema = AddProductSchema.extend({
    // El ID es requerido para saber qué registro actualizar
    id: z.string().uuid({ message: "ID de producto inválido para la actualización." }),
});

export type UpdateProductFields = z.infer<typeof UpdateProductSchema>;

// 5. Esquema para la Eliminación (Solo se necesita el ID)
export const DeleteProductSchema = z.object({
    id: z.string().uuid({ message: "ID de producto inválido para la eliminación." }),
});