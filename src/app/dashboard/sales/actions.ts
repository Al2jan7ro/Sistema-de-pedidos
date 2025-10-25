'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

type UnitTableName = 'tabla_gavioflex_units' | 'tabla_gavioterranet_units';
import { ActionResponse } from '@/lib/schemas/orders';
import { CreateSaleInputSchema, CalculationResponse, CalculatedItem } from '@/lib/schemas/sales';

// --- Mapeos Constantes ---
const ITEM_KEY_TO_UNIT: Record<string, string> = {
    seccion_muro: 'm³',
    seccion_contrafuerte: 'm³',
    seccion_cuna: 'm³',
    seccion_zapata: 'm³',
    geotextil_nt_1600: 'm²',
    geotextil_nt_2000: 'm²',
    geotextil_nt_2500: 'm²',
    geotextil_nt_3000: 'm²',
    geotextil_nt_4000: 'm²',
    geotextil_nt_5000: 'm²',
    malla_triple_torsion: 'm²',
    alambre_de_amarre: 'kg',
    tensores: 'u',
};

const ITEM_KEY_TO_LABEL: Record<string, string> = {
    seccion_muro: 'Sección de Muro',
    seccion_contrafuerte: 'Sección de Contrafuerte',
    seccion_cuna: 'Sección de Cuña',
    seccion_zapata: 'Sección de Zapata',
    geotextil_nt_1600: 'Geotextil NT 1600',
    geotextil_nt_2000: 'Geotextil NT 2000',
    geotextil_nt_2500: 'Geotextil NT 2500',
    geotextil_nt_3000: 'Geotextil NT 3000',
    geotextil_nt_4000: 'Geotextil NT 4000',
    geotextil_nt_5000: 'Geotextil NT 5000',
    malla_triple_torsion: 'Malla Triple Torsión',
    alambre_de_amarre: 'Alambre de Amarre',
    tensores: 'Tensores',
};

// --- ACCIÓN 1: Calculate Items (Slightly Simplified Lookup) ---
export async function calculateSaleItems(
    orderId: string,
    height: number, // Height is now precise
    length: number
): Promise<CalculationResponse> {
    const supabase = await createClient();

    if (!orderId || !height || !length || height <= 0 || length <= 0) {
        return { success: false, message: 'ID de pedido, altura o longitud inválidos.' };
    }

    try {
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('products(unit_table_name)')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData?.products?.unit_table_name) {
            throw new Error(`Pedido ${orderId} o producto no configurado.`);
        }
        const unitTableName = orderData.products.unit_table_name as UnitTableName;

        const { data: unitRow, error: unitError } = await supabase
            .from(unitTableName)
            .select('*')
            .eq('altura', height) // Use exact equality check now
            .single();

        if (unitError || !unitRow) {
            throw new Error(`Valores unitarios no encontrados para la altura EXACTA ${height}m en ${unitTableName}. Verifica las tablas maestras.`);
        }

        const calculatedItems: CalculatedItem[] = [];
        for (const key in unitRow) {
            if (key !== 'id' && key !== 'altura' && typeof unitRow[key as keyof typeof unitRow] === 'number') {
                const unitValue = unitRow[key as keyof typeof unitRow] as number;
                let totalValue = unitValue * length;

                // --- LÓGICA DE DIVISIÓN PERSONALIZADA ---
                // Aplicar factores de conversión según el tipo de material
                if (
                    key === 'canasta de 2x1x1' || 
                    key === 'canasta de 1,5x1x1' || 
                    key === 'canasta de 2x1x0,5' ||
                    key === 'geotextil planar'
                ) {
                    // Para canastas y geotextil planar, dividir por 2
                    totalValue /= 2;
                } else if (key === 'tuberia') {
                    // Para tubería, dividir por 6 (cada 6 metros lineales = 1 unidad)
                    totalValue /= 6;
                }
                // --- FIN DE LA LÓGICA DE DIVISIÓN ---

                if (totalValue > 0) {
                    calculatedItems.push({
                        item_key: key,
                        item_label: ITEM_KEY_TO_LABEL[key] || key,
                        item_value: parseFloat(totalValue.toFixed(3)), // Redondear a 3 decimales
                        item_unit: ITEM_KEY_TO_UNIT[key] || 'u',
                    });
                }
            }
        }

        if (calculatedItems.length === 0) {
            return { success: false, message: 'No se calcularon ítems. La longitud podría ser cero o los valores unitarios son cero.' };
        }

        // Filtrar solo los valores numéricos para unitRowUsed, excluyendo el id
        const numericUnitRow: Record<string, number> = {};
        Object.entries(unitRow).forEach(([key, value]) => {
            if (key !== 'id' && typeof value === 'number') {
                numericUnitRow[key] = value;
            }
        });

        return {
            success: true,
            items: calculatedItems,
            unitRowUsed: numericUnitRow
        };

    } catch (error: any) {
        console.error('Error en calculateSaleItems:', error);
        return { success: false, message: error.message };
    }
}

// --- ACCIÓN 2: Create Sale (Uses the updated calculateSaleItems logic internally) ---
export async function createSale(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: 'Usuario no autenticado.' };
    }

    const validatedFields = CreateSaleInputSchema.safeParse({
        orderId: formData.get('orderId'),
        height: formData.get('height'),
        length: formData.get('length'),
        saleDescription: formData.get('saleDescription')
    });

    if (!validatedFields.success) {
        return { success: false, message: 'Datos de formulario inválidos.', fieldErrors: validatedFields.error.flatten().fieldErrors };
    }

    const { orderId, height, length, saleDescription } = validatedFields.data;

    try {
        const calculationResult = await calculateSaleItems(orderId, height, length);
        if (!calculationResult.success || !calculationResult.items) {
            throw new Error(calculationResult.message || 'Fallo el re-cálculo en el servidor.');
        }
        const calculatedItems = calculationResult.items;

        const saleCode = `V-${orderId.substring(0, 4)}-${Date.now().toString().slice(-5)}`;

        const { data: saleData, error: saleError } = await supabase.from('sales').insert({
            order_id: orderId,
            sale_code: saleCode,
            height,
            length,
            sale_description: saleDescription,
            admin_id: user.id,
        }).select('id').single();

        if (saleError || !saleData) throw saleError || new Error('Fallo al insertar venta.');
        const saleId = saleData.id;

        const itemsToInsert = calculatedItems.map(item => ({
            sale_id: saleId,
            item_key: item.item_key,
            // item_label no se almacena en la DB, se deriva de item_key
            item_value: item.item_value,
            item_unit: item.item_unit,
        }));

        const { error: itemsError } = await supabase.from('sale_items').insert(itemsToInsert);

        if (itemsError) {
            await supabase.from('sales').delete().eq('id', saleId); // Rollback
            throw itemsError;
        }

        revalidatePath('/dashboard/orders');
        revalidatePath(`/dashboard/orders/${orderId}`);
        revalidatePath('/dashboard/sales');

        return { success: true, message: `Venta ${saleCode} registrada.` };

    } catch (error: any) {
        console.error('Error en createSale:', error);
        return { success: false, message: error.message || 'Error desconocido al crear la venta.' };
    }
}

// --- ACCIÓN 3: getOrderTotals (No changes needed) ---
export async function getOrderTotals(orderId: string) {
    const supabase = await createClient();

    // Primero obtenemos las ventas asociadas al pedido
    const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id')
        .eq('order_id', orderId);

    if (salesError || !salesData?.length) {
        console.error('Error fetching sales for order:', salesError);
        return {};
    }

    const saleIds = salesData.map(sale => sale.id);

    // Luego obtenemos los ítems de venta
    const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select('*')
        .in('sale_id', saleIds);

    if (itemsError || !itemsData) {
        console.error('Error fetching sale items:', itemsError);
        return {};
    }

    const totals: Record<string, { total: number; unit: string; label: string }> = {};

    // Procesamos los ítems
    for (const item of itemsData) {
        const itemData = item as unknown as {
            item_key: string;
            item_value: number;
            item_unit?: string;
            item_label?: string;
        };

        if (!itemData.item_key) continue;

        if (!totals[itemData.item_key]) {
            totals[itemData.item_key] = {
                total: 0,
                unit: itemData.item_unit || ITEM_KEY_TO_UNIT[itemData.item_key] || 'un',
                label: itemData.item_label || ITEM_KEY_TO_LABEL[itemData.item_key] || itemData.item_key
            };
        }

        if (typeof itemData.item_value === 'number') {
            totals[itemData.item_key].total += itemData.item_value;
        }
    }

    // Redondear totales
    for (const key in totals) {
        totals[key].total = parseFloat(totals[key].total.toFixed(3));
    }

    return totals;
}