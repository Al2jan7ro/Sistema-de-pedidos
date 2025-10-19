import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Client } from '@/lib/schemas/client';
import { ClientEditForm } from '@/components/clients/ClientEditForm';

// Tipificación de los parámetros de la ruta dinámica
interface EditPageProps {
    params: {
        id: string;
    };
}

// Función para obtener los datos del cliente por ID (sin cambios)
async function getClientById(clientId: string): Promise<Client | null> {
    const supabase = await createClient();

    const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

    if (error) {
        console.error("Error fetching client by ID:", error);
        return null;
    }
    return client as Client;
}

export default async function EditClientPage(props: EditPageProps) {
    // 💥 CORRECCIÓN CLAVE: Desestructurar params después de await
    // Esto resuelve la advertencia de Next.js sobre el uso de APIs dinámicas
    const { id: clientId } = await props.params;

    // Opcional: si quieres usar la sintaxis original, aunque menos limpia:
    // const clientId = await props.params.id;

    const clientData = await getClientById(clientId);

    if (!clientData) {
        notFound();
    }

    return (
        <>
            <ClientEditForm client={clientData} />
        </>
    );
}