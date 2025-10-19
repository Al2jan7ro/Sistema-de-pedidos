import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import {
    OrderExtended,
    DropdownOption
} from '@/lib/schemas/orders';
import { EditOrderForm } from '@/components/orders/EditOrderForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface EditPageProps {
    params: { id: string };
}

// 1. Fetch the specific order data (with joins)
async function fetchOrder(id: string): Promise<OrderExtended | null> {
    const supabase = await createClient();

    // Consulta con JOINS: Incluimos 'id' y 'name' en los joins de clients y products
    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            id,
            order_number,
            description,
            location,
            status,
            created_at,
            clients(id, name), 
            products(id, name),
            solicitant:profiles!orders_solicitant_id_fkey(first_name, last_name)
        `)
        .eq('id', id)
        .single();

    if (error || !order) {
        console.error('Error fetching order for edit:', error);
        return null;
    }

    // Mantenemos la doble conversión para evitar el error de tipado con joins
    return order as unknown as OrderExtended;
}

// 2. Fetch all clients and products for dropdowns
async function fetchRelatedData(): Promise<{ clients: DropdownOption[], products: DropdownOption[] }> {
    const supabase = await createClient();

    const [clientsResult, productsResult] = await Promise.all([
        supabase.from('clients').select('id, name').order('name', { ascending: true }),
        supabase.from('products').select('id, name').order('name', { ascending: true })
    ]);

    // Mapeamos los resultados al tipo DropdownOption
    const clients: DropdownOption[] = clientsResult.data?.map(c => ({ id: c.id, name: c.name })) || [];
    const products: DropdownOption[] = productsResult.data?.map(p => ({ id: p.id, name: p.name })) || [];

    return { clients, products };
}


export default async function EditOrderPage({ params }: EditPageProps) {
    // CORRECCIÓN FINAL: Aplicar la lógica de desestructuración con 'await'
    // Esto resuelve el error de "sync-dynamic-apis" de Next.js.
    const { id: orderId } = await params;

    // Verificar que el ID sea válido
    if (!orderId) {
        notFound();
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verificación de autenticación y autorización
    if (!user) {
        redirect('/login');
    }

    const orderPromise = fetchOrder(orderId);
    const relatedDataPromise = fetchRelatedData();

    // Esperamos las dos promesas en paralelo
    const [order, { clients, products }] = await Promise.all([orderPromise, relatedDataPromise]);

    // 2. Verificación de existencia del pedido
    if (!order) {
        return (
            <div className="flex-1 space-y-8 p-8 pt-6">
                <Card className="shadow-lg border-border">
                    <CardHeader>
                        <CardTitle>Pedido No Encontrado</CardTitle>
                        <CardDescription>El pedido con ID "{orderId}" no existe o no tiene permisos para acceder.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <>
            <EditOrderForm
                order={order}
                clients={clients}
                products={products}
            />
        </>
    );
}

// Forzar el fetch de datos en cada solicitud (importante para Server Components)
export const dynamic = 'force-dynamic';
