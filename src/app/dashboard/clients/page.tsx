import { createClient } from '@/utils/supabase/server';
import { ClientTable } from '@/components/clients/client-table';
import { Client, ClientStatusEnum } from '@/lib/schemas/client';
import { notFound } from 'next/navigation';


// Componente de página principal (Server Component)
export default async function ClientsPage() {
    const supabase = await createClient();

    // 2. Obtener la lista de clientes - APLICANDO FILTRO POR ESTADO 'Active' O 'Pending'
    const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name, email, phone, status, created_at')
        // 💥 CORRECCIÓN CLAVE: Usamos .in() para filtrar por múltiples estados
        .in('status', [
            ClientStatusEnum.enum.Active,
            ClientStatusEnum.enum.Pending
        ])
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching clients:", error);
        return (
            <div className="p-6 text-red-500">
                Error al cargar la lista de clientes: {error.message}
            </div>
        );
    }

    // Usar el cast para resolver el error de tipificación
    const initialClients: Client[] = (clients || []) as unknown as Client[];

    // 3. Renderizar el componente de tabla (Client Component) y pasarle los datos
    return (
        <div className="">
            <ClientTable initialClients={initialClients} />
        </div>
    );
}