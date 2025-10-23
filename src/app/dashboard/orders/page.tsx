import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { OrderExtended } from '@/lib/schemas/orders';
import { OrderTable } from '@/components/orders/OrderTable';

// Función Server Component para obtener todos los pedidos
async function fetchOrders(): Promise<OrderExtended[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Consulta con JOINS
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            id,
            order_number,
            description,
            status,
            created_at,
            clients(name),
            products(name),
            solicitant:profiles!orders_solicitant_id_fkey(first_name, last_name),
            order_attachments(id, type, storage_path, created_at)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    // Mantenemos la doble conversión para evitar el error de tipado con joins
    return orders as unknown as OrderExtended[];
}

export default async function OrdersPage() {
    // Para forzar la revalidación de datos si es necesario
    // export const dynamic = 'force-dynamic'; 

    const initialOrders = await fetchOrders();

    return (
        <>
            <OrderTable initialOrders={initialOrders} />
        </>
    );
}