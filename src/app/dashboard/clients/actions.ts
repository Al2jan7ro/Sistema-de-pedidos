'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';
import { ClientFormSchema, DeleteClientSchema, ClientStatusEnum } from '@/lib/schemas/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Tipos de retorno para manejar errores y datos
export type ActionResponse = {
    success: boolean;
    message: string;
    fieldErrors?: Record<string, string>;
};

// Requiere el 'id' y hace que el resto de campos del formulario sean opcionales
const UpdateClientSchema = ClientFormSchema.partial().required({ id: true });

const SYSTEM_USER_ID = process.env.SUPABASE_SYSTEM_USER_ID ?? null;

// 1. CREAR CLIENTE (Server Action) - 💥 CORREGIDO: Eliminado redirect
export async function addClient(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    //Usar ClientFormSchema para la validación del formulario de creación.
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = ClientFormSchema.safeParse(rawData);

    // 2. Manejar la validación fallida de Zod
    if (!validatedFields.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of validatedFields.error.issues) {
            const fieldName = issue.path[0];
            if (typeof fieldName === 'string') {
                fieldErrors[fieldName] = issue.message;
            }
        }
        return {
            success: false,
            message: 'Completa los campos correctamente',
            fieldErrors: fieldErrors,
        };
    }

    //clientData no tendrá id ni created_at, lo cual es correcto para la inserción.
    const clientData = validatedFields.data;

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const createdBy = user?.id ?? SYSTEM_USER_ID ?? null;

    // 3. Insertar el cliente en Supabase usando el service client
    const { error } = await serviceSupabase.from('clients').insert({
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        status: clientData.status,
        created_by: createdBy,
    });

    // 4. Manejar errores de la base de datos (ej. email duplicado)
    if (error) {
        console.error('Database insertion error:', error);
        let errorMessage = 'Error al crear el cliente.';

        if (error.code === '23505') { // Código de error de duplicidad (Unique Constraint)
            errorMessage = 'El correo electrónico ya está registrado. Verifique la información.';
        }

        return {
            success: false,
            message: errorMessage,
        };
    }

    // 5. Revalidar la ruta y DEVOLVER EL ESTADO DE ÉXITO. 
    // La redirección ahora debe hacerse en el componente del cliente (useEffect).
    revalidatePath('/dashboard/clients');
    return { success: true, message: 'Cliente creado con éxito.' };
}


// 2. ACTUALIZAR CLIENTE (updateClient) - 💥 CORREGIDO: Eliminado redirect
export async function updateClient(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const supabase = await createClient();

    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = UpdateClientSchema.safeParse(rawData);

    if (!validatedFields.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of validatedFields.error.issues) {
            const fieldName = issue.path[0];
            if (typeof fieldName === 'string') {
                fieldErrors[fieldName] = issue.message;
            }
        }
        return {
            success: false,
            message: 'Fallo la validación de los datos para actualizar.',
            fieldErrors: fieldErrors,
        };
    }

    const { id, ...updateData } = validatedFields.data;

    // 3. Actualizar el cliente en Supabase
    const { error } = await supabase.from('clients')
        .update(updateData)
        .eq('id', id);

    if (error) {
        console.error('Database update error:', error);
        let errorMessage = 'Error al actualizar el cliente.';
        if (error.code === '23505') {
            errorMessage = 'El correo electrónico ya está registrado. Verifique la información.';
        }
        return { success: false, message: errorMessage };
    }

    revalidatePath('/dashboard/clients');
    // 💥 CORRECCIÓN: Devolvemos el estado de éxito. El cliente gestiona el toast y la redirección.
    return { success: true, message: 'Cliente actualizado con éxito.' };
}


// 3. ELIMINACIÓN LÓGICA (softDeleteClient) - ✅ ESTABA CORRECTA
// Devuelve el estado de éxito, lo cual permite que el toast se muestre antes de que la página se revalide.
export async function softDeleteClient(
    prevState: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    const supabase = await createClient();

    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = DeleteClientSchema.safeParse(rawData); // Solo valida el ID

    if (!validatedFields.success) {
        return { success: false, message: 'ID de cliente no válido.' };
    }

    const { id } = validatedFields.data;

    // Actualizar el estado a 'Inactive'
    const { error } = await supabase.from('clients')
        // Usamos ClientStatusEnum.enum.Inactive para asegurar que el valor es correcto
        .update({ status: ClientStatusEnum.enum.Inactive })
        .eq('id', id);

    if (error) {
        console.error('Database soft delete error:', error);
        return {
            success: false,
            message: 'Error al desactivar el cliente. Vuelve a intentarlo.'
        };
    }

    revalidatePath('/dashboard/clients');

    // Retorna el estado de éxito, permitiendo que el toast se muestre.
    return { success: true, message: 'Cliente desactivado (eliminación lógica) con éxito.' };
}