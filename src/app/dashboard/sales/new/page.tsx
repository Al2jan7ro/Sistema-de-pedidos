'use client';

import { createClient } from '@/utils/supabase/client'; // Usar cliente de cliente
import { useRouter, useSearchParams } from 'next/navigation'; // Hooks de cliente
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { CreateSaleForm } from '@/components/sales/CreateSaleForm';
import { useEffect, useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getPendingOrders } from '../actions'; // Importar acción para obtener pedidos pendientes

// Tipos locales
interface OrderOption {
    id: string;
    order_number: string;
    products: { name: string } | null
}

interface OrderDetails {
    id: string;
    order_number: string;
    status: string;
    clients: {
        name: string;
    } | null;
    products: {
        name: string;
        unit_table_name: string;
    } | null;
    availableHeights: number[];
}

export default function NewSalePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderIdFromUrl = searchParams?.get('orderId');

    // Estados
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(orderIdFromUrl);
    const [pendingOrders, setPendingOrders] = useState<OrderOption[]>([]);
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Cargar Pedidos Pendientes (si no viene ID en URL)
    useEffect(() => {
        if (!orderIdFromUrl) {
            setLoading(true);
            getPendingOrders() // Llama a la Server Action desde el cliente
                .then(orders => {
                    setPendingOrders(orders as OrderOption[]);
                    setLoading(false);
                })
                .catch(err => {
                    setError("Error al cargar pedidos pendientes.");
                    setLoading(false);
                });
        }
    }, [orderIdFromUrl]);

    // 2. Cargar Detalles del Pedido SELECCIONADO (o el de la URL)
    useEffect(() => {
        async function fetchDetails() {
            if (!selectedOrderId) {
                setOrderDetails(null); // Limpiar si no hay ID
                setLoading(false); // Asegurar que no se quede cargando si se deselecciona
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const supabase = createClient(); // Cliente de cliente

                // Copiamos la lógica de fetchOrderAndHeights aquí, adaptada para cliente
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .select(`id, order_number, status, clients(name), products(name, unit_table_name)`)
                    .eq('id', selectedOrderId)
                    .single();

                if (orderError || !orderData) throw new Error('Pedido no encontrado.');
                if (orderData.status === 'Completado') throw new Error('Este pedido ya está completado.');
                if (!orderData.products?.unit_table_name) throw new Error('Producto no configurado.');

                const unitTableName = orderData.products.unit_table_name as string;
                let availableHeights: number[] = [];
                const allowedTables = ['tabla_gavioflex_units', 'tabla_gavioterranet_units'];

                if (allowedTables.includes(unitTableName)) {
                    const { data: heightsData, error: heightsError } = await supabase
                        .from(unitTableName as 'tabla_gavioflex_units' | 'tabla_gavioterranet_units')
                        .select('altura')
                        .order('altura', { ascending: true });
                    if (!heightsError && heightsData) availableHeights = heightsData.map(h => h.altura);
                }

                setOrderDetails({ ...orderData, availableHeights } as OrderDetails);

            } catch (err: any) {
                setError(err.message || 'Error al cargar detalles del pedido.');
                setOrderDetails(null); // Limpiar detalles en error
            } finally {
                setLoading(false);
            }
        }

        fetchDetails();
    }, [selectedOrderId]); // Depende del ID seleccionado

    // Memoizar si el formulario debe mostrarse
    const shouldShowForm = useMemo(() => selectedOrderId && orderDetails && !loading && !error, [selectedOrderId, orderDetails, loading, error]);

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Registrar Venta (Tramo)</h2>
                <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Pedidos
                    </Link>
                </Button>
            </div>

            {/* Selector de Pedido (si no viene ID en URL) */}
            {!orderIdFromUrl && (
                <Card className="mb-6 border-dashed border-primary/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Paso 1: Seleccionar Pedido Pendiente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Label htmlFor="orderSelect">Pedido a Finalizar</Label>
                        <Select
                            value={selectedOrderId || ''}
                            onValueChange={(value) => setSelectedOrderId(value || null)} // Actualizar el ID seleccionado
                            disabled={loading}
                        >
                            <SelectTrigger id="orderSelect">
                                <SelectValue placeholder={loading ? "Cargando pedidos..." : "Seleccione un pedido..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {pendingOrders.length > 0 ? (
                                    pendingOrders.map(order => (
                                        <SelectItem key={order.id} value={order.id}>
                                            #{order.order_number} ({order.products?.name || 'Producto desc.'})
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                        {loading ? 'Cargando...' : 'No hay pedidos pendientes.'}
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                        {/* Mostrar error si la carga de pedidos falló */}
                        {!loading && pendingOrders.length === 0 && !orderIdFromUrl && (
                            <p className="text-xs text-red-600 mt-1">{error || 'No se encontraron pedidos pendientes.'}</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Mostrar Carga o Errores de Detalles */}
            {selectedOrderId && loading && (
                <div className="flex justify-center items-center py-10"> <Loader2 className="h-8 w-8 animate-spin text-primary" /> </div>
            )}
            {selectedOrderId && error && !loading && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>
            )}

            {/* Formulario de Venta (si hay un pedido válido seleccionado) */}
            {shouldShowForm && orderDetails && (
                <Card className="w-full max-w-3xl mx-auto border-border shadow-md">
                    <CardHeader className="bg-muted/30">
                        <CardTitle className="text-lg">Pedido #{orderDetails.order_number}</CardTitle>
                        <CardDescription>
                            Cliente: <span className="font-medium text-foreground">{orderDetails.clients?.name ?? 'N/A'}</span> |
                            Producto: <span className="font-medium text-foreground">{orderDetails.products?.name ?? 'N/A'}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <CreateSaleForm
                            orderId={selectedOrderId!} // Sabemos que no es nulo aquí
                            productUnitTable={orderDetails.products?.unit_table_name || ''}
                            availableHeights={orderDetails.availableHeights || []}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}