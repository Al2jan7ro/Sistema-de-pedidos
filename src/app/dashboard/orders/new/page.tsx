import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Client } from '@/lib/schemas/client';
import { Product } from '@/lib/schemas/product';
import { CreateOrderForm } from '@/components/orders/CreateOrderForm';

// Función para obtener clientes
async function fetchClients(): Promise<Client[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }
    return clients as Client[];
}

// Función para obtener productos
async function fetchProducts(): Promise<Product[]> {
    const supabase = await createClient();

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    return products as Product[];
}

export default async function NewOrderPage() {
    const [clients, products] = await Promise.all([
        fetchClients(),
        fetchProducts()
    ]);

    return (
        <>
            <CreateOrderForm clients={clients} products={products} />
        </>
    );
}