import { z } from 'zod';
import { Tables } from '@/lib/database.types'; // Tipos generados por Supabase

// ----------------------------------------------------------------------
// 1. TIPOS DE RESPUESTA Y ENUM (Para acciones y validación)
// ----------------------------------------------------------------------

/**
 * Tipo de respuesta estándar para todas las Server Actions.
 */
export type ActionResponse = {
    success: boolean;
    message: string;
    fieldErrors?: Record<string, string>;
    data?: { orderId?: string }; // Para devolver el ID al crear
};

/**
 * Enum de Estados de Pedido. Debe coincidir con el ENUM de PostgreSQL `client_status`
 * en tu archivo database.types.ts, pero con la traducción si es necesario.
 */
export const OrderStatusEnum = z.enum(['Pendiente', 'Completado', 'Cancelado']);

// ----------------------------------------------------------------------
// 2. ESQUEMAS ZOD PARA LA BASE DE DATOS (CRUD)
// ----------------------------------------------------------------------

// Esquema Base para la estructura de la base de datos (Orders Row)
export const OrderDBSchema = z.object({
    id: z.string().uuid(),
    order_number: z.string().max(50),
    client_id: z.string().uuid(),
    product_id: z.string().uuid(),
    solicitant_id: z.string().uuid(),
    description: z.string().nullable().optional(),
    location: z.string().max(255).nullable().optional(),
    status: OrderStatusEnum,
    created_at: z.string().datetime(),
});

export type Order = z.infer<typeof OrderDBSchema>;

// Esquema para la Creación de Pedidos (Formulario de entrada principal)
export const CreateOrderSchema = z.object({
    client_id: z.string().uuid({ message: "Debe seleccionar un cliente válido." }),
    product_id: z.string().uuid({ message: "Debe seleccionar un tipo de producto." }),
    location: z.string()
        .min(3, 'La ubicación es obligatoria.')
        .max(255, 'La ubicación es demasiado larga.'),
    description: z.string()
        .max(500, 'La descripción es demasiado larga.')
        .optional()
        .or(z.literal('')), // Aceptar string vacío
});

export type CreateOrderFields = z.infer<typeof CreateOrderSchema>;

// Esquema para la Eliminación (Solo se necesita el ID)
export const DeleteOrderSchema = z.object({
    id: z.string().uuid({ message: "ID de pedido inválido para la eliminación." }),
});

// Esquema para la Actualización de Pedidos (usado por el Admin)
export const UpdateOrderSchema = CreateOrderSchema.partial().extend({
    id: z.string().uuid({ message: "ID de pedido inválido para la actualización." }),
    // Campo de entrada separado para el número de pedido (controlado)
    order_number_input: z.string().min(1, 'El número de pedido es obligatorio.').optional(),
    status: OrderStatusEnum.optional(),
});

export type UpdateOrderFields = z.infer<typeof UpdateOrderSchema>;


// ----------------------------------------------------------------------
// 3. TIPO EXTENDIDO (Para la vista de la tabla y formularios con JOINS)
// ----------------------------------------------------------------------

// TIPO UTILIDAD PARA DROPDOWNS
export type DropdownOption = {
    id: string;
    name: string;
}

// Definimos los tipos base usando la utilidad Tables de database.types.ts
type OrderRow = Tables<'orders'>;
type ClientRow = Tables<'clients'>;
type ProductRow = Tables<'products'>;
type ProfileNameRow = Pick<Tables<'profiles'>, 'first_name' | 'last_name'>;

/**
 * Define la estructura de datos para la vista de Pedidos y formularios de edición.
 */
export interface OrderExtended extends Omit<OrderRow, 'client_id' | 'product_id' | 'solicitant_id'> {
    // Sobreescribimos 'status' para forzar el uso del Enum Zod
    status: z.infer<typeof OrderStatusEnum>;

    // Relaciones: incluimos 'id' y 'name'
    clients: Pick<ClientRow, 'id' | 'name'>;
    products: Pick<ProductRow, 'id' | 'name'>;
    solicitant: ProfileNameRow;
}