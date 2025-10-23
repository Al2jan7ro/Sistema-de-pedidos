'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { CreateOrderSchema, DeleteOrderSchema, UpdateOrderSchema, ActionResponse } from '@/lib/schemas/orders'; // Importamos los esquemas y ActionResponse
import { format } from 'date-fns';
import { z } from 'zod';

// --- CONFIGURACIÓN DE ADJUNTOS ---
// Tipos MIME permitidos (Imágenes, PDF y CAD comunes)
const ALLOWED_MIME_TYPES = [
    // Imágenes
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // PDF
    'application/pdf',
    // CAD (DXF, DWG - asumiendo tipos comunes)
    'application/dxf', 'application/acad', 'application/x-autocad',
    'application/dwg', 'application/x-dwg'
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // Límite de 5MB por archivo

// --- UTILIDAD ---
/**
 * Genera un número de pedido único basado en la fecha y un sufijo aleatorio.
 */
function generateOrderNumber(): string {
    const date = format(new Date(), 'yyyyMMdd');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${date}-${randomSuffix}`;
}

// ----------------------------------------------------------------------
// 1. CREAR PEDIDO (addOrder)
// ----------------------------------------------------------------------
export async function addOrder(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: 'Usuario no autenticado. Inicie sesión.' };
    }
    const solicitant_id = user.id;

    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = CreateOrderSchema.safeParse(rawData);

    if (!validatedFields.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of validatedFields.error.issues) {
            const fieldName = issue.path[0];
            if (typeof fieldName === 'string') {
                fieldErrors[fieldName] = issue.message;
            }
        }
        return { success: false, message: 'Completa los campos obligatorios.', fieldErrors };
    }

    const { client_id, product_id, description, location } = validatedFields.data;
    const order_number = generateOrderNumber();

    // Insertar el pedido
    const { data, error } = await supabase.from('orders').insert({
        client_id,
        product_id,
        solicitant_id,
        order_number,
        description: description || null,
        location: location || null,
    }).select('id').single();

    if (error || !data) {
        console.error('Database insertion error:', error);
        let errorMessage = 'Error al crear el pedido.';
        if (error?.code === '23505') {
            errorMessage = 'Conflicto: El número de pedido generado ya existe (Intente de nuevo).';
        }
        // La RLS de INSERT maneja la autorización Solicitante/Admin.
        return { success: false, message: errorMessage };
    }

    revalidatePath('/dashboard/orders');
    return {
        success: true,
        message: `Pedido ${order_number} creado con éxito.`,
        data: { orderId: data.id }
    };
}

// ----------------------------------------------------------------------
// 2. SUBIR ADJUNTOS DE PEDIDO (uploadOrderAttachments)
// ----------------------------------------------------------------------
export async function uploadOrderAttachments(
    orderId: string,
    attachments: File[]
): Promise<ActionResponse> {
    const supabase = await createClient();

    const uploadedAttachments: { order_id: string, type: string, storage_path: string }[] = [];
    const errors: string[] = [];

    for (const file of attachments) {
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            errors.push(`Tipo de archivo no permitido: ${file.name}`);
            continue;
        }
        if (file.size > MAX_FILE_SIZE) {
            errors.push(`Archivo muy grande: ${file.name} (Límite: ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
            continue;
        }

        const fileExtension = file.name.split('.').pop() || 'tmp';
        const uniqueFileName = `${orderId}/${crypto.randomUUID()}.${fileExtension}`;

        const { data: storageData, error: uploadError } = await supabase.storage
            .from('order-files')
            .upload(uniqueFileName, file, { upsert: false });

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError);
            errors.push(`Error al subir: ${file.name}`);
            continue;
        }

        let fileType: string = 'Otro';
        if (file.type.startsWith('image/')) fileType = 'Imagen';
        else if (file.type === 'application/pdf') fileType = 'PDF';
        else if (file.type.includes('cad') || file.type.includes('dxf') || file.type.includes('dwg')) fileType = 'CAD';

        uploadedAttachments.push({
            order_id: orderId,
            type: fileType,
            storage_path: storageData.path,
        });
    }

    if (uploadedAttachments.length > 0) {
        const { error: dbError } = await supabase
            .from('order_attachments')
            .insert(uploadedAttachments);

        if (dbError) {
            console.error('Attachment DB Insert Error:', dbError);
            return { success: false, message: 'Archivos subidos pero no se pudieron registrar en la DB.' };
        }
    }

    if (errors.length > 0) {
        const successCount = uploadedAttachments.length;
        const errorMessage = `Se subieron ${successCount} de ${attachments.length} archivos. Errores: ${errors.join(', ')}`;
        return { success: successCount > 0, message: errorMessage };
    }

    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: true, message: `Se subieron ${uploadedAttachments.length} adjuntos con éxito.` };
}

// ----------------------------------------------------------------------
// 3. ACTUALIZAR PEDIDO (updateOrder)
// ----------------------------------------------------------------------
export async function updateOrder(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const supabase = await createClient();

    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = UpdateOrderSchema.safeParse(rawData);

    if (!validatedFields.success) {
        // En una actualización, los errores de campo son menos probables si el formulario es controlado
        return { success: false, message: 'Fallo la validación de los datos para actualizar.' };
    }

    // Extraemos el ID y el campo especial para el número de pedido
    const { id, order_number_input, ...updateData } = validatedFields.data;

    const payload: Record<string, any> = {};

    // Mapear campos actualizables
    for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
            payload[key] = value;
        }
    }

    // Mapear el campo de entrada del número de pedido al campo de la DB
    if (order_number_input !== undefined) {
        payload['order_number'] = order_number_input;
    }

    if (Object.keys(payload).length === 0) {
        return { success: false, message: 'No hay campos para actualizar.' };
    }

    // Actualizar el pedido en Supabase (RLS se encarga de que solo el dueño o Admin puedan hacerlo)
    const { error } = await supabase.from('orders')
        .update(payload)
        .eq('id', id);

    if (error) {
        console.error('Database update error:', error);
        let errorMessage = 'Error al actualizar el pedido.';
        if (error.code === '23505') {
            errorMessage = 'El número de pedido ya está registrado.';
        }
        return { success: false, message: errorMessage };
    }

    revalidatePath('/dashboard/orders');
    revalidatePath(`/dashboard/orders/${id}`);
    return { success: true, message: 'Pedido actualizado con éxito.' };
}

// ----------------------------------------------------------------------
// 4. ELIMINAR PEDIDO (deleteOrder)
// ----------------------------------------------------------------------
export async function deleteOrder(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const supabase = await createClient();

    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = DeleteOrderSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { success: false, message: 'ID de pedido no válido.' };
    }

    const { id } = validatedFields.data;

    // Eliminar el pedido en Supabase (RLS se encarga de la autorización)
    const { error } = await supabase.from('orders')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Database deletion error:', error);
        let errorMessage = 'Error al eliminar el pedido.';

        // Si hay una violación de clave foránea (ej: tiene una venta asociada)
        if (error.code === '23503') {
            errorMessage = 'No se puede eliminar el pedido porque tiene ventas asociadas o está referenciado por otra tabla.';
        }
        return { success: false, message: errorMessage };
    }

    revalidatePath('/dashboard/orders');
    return { success: true, message: 'Pedido eliminado con éxito.' };
}