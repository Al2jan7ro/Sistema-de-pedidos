'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import {
    AddProductSchema,
    UpdateProductSchema,
    DeleteProductSchema,
} from '@/lib/schemas/product';
import { ZodError } from 'zod';

export type ActionResponse = {
    success: boolean;
    message: string;
    fieldErrors?: Record<string, string[]>;
};

// --- ACCIÓN 1: CREAR TIPO DE PRODUCTO (Sin cambios) ---
export async function addProduct(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const data = Object.fromEntries(formData.entries());

    try {
        const validatedFields = AddProductSchema.parse(data);

        const supabase = await createClient();

        const { error } = await supabase
            .from('products')
            .insert({
                name: validatedFields.name,
                description: validatedFields.description || null,
            });

        if (error) {
            console.error('Supabase insert error (addProduct):', error);
            return { success: false, message: 'Error de base de datos o permiso denegado (solo Admin).' };
        }

    } catch (error) {
        if (error instanceof ZodError) {
            const fieldErrors = error.flatten().fieldErrors;
            return { success: false, message: 'Faltan campos obligatorios o son inválidos.', fieldErrors };
        }
        return { success: false, message: 'Un error inesperado ocurrió durante la creación.' };
    }

    revalidatePath('/dashboard/products');
    return { success: true, message: 'Producto creado con éxito.' };
}

// --- ACCIÓN 2: ACTUALIZAR TIPO DE PRODUCTO (Ya corregida) ---
export async function updateProduct(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const data = Object.fromEntries(formData.entries());

    try {
        const validatedFields = UpdateProductSchema.parse(data);
        const { id, ...updateData } = validatedFields;

        const supabase = await createClient();

        const { error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('Supabase update error (updateProduct):', error);
            return { success: false, message: 'Error de base de datos o permiso denegado (solo Admin).' };
        }

    } catch (error) {
        if (error instanceof ZodError) {
            const fieldErrors = error.flatten().fieldErrors;
            return { success: false, message: 'Faltan campos obligatorios o son inválidos.', fieldErrors };
        }
        return { success: false, message: 'Un error inesperado ocurrió durante la actualización.' };
    }

    revalidatePath('/dashboard/products');
    revalidatePath(`/dashboard/products/edit/${data.id}`, 'page');

    return { success: true, message: 'Tipo de producto actualizado con éxito.' };
}

// --- ACCIÓN 3: ELIMINACIÓN FÍSICA (💥 CORREGIDA: Se añadió un retraso) ---
export async function deleteProduct(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const data = Object.fromEntries(formData.entries());

    try {
        const validatedFields = DeleteProductSchema.parse(data);
        const { id } = validatedFields;

        const supabase = await createClient();

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase delete error (deleteProduct):', error);
            return { success: false, message: 'Error al eliminar el producto o permiso denegado (solo Admin).' };
        }

    } catch (error) {
        if (error instanceof ZodError) {
            return { success: false, message: 'ID de producto inválido.' };
        }
        return { success: false, message: 'Un error inesperado ocurrió durante la eliminación.' };
    }

    revalidatePath('/dashboard/products');

    // 💡 AÑADIMOS UN RETRASO DE 500ms: Esto garantiza que el spinner de carga
    // y el toast tengan tiempo de ser visibles para el usuario.
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true, message: 'Tipo de producto eliminado con éxito.' };
}