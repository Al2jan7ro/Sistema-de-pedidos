'use server';

import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOrderTotals } from "@/app/dashboard/sales/actions";
import { ReceiptLoader } from '@/components/receipts/ReceiptLoader';

// Función para obtener detalles básicos del pedido
async function fetchOrderBaseDetails(orderId: string) {
    const supabase = await createClient();
    // ... (Opcional: Verificar rol si es necesario) ...

    const { data, error } = await supabase
        .from('orders')
        .select(`
            id, order_number, created_at,
            clients (name, email, phone, address),
            products (name),
            profiles (first_name, last_name)
        `)
        .eq('id', orderId)
        .single();

    if (error || !data) return null;

    return data;
}

export default async function OrderReceiptPage({ params: { id: orderId } }: { params: { id: string } }) {
    // 1. Obtener detalles base del pedido
    const orderDetails = await fetchOrderBaseDetails(orderId);

    if (!orderDetails) {
        notFound();
    }

    // 2. Obtener los totales SUMADOS de materiales y longitud
    const orderTotals = await getOrderTotals(orderId);

    // Combinar datos para el componente de vista
    // Modificar la creación de receiptData para asegurar que cumpla con la interfaz
    const receiptData = {
        orderNumber: orderDetails.order_number,
        orderDate: orderDetails.created_at || new Date().toISOString(), // Asegurar que siempre haya una fecha
        client: {
            name: orderDetails.clients?.name || 'Cliente no especificado',
            email: orderDetails.clients?.email || null,
            phone: orderDetails.clients?.phone || null,
            address: orderDetails.clients?.address || null
        },
        product: orderDetails.products?.name || 'Producto no especificado',
        solicitant: `${orderDetails.profiles?.first_name || ''} ${orderDetails.profiles?.last_name || ''}`.trim() || 'Solicitante no especificado',
        totalLength: orderTotals.totalLength,
        materials: orderTotals.materials || []
    };

    if (!receiptData.orderDate) {
        throw new Error('La fecha del pedido es requerida');
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/sales`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a ventas
                    </Link>
                </Button>
            </div>


            <ReceiptLoader data={receiptData} />
        </div>
    );
}