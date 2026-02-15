'use server';

import { createClient } from '@/utils/supabase/server';

import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/lib/schemas/orders';
import {
    SaleInputSchema, // Use the base schema for create input
    EditSaleInputSchema,
    CancelSaleSchema,
    CalculationResponse,
    CalculatedItem
} from '@/lib/schemas/sales';

type UnitTableName = 'tabla_gavioflex_units' | 'tabla_gavioterranet_units';

// --- Mappings (MUST MATCH DB COLUMN NAMES EXACTLY) ---
const ITEM_KEY_TO_UNIT: Record<string, string> = {
    "seccion de muro": "m³",
    "canasta de 2x1x1": "und",
    "canasta de 1,5x1x1": "und",
    "canasta de 2x1x0,5": "und",
    "geotextil 1600": "m²",
    "geotextil planar": "m²", // Check spacing if needed
    "toba cemento": "m³",
    "tuberia": "und",
    "geotextil 1700": "m²",
    "geotextil 2100": "m²",
    "geotextil 2400": "m²",
    "geotextil 3000": "m²",
    "geotextil 4000": "m²",
    "geotextil 5000": "m²",
    "geotextil 6000": "m²",
    "geotextil 10000": "m²",
    // Add OTHERS if they exist in your tables
};

const ITEM_KEY_TO_LABEL: Record<string, string> = {
    "seccion de muro": "Sección de Muro",
    "canasta de 2x1x1": "Canasta 2x1x1",
    "canasta de 1,5x1x1": "Canasta 1.5x1x1",
    "canasta de 2x1x0,5": "Canasta 2x1x0.5",
    "geotextil 1600": "Geotextil 1600",
    "geotextil planar": "Geotextil Planar",
    "toba cemento": "Toba Cemento",
    "tuberia": "Tubería",
    "geotextil 1700": "Geotextil 1700",
    "geotextil 2100": "Geotextil 2100",
    "geotextil 2400": "Geotextil 2400",
    "geotextil 3000": "Geotextil 3000",
    "geotextil 4000": "Geotextil 4000",
    "geotextil 5000": "Geotextil 5000",
    "geotextil 6000": "Geotextil 6000",
    "geotextil 10000": "Geotextil 10000",
    // Add OTHERS
};


// --- ACTION 1: Calculate Items ---
export async function calculateSaleItems(
    orderId: string,
    height: number,
    length: number
): Promise<CalculationResponse> {
    const supabase = await createClient(); // Uses service role for reads if needed, but RLS allows authenticated reads

    if (!orderId || !height || !length || height <= 0 || length <= 0) {
        return { success: false, message: 'ID, Altura y Longitud son requeridos y deben ser positivos.' };
    }

    try {
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('products(unit_table_name)')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData?.products?.unit_table_name) {
            throw new Error(`Pedido ${orderId} o producto no configurado con tabla de unidades.`);
        }
        const unitTableName = orderData.products.unit_table_name as UnitTableName;

        const { data: unitRow, error: unitError } = await supabase
            .from(unitTableName)
            .select('*')
            .eq('altura', height) // Exact match
            .single();

        if (unitError || !unitRow) {
            throw new Error(`Valores unitarios no encontrados para altura ${height}m en ${unitTableName}.`);
        }

        const calculatedItems: CalculatedItem[] = [];
        for (const key in unitRow) {
            // Ensure key is a valid material column (string) and its value is a number
            if (key !== 'id' && key !== 'altura' && typeof unitRow[key as keyof typeof unitRow] === 'number') {
                const unitValue = unitRow[key as keyof typeof unitRow] as number;
                let totalValue = unitValue * length;

                // --- CUSTOM DIVISION LOGIC (Based on your previous actions.ts) ---
                // Lógica para tabla_gavioterranet_units
                if (
                    key === 'canasta de 2x1x1' ||
                    key === 'canasta de 1,5x1x1' ||
                    key === 'canasta de 2x1x0,5' ||
                    key === 'geotextil planar' // Check exact name
                ) {
                    totalValue /= 2;
                    // Lógica para tabla_gavioflex_units
                } else if (
                    key === 'seccion_cuna' ||
                    key === 'seccion_zapata' ||
                    key === 'seccion_contrafuerte'
                ) {
                    totalValue /= 2;
                } else if (key === 'tuberia') {
                    totalValue /= 6;
                }
                // --- END DIVISION LOGIC ---

                if (totalValue > 0) {
                    calculatedItems.push({
                        item_key: key, // Keep the exact DB key
                        item_label: ITEM_KEY_TO_LABEL[key] || key, // Fallback to key if no label
                        item_value: parseFloat(totalValue.toFixed(3)),
                        item_unit: ITEM_KEY_TO_UNIT[key] || 'u', // Fallback to 'u' if no unit
                    });
                }
            }
        }

        if (calculatedItems.length === 0) {
            return { success: false, message: 'No se calcularon materiales (verifique longitud o valores unitarios).' };
        }

        // Return calculated items and the raw unit row used
        return { success: true, items: calculatedItems, unitRowUsed: unitRow };

    } catch (error: unknown) {
        console.error('Error en calculateSaleItems:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Error interno al calcular.' };
    }
}

