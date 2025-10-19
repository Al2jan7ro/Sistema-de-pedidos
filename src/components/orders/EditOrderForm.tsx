'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updateOrder } from '@/app/dashboard/orders/actions';
import {
    OrderExtended,
    ActionResponse,
    DropdownOption,
    OrderStatusEnum
} from '@/lib/schemas/orders';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Undo2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Estado inicial para la Server Action
const initialState: ActionResponse = { success: false, message: '' };

interface EditOrderFormProps {
    order: OrderExtended;
    clients: DropdownOption[];
    products: DropdownOption[];
}


function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            className="flex-1 h-9 text-sm font-medium transition-all duration-200"
            disabled={pending}
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
            ) : (
                <>
                    <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                </>
            )}
        </Button>
    );
}

export function EditOrderForm({ order, clients, products }: EditOrderFormProps) {
    const [state, formAction] = useFormState(updateOrder, initialState);
    const [isPending, setIsPending] = useState(false);

    // Almacena errores de campo para el resaltado
    const fieldErrors = useMemo(() => state.fieldErrors || {}, [state.fieldErrors]);

    // Mostrar notificaciones de éxito o error
    useEffect(() => {
        if (!state.message) return;

        if (state.success) {
            toast.success(state.message);
            const timer = setTimeout(() => {
                window.location.href = '/dashboard/orders';
            }, 1000);
        } else {
            toast.error(state.message);
        }
    }, [state]);

    // Prepara el nombre completo del solicitante para la UI
    const solicitantName = `${order.solicitant.first_name || ''} ${order.solicitant.last_name || ''}`.trim();

    return (
        <form
            action={async (formData) => {
                setIsPending(true);
                await formAction(formData);
                setIsPending(false);
            }}
            className="space-y-6"
        >
            <Card className="shadow-lg border-border">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        Editar Pedido #{order.order_number}
                    </CardTitle>
                    <CardDescription>
                        Administra la información principal y el estado del pedido.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* ID Oculto para la acción de actualización */}
                    <input type="hidden" name="id" defaultValue={order.id} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Solicitante (Solo lectura) */}
                        <div className="space-y-2">
                            <Label htmlFor="solicitant">Creado por</Label>
                            <Input
                                id="solicitant"
                                value={solicitantName || 'N/A'}
                                disabled
                                className="bg-muted/30 text-muted-foreground"
                            />
                        </div>

                        {/* Número de Pedido (Editable por el Admin) */}
                        <div className="space-y-2">
                            <Label htmlFor="order_number_input">Número de Pedido</Label>
                            {/* Usa order_number_input, como definiste en tu UpdateOrderSchema */}
                            <Input
                                id="order_number_input"
                                name="order_number_input"
                                defaultValue={order.order_number}
                                className={fieldErrors.order_number_input ? 'border-red-500' : ''}
                            />
                            {fieldErrors.order_number_input && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <XCircle className="h-4 w-4" />
                                    {fieldErrors.order_number_input}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Cliente */}
                        <div className="space-y-2">
                            <Label htmlFor="client_id">Cliente</Label>
                            {/* Usamos el componente Select con el defaultValue del ID del cliente */}
                            <Select
                                name="client_id"
                                defaultValue={order.clients.id}
                            >
                                <SelectTrigger className={`w-full ${fieldErrors.client_id ? 'border-red-500' : ''}`}>
                                    <SelectValue placeholder="Selecciona un cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fieldErrors.client_id && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <XCircle className="h-4 w-4" />
                                    {fieldErrors.client_id}
                                </p>
                            )}
                        </div>

                        {/* Tipo de Producto */}
                        <div className="space-y-2">
                            <Label htmlFor="product_id">Tipo de Producto</Label>
                            <Select
                                name="product_id"
                                defaultValue={order.products.id}
                            >
                                <SelectTrigger className={`w-full ${fieldErrors.product_id ? 'border-red-500' : ''}`}>
                                    <SelectValue placeholder="Selecciona un producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fieldErrors.product_id && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <XCircle className="h-4 w-4" />
                                    {fieldErrors.product_id}
                                </p>
                            )}
                        </div>

                        {/* Estado del Pedido */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado del Pedido</Label>
                            <Select
                                name="status"
                                defaultValue={order.status}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Cambiar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {OrderStatusEnum.options.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Ubicación */}
                    <div className="space-y-2">
                        <Label htmlFor="location">Ubicación de la Obra</Label>
                        <Input
                            id="location"
                            name="location"
                            defaultValue={order.location || ''}
                            placeholder="Ej: Calle Principal, Sector Industrial"
                            className={fieldErrors.location ? 'border-red-500' : ''}
                        />
                        {fieldErrors.location && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <XCircle className="h-4 w-4" />
                                {fieldErrors.location}
                            </p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción del Pedido (Opcional)</Label>
                        <Textarea
                            id="description"
                            name="description"
                            defaultValue={order.description || ''}
                            rows={4}
                            placeholder="Detalles específicos del pedido o notas importantes."
                            className={fieldErrors.description ? 'border-red-500' : ''}
                        />
                        {fieldErrors.description && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <XCircle className="h-4 w-4" />
                                {fieldErrors.description}
                            </p>
                        )}
                    </div>


                    <div className="flex gap-3 pt-2">
                        <SubmitButton />
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-9 text-sm font-medium border-border hover:bg-muted transition-all duration-200 bg-transparent"
                            onClick={() => window.history.back()}
                        >
                            Cancelar
                        </Button>
                    </div>
                </CardContent>

            </Card>
        </form>
    );
}