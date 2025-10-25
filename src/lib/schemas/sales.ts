import { z } from 'zod';

// Esquema para validar la entrada del formulario de creación de venta (tramo)
export const CreateSaleInputSchema = z.object({
    orderId: z.string().uuid({ message: 'ID de Pedido inválido.' }),
    // Validar altura y longitud como números positivos
    height: z.coerce // coerce convierte string a número
        .number('La altura debe ser un número.')
        .positive('La altura debe ser mayor que cero.')
        .max(100, 'Altura irreal.'), // Límite superior razonable
    length: z.coerce
        .number('La longitud debe ser un número.')
        .positive('La longitud debe ser mayor que cero.')
        .max(10000, 'Longitud irreal.'), // Límite superior razonable
    saleDescription: z.string().max(500, 'Descripción muy larga.').optional(),
});

export type CreateSaleInput = z.infer<typeof CreateSaleInputSchema>;

// Tipo para representar un ítem calculado (para mostrar en el formulario)
export type CalculatedItem = {
    item_key: string;
    item_label: string; // Etiqueta legible (ej: "Sección de Muro")
    item_value: number; // Valor calculado (cantidad)
    item_unit: string;  // Unidad (ej: "m³")
};

// Tipo para la respuesta de la acción de cálculo (paso intermedio)
export type CalculationResponse = {
    success: boolean;
    message?: string;
    items?: CalculatedItem[];
    unitRowUsed?: Record<string, number>; // Opcional: devolver la fila unitaria usada
};