// --- ACTION 2: Create Sale ---
export async function createSale(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Usuario no autenticado.' };
    const adminId = user.id; // RLS will verify if this user is 'admin' on insert

    const validatedFields = SaleInputSchema.safeParse({ // Use base schema for create
        orderId: formData.get('orderId'),
        height: formData.get('height'),
        length: formData.get('length'),
        saleDescription: formData.get('saleDescription'),
    });

    if (!validatedFields.success) {
        return { success: false, message: 'Error de validación.', fieldErrors: validatedFields.error.flatten().fieldErrors };
    }
    const { orderId, height, length, saleDescription } = validatedFields.data;

    try {
        // Recalculate server-side to ensure data integrity
        const calculationResult = await calculateSaleItems(orderId, height, length);
        if (!calculationResult.success || !calculationResult.items) {
            throw new Error(calculationResult.message || 'Fallo el re-cálculo en el servidor.');
        }
        const calculatedItems = calculationResult.items;

        const saleCode = `V-${orderId.substring(0, 4)}-${Date.now().toString().slice(-5)}`;

        // Transaction Part 1: Insert Sale
        const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert({
                order_id: orderId,
                sale_code: saleCode,
                admin_id: adminId,
                sale_description: saleDescription || null, // Ensure null if empty
                height: height,
                length: length,
                status: 'pending', // Use 'pending' as per DB schema
            })
            .select('id')
            .single();

        if (saleError || !saleData) throw saleError || new Error('Fallo al insertar venta (Verifique RLS de Admin).');
        const saleId = saleData.id;

        // Transaction Part 2: Insert Sale Items
        const itemsToInsert = calculatedItems.map(item => ({
            sale_id: saleId,
            item_key: item.item_key, // Exact DB key
            item_value: item.item_value,
            item_unit: item.item_unit,
        }));

        const { error: itemsError } = await supabase.from('sale_items').insert(itemsToInsert);
        if (itemsError) {
            await supabase.from('sales').delete().eq('id', saleId); // Attempt rollback
            throw itemsError;
        }

        revalidatePath('/dashboard/sales'); // Revalidate sales list
        revalidatePath(`/dashboard/orders/${orderId}`); // Revalidate order details/receipt

        return { success: true, message: `Venta ${saleCode} registrada con ${itemsToInsert.length} materiales.` };

    } catch (error: unknown) {
        console.error('Error en createSale:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Error interno al crear la venta.' };
    }
}

// --- ACTION 3: Update Sale ---
export async function updateSale(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Usuario no autenticado.' };
    // RLS will handle admin check on update

    const validatedFields = EditSaleInputSchema.safeParse({ // Use edit schema
        saleId: formData.get('saleId'),
        orderId: formData.get('orderId'), // Need orderId for recalculation
        height: formData.get('height'),
        length: formData.get('length'),
        saleDescription: formData.get('saleDescription'),
    });

    if (!validatedFields.success) {
        return { success: false, message: 'Error de validación.', fieldErrors: validatedFields.error.flatten().fieldErrors };
    }
    const { saleId, orderId, height, length, saleDescription } = validatedFields.data;

    try {
        // Recalculate based on potentially new height/length
        const calculationResult = await calculateSaleItems(orderId, height, length);
        if (!calculationResult.success || !calculationResult.items) {
            throw new Error(calculationResult.message || 'Fallo el re-cálculo en el servidor para la actualización.');
        }
        const calculatedItems = calculationResult.items;

        // Update Sale Header
        const { error: saleUpdateError } = await supabase
            .from('sales')
            .update({
                height: height,
                length: length,
                sale_description: saleDescription || null,
                // Do not update sale_code or admin_id generally
            })
            .eq('id', saleId);
        if (saleUpdateError) throw saleUpdateError;

        // Delete OLD items
        const { error: deleteError } = await supabase.from('sale_items').delete().eq('sale_id', saleId);
        if (deleteError) throw deleteError;

        // Insert NEW items
        const itemsToInsert = calculatedItems.map(item => ({
            sale_id: saleId,
            item_key: item.item_key,
            item_value: item.item_value,
            item_unit: item.item_unit,
        }));
        const { error: itemsInsertError } = await supabase.from('sale_items').insert(itemsToInsert);
        if (itemsInsertError) throw itemsInsertError; // Data might be inconsistent if this fails

        revalidatePath('/dashboard/sales');
        revalidatePath(`/dashboard/sales/edit/${saleId}`);
        revalidatePath(`/dashboard/orders/${orderId}`);

        return { success: true, message: `Venta actualizada con éxito.` };

    } catch (error: unknown) {
        console.error('Error en updateSale:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Error interno al actualizar.' };
    }
}


// --- ACTION 4: Cancel Sale (Logical Delete) ---
export async function cancelSale(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Usuario no autenticado.' };
    // RLS handles admin check

    const validatedFields = CancelSaleSchema.safeParse({ saleId: formData.get('saleId') });
    if (!validatedFields.success) return { success: false, message: 'ID de Venta inválido.' };
    const { saleId } = validatedFields.data;

    try {
        // Get order_id before cancelling for revalidation path
        const { data: saleData } = await supabase.from('sales').select('order_id').eq('id', saleId).single();

        const { error } = await supabase
            .from('sales')
            .update({ status: 'deleted' }) // Use 'deleted' as per DB schema
            .eq('id', saleId); // RLS should protect this
        if (error) throw error;

        revalidatePath('/dashboard/sales');
        if (saleData?.order_id) {
            revalidatePath(`/dashboard/orders/${saleData.order_id}`); // Revalidate order receipt
        }

        return { success: true, message: 'Venta cancelada con éxito.' };

    } catch (error: unknown) {
        console.error('Error en cancelSale:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Error interno al cancelar.' };
    }
}

// --- ACTION 5: Get Order Totals (Summation) ---
export async function getOrderTotals(orderId: string) {
    const supabase = await createClient();

    if (!orderId) {
        console.error("getOrderTotals: Invalid orderId provided.");
        return { materials: [], totalLength: 0, error: "ID de pedido inválido." };
    }

    // 1. Contar las ventas activas para decidir la lógica a aplicar
    const { data: activeSales, error: salesError } = await supabase
        .from('sales')
        .select('id, length', { count: 'exact' })
        .eq('order_id', orderId)
        .in('status', ['pending', 'completed']);

    if (salesError) {
        console.error("Error fetching sales for totals:", salesError);
        return { materials: [], totalLength: 0, error: "Error al obtener las ventas del pedido." };
    }

    const salesCount = activeSales?.length ?? 0;

    // LÓGICA CONDICIONAL
    // A. Si hay MÁS de una venta, sumar los totales.
    if (salesCount > 1) {
        const [materialsResult, totalLengthResult] = await Promise.all([
            supabase.rpc('get_order_totals_by_id', { p_order_id: orderId }),
            supabase.rpc('get_order_total_length', { p_order_id: orderId })
        ]);

        if (materialsResult.error || totalLengthResult.error) {
            console.error("Error calling RPC functions for totals:", materialsResult.error || totalLengthResult.error);
            return { materials: [], totalLength: 0, error: "Error al calcular los totales del pedido." };
        }

        const materials = (materialsResult.data || []).map((mat: { item_key: string; item_unit: string; total_value: number }) => ({
            ...mat,
            label: ITEM_KEY_TO_LABEL[mat.item_key] || mat.item_key
        }));
        const totalLength = totalLengthResult.data || 0;

        return {
            materials: materials.filter((m: { total_value: number }) => m.total_value > 0) as {
                item_key: string;
                item_unit: string;
                total_value: number;
                label: string
            }[],
            totalLength: parseFloat(totalLength.toFixed(3)),
            error: null
        };
    }
    // B. Si hay EXACTAMENTE una venta, devolver sus datos directamente.
    else if (salesCount === 1) {
        const singleSale = activeSales[0];
        const { data: saleItems, error: itemsError } = await supabase
            .from('sale_items')
            .select('item_key, item_unit, item_value')
            .eq('sale_id', singleSale.id);

        if (itemsError) {
            console.error("Error fetching items for single sale:", itemsError);
            return { materials: [], totalLength: 0, error: "Error al obtener los materiales de la venta." };
        }

        const materials = (saleItems || []).map(item => ({
            item_key: item.item_key,
            item_unit: item.item_unit,
            total_value: item.item_value, // El nombre del campo es `total_value` en el tipo de retorno esperado
            label: ITEM_KEY_TO_LABEL[item.item_key] || item.item_key
        }));

        return { materials, totalLength: singleSale.length || 0, error: null };
    }
    // C. Si no hay ventas, devolver vacío.
    else {
        return { materials: [], totalLength: 0, error: null };
    }
}


// --- HELPER ACTION: Get Pending Orders (For alternate creation flow) ---
export async function getPendingOrders() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Optional: Add admin check if only admins can initiate sales even via dropdown
    // const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    // if (profile?.role !== 'admin') return [];

    const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, clients(id, name), products(id, name)')
        .eq('status', 'Pendiente')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching pending orders:", error);
        return [];
    }
    return data || [];
}