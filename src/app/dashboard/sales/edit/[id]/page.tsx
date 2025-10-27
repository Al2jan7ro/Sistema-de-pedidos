import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EditSaleForm } from '@/components/sales/EditSaleForm';
import { SaleForEditPageProps } from '@/lib/schemas/sales'; // Import the new type

// Función para obtener la venta, su pedido asociado Y las alturas disponibles
async function fetchSaleForEdit(saleId: string): Promise<SaleForEditPageProps | null> {
    const supabase = await createClient();
    // ... (Verificar rol de Admin - igual que en NewSalePage) ...
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') redirect('/dashboard?error=unauthorized');

    // 1. Obtener datos de la venta Y su pedido asociado
    const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select(`
            id,
            sale_code,
            height,
            length,
            sale_description,
            status,
            order_id,
            orders (
                id,
                order_number,
                clients (name),
                products ( name, unit_table_name ) 
            )
        `)
        .eq('id', saleId)
        .single();

    if (saleError || !sale) {
        console.error("Error fetching sale for edit:", saleError);
        return null; // Not found
    }

    // Initialize the result object with sale data and default values for new properties
    let result: SaleForEditPageProps = {
        ...(sale as SaleForEditPageProps), // Use type assertion here
        availableHeights: [], // Initialize as empty array
        error: null, // Initialize as null
    };

    // No permitir editar ventas canceladas
    if (sale.status === 'Cancelled') {
        result.error = 'Esta venta ha sido cancelada y no puede editarse.';
        return result;
    }

    // Si no hay pedido asociado (error de datos) o tabla de unidades
    if (!sale.orders?.products?.unit_table_name) {
        result.error = 'El pedido asociado o su producto no están configurados correctamente.';
        return result;
    }

    const unitTableName = sale.orders.products.unit_table_name;
    // 2. Obtener alturas disponibles (igual que en NewSalePage)
    const allowedTables = ['tabla_gavioflex_units', 'tabla_gavioterranet_units'];
    if (allowedTables.includes(unitTableName)) {
        try {
            const { data: heightsData, error: heightsError } = await supabase
                .from(unitTableName as 'tabla_gavioflex_units' | 'tabla_gavioterranet_units')
                .select('altura')
                .order('altura', { ascending: true });
            if (!heightsError && heightsData) { // Populate availableHeights in the result object
                result.availableHeights = heightsData.map(h => h.altura);
            }
        } catch (e) { console.error("Error fetching heights for edit:", e); }
    }

    // Devolver la venta combinada con las alturas y el error (que será null si todo fue bien)
    return result;
}


export default async function EditSalePage({ params }: { params: { id: string } }) {
    const saleId = params.id;
    const saleData = await fetchSaleForEdit(saleId);

    if (!saleData) {
        notFound();
    }

    // Manejar errores como venta cancelada o mal configurada
    if (saleData.error) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-semibold text-yellow-600">No se puede editar</h1>
                <p className="text-muted-foreground mt-2">{saleData.error}</p>
                <Button asChild variant="outline" className="mt-4">
                    <Link href="/dashboard/sales"> {/* Volver a la lista de ventas */}
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Ventas
                    </Link>
                </Button>
            </div>
        );
    }

    // Asegurarse que tenemos los datos necesarios
    if (!saleData.orders || !saleData.orders.products) {
        return <p>Error: Datos incompletos del pedido asociado.</p>;
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">

            <h2 className="text-3xl font-bold tracking-tight">
                Editar Venta #{saleData.sale_code} (Pedido #{saleData.orders.order_number})
            </h2>
            <Card className="w-full max-w-3xl mx-auto border-border shadow-md">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg">Pedido #{saleData.orders.order_number}</CardTitle>
                    <CardDescription>
                        Cliente: <span className="font-medium text-foreground">{saleData.orders.clients?.name ?? 'N/A'}</span> |
                        Producto: <span className="font-medium text-foreground">{saleData.orders.products?.name ?? 'N/A'}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <EditSaleForm
                        sale={saleData} // Pasar todos los datos de la venta
                        availableHeights={saleData.availableHeights}
                    />
                </CardContent>
            </Card>
        </div>
    );
}