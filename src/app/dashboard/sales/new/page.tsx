'use client';

import { createClient } from '@/utils/supabase/client';
import { notFound, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CreateSaleForm } from '@/components/sales/CreateSaleForm';
import { useEffect, useState } from 'react';

interface OrderDetails {
    id: string;
    order_number: string;
    clients?: {
        name: string;
    };
    products?: {
        id: string;
        name: string;
        unit_table_name: string;
    };
    availableHeights?: number[];
    error?: string;
}

export default function NewSalePage() {
    const searchParams = useSearchParams();
    const orderIdParam = searchParams?.get('orderId');
    const orderId = orderIdParam || ''; // Asegurar que siempre sea un string
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchOrderDetails() {
            if (!orderId) {
                setError('ID de pedido no proporcionado');
                setLoading(false);
                return;
            }

            try {
                const supabase = createClient();

                // 1. Obtener los detalles del pedido incluyendo la tabla de unidades
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .select(`
                        id,
                        order_number,
                        clients ( name ),
                        products ( id, name, unit_table_name )
                    `)
                    .eq('id', orderId)
                    .single();

                if (orderError) throw orderError;
                if (!orderData) throw new Error('Pedido no encontrado');

                // 2. Obtener las alturas disponibles de la tabla correspondiente
                const unitTableName = orderData.products?.unit_table_name;
                let availableHeights: number[] = [];

                // Lista de tablas permitidas para evitar inyección SQL
                const allowedTables = ['tabla_gavioflex_units', 'tabla_gavioterranet_units'];

                if (unitTableName && allowedTables.includes(unitTableName)) {
                    try {
                        // Usar una aserción de tipo para asegurar a TypeScript que es seguro
                        const tableName = unitTableName as 'tabla_gavioflex_units' | 'tabla_gavioterranet_units';
                        const { data: heightsData, error: heightsError } = await supabase
                            .from(tableName)
                            .select('altura')
                            .order('altura', { ascending: true });

                        if (!heightsError && heightsData) {
                            availableHeights = heightsData.map(item => item.altura);
                        }
                    } catch (error) {
                        console.error('Error al cargar las alturas:', error);
                    }
                }

                // 3. Combinar los datos del pedido con las alturas disponibles
                setOrder({
                    ...orderData,
                    availableHeights
                } as OrderDetails);

            } catch (err: any) {
                console.error('Error al cargar el pedido:', err);
                setError(err.message || 'Error al cargar el pedido');
            } finally {
                setLoading(false);
            }
        }

        fetchOrderDetails();
    }, [orderId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !order || !orderId) {
        return (
            <div className="p-8">
                <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
                    {error || 'No se pudo cargar el pedido'}
                </div>
                <Button asChild variant="outline">
                    <Link href="/dashboard/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a pedidos
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <Card className="w-full max-w-[100vw] min-h-[40vw] mx-auto border-border shadow-md">
            <CardHeader className="bg-muted/30">
                <CardTitle className="text-lg">Pedido #{order.order_number}</CardTitle>
                <CardDescription>
                    Cliente: <span className="font-medium text-foreground">{order.clients?.name ?? 'N/A'}</span> |
                    Producto: <span className="font-medium text-foreground">{order.products?.name ?? 'N/A'}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="">
                {orderId && order && (
                    <CreateSaleForm
                        orderId={orderId}
                        productUnitTable={order.products?.unit_table_name || ''}
                        availableHeights={order.availableHeights || []}
                    />
                )}
            </CardContent>
        </Card>
    );
}