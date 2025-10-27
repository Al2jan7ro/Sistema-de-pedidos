import { z } from 'zod';

// Schema for validating the input form for creating/editing a sale (tramo)
export const SaleInputSchema = z.object({
    orderId: z.string().uuid({ message: 'ID de Pedido inválido.' }),
    // Use string for Select input, coerce later if needed, but actions will use number
    height: z.coerce
        .number({ error: 'La altura debe ser un número.' })
        .positive({ message: 'La altura debe ser mayor que cero.' })
        .max(100, 'Altura irreal.'),
    length: z.coerce
        .number({ error: 'La longitud debe ser un número.' })
        .positive({ message: 'La longitud debe ser mayor que cero.' })
        .max(10000, 'Longitud irreal.'),
    saleDescription: z.string().max(500, 'Descripción muy larga.').optional().nullable(),
});

// Extend for Edit action
export const EditSaleInputSchema = SaleInputSchema.extend({
    saleId: z.string().uuid({ message: 'ID de Venta inválido.' }),
});

// Schema for Cancel action
export const CancelSaleSchema = z.object({
    saleId: z.string().uuid({ message: 'ID de Venta inválido.' }),
});

export type CreateSaleInput = z.infer<typeof SaleInputSchema>;
export type EditSaleInput = z.infer<typeof EditSaleInputSchema>;

// Type for a calculated item (used in form preview and server action)
export type CalculatedItem = {
    item_key: string;   // Exact key from the DB units table (e.g., "seccion de muro")
    item_label: string; // User-friendly label (e.g., "Sección de Muro")
    item_value: number; // Calculated quantity
    item_unit: string;  // Unit (e.g., "m³")
};

// Type for the response of the calculation action
export type CalculationResponse = {
    success: boolean;
    message?: string;
    items?: CalculatedItem[];
    unitRowUsed?: Record<string, number | string | null>; // Raw row used for calculation
};

// Extended type for displaying sales in the table
export interface SaleExtended {
    id: string; // saleId
    sale_code: string;
    height: number | null;
    length: number | null;
    sale_description: string | null;
    status: 'pending' | 'completed' | 'deleted'; // Match DB CHECK constraint
    created_at: string;
    // Joined data (adjust based on your actual SELECT in fetchSales)
    orders: {
        id: string;
        order_number: string;
        products: { name: string } | null;
        clients: { name: string } | null;
    } | null;
    profiles: { // Admin who created it
        first_name: string | null;
        last_name: string | null;
    } | null;
    // Add sale_items if needed directly in the table view
    sale_items?: { item_key: string; item_value: number; item_unit: string }[];
}

// Type for the data fetched specifically for the edit page, including available heights and potential error
export interface SaleForEditPageProps {
    id: string; // saleId
    sale_code: string;
    height: number | null;
    length: number | null;
    sale_description: string | null;
    status: 'pending' | 'completed' | 'deleted'; // Match DB CHECK constraint
    order_id: string | null; // Changed to allow null based on SaleExtended
    orders: {
        id: string;
        order_number: string;
        clients: { name: string } | null;
        products: { name: string; unit_table_name: string } | null;
    } | null;
    availableHeights: number[]; // Always present, even if empty
    error: string | null; // Always present, null if no error
}