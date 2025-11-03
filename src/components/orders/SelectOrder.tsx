// src/components/orders/SelectOrder.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OrderBasic } from '@/lib/schemas/orders';
import { getPendingOrders } from '@/app/dashboard/sales/actions';

interface SelectOrderProps {
    value?: string;
    onValueChange: (orderId: string) => void;
    className?: string;
    disabled?: boolean;
}

export function SelectOrder({
    value,
    onValueChange,
    className,
    disabled = false,
}: SelectOrderProps) {
    const [orders, setOrders] = useState<OrderBasic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // No es necesario setIsLoading(true) aquí, ya que se establece al inicio.
                const pendingOrders = await getPendingOrders();
                // La acción ya devuelve un array vacío en caso de error, por lo que esta asignación es segura.
                setOrders(pendingOrders);
            } catch (error) {
                console.error('Error al cargar las órdenes:', error);
                setOrders([]); // Asegurarse de que orders sea un array vacío en caso de un error inesperado.
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(
        (order) =>
            order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.products?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={className}>
            <Label htmlFor="order-select">Seleccionar Orden</Label>
            <Select
                value={value}
                onValueChange={onValueChange}
                disabled={disabled || isLoading}
            >
                <SelectTrigger id="order-select" className="mt-1">
                    <SelectValue placeholder={isLoading ? 'Cargando órdenes...' : 'Selecciona una orden'} />
                </SelectTrigger>
                <SelectContent>
                    <div className="p-2">
                        <Input
                            placeholder="Buscar orden..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mb-2"
                        />
                    </div>
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                                <div className="flex flex-col">
                                    <span className="font-medium">{order.order_number}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {order.clients?.name || 'Sin cliente'} • {order.products?.name || 'Sin producto'}
                                    </span>
                                </div>
                            </SelectItem>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                            {searchTerm ? 'No se encontraron órdenes' : 'No hay órdenes pendientes disponibles'}
                        </div>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
}