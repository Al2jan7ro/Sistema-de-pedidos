import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { SalesTable } from '@/components/sales/SalesTable'; // El componente de tabla cliente
import { SaleExtended } from '@/lib/schemas/sales';

// Función para obtener todas las ventas (activas por defecto)
async function fetchSales(): Promise<SaleExtended[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Solo admin puede ver esta página (aunque RLS protege los datos)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') redirect('/dashboard?error=unauthorized');

    const { data, error } = await supabase
        .from('sales')
        .select(`
            id,
            sale_code,
            height,
            length,
            sale_description,
            status,
            created_at,
            orders ( id, order_number, products (name), clients (name) ),
            profiles ( first_name, last_name ) 
        `)
        .in('status', ['pending', 'completed'])  // Para ver solo pendientes y completadas
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching sales:", error);
        return [];
    }

    // Asegurar que TS infiera el tipo correcto
    return (data as any[]) as SaleExtended[];
}

export default async function SalesPage() {
    const sales = await fetchSales();

    return (
        <>
            <SalesTable initialSales={sales} />
        </>
    );
}