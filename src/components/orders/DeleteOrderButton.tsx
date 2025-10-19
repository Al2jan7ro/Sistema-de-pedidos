'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Trash2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteOrder } from '@/app/dashboard/orders/actions'; // Asegúrate de que esta ruta sea correcta
import { ActionResponse } from '@/lib/schemas/orders';
import { toast } from 'sonner';

interface DeleteOrderButtonProps {
    orderId: string;
    orderNumber: string;
}

// Estado inicial para useActionState
const initialState: ActionResponse = { success: false, message: '' };

/**
 * Componente helper para manejar el estado de carga del botón de confirmación.
 */
function DeleteButtonContent() {
    // useFormStatus obtiene el estado de pending del formulario más cercano.
    const { pending } = useFormStatus();

    if (pending) {
        return (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...
            </>
        );
    }
    return 'Confirmar Eliminación';
}

export function DeleteOrderButton({ orderId, orderNumber }: DeleteOrderButtonProps) {
    // 1. Inicializar useActionState con la Server Action y el estado inicial.
    const [state, formAction] = useActionState(deleteOrder, initialState);

    // 2. Manejar notificaciones con toast al completar la acción.
    useEffect(() => {
        // Solo mostrar si hay un mensaje (es decir, la acción ya se ejecutó)
        if (state.message) {
            if (state.success) {
                toast.success(state.message);
                // La revalidación (revalidatePath) en la Server Action
                // se encarga de que el elemento desaparezca de la tabla.
            } else {
                toast.error(state.message);
            }
        }
    }, [state]);

    return (
        <AlertDialog>
            {/* Botón que abre el diálogo (Trigger) */}
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    // Estilos consistentes con el patrón: texto rojo, hover con fondo rojo claro
                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
                    title={`Eliminar Pedido #${orderNumber}`}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>

            {/* Contenido del Diálogo de Confirmación */}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl">
                        ¿Estás absolutamente seguro?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción eliminará permanentemente el pedido **#{orderNumber}**. Esta acción no se puede deshacer y puede romper referencias en Ventas.

                        {/* Mensaje de error si la acción falló previamente */}
                        {state.message && state.success === false && (
                            <div className="flex items-center p-2 mt-3 text-xs text-red-700 bg-red-100 rounded-lg" role="alert">
                                <XCircle className="w-4 h-4 mr-2" />
                                <span className="font-medium">Error: </span> {state.message}
                            </div>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Formulario que activa la Server Action */}
                {/* NOTA: El formAction recibe el estado anterior y FormData, según la firma de useActionState. */}
                <form action={formAction}>
                    <input type="hidden" name="id" value={orderId} />
                    <AlertDialogFooter className="pt-4">
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        {/* El AlertDialogAction actúa como un botón de submit con el estilo destructivo */}
                        <AlertDialogAction asChild>
                            <Button
                                type="submit"
                                variant="destructive"
                                // Deshabilitamos si la acción anterior fue exitosa para evitar reintentos accidentales
                                disabled={state.success}
                            >
                                <DeleteButtonContent />
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}