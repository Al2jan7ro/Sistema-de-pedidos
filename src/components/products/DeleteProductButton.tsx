'use client';

// Importamos useActionState desde 'react' y useFormStatus desde 'react-dom'
import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';

import { Trash2, Loader2, XCircle } from 'lucide-react';
// Asegúrate de que las rutas de Shadcn UI sean correctas en tu proyecto
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
// Importamos la acción correcta para eliminar productos
import { deleteProduct, type ActionResponse } from '@/app/dashboard/products/actions';
import { toast } from 'sonner';

interface ProductDeleteButtonProps {
    productId: string;
    productName: string;
}

// Estado inicial para useActionState
const initialState: ActionResponse = { success: false, message: '' };

// Componente helper para manejar el estado de carga del botón de confirmación
function DeleteButtonContent() {
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

export function DeleteProductButton({ productId, productName }: ProductDeleteButtonProps) {
    // Usamos useActionState con la acción específica del producto
    const [state, formAction] = useActionState(deleteProduct, initialState);

    // 💥 CORRECCIÓN: Manejar notificaciones con toast al completar la acción
    useEffect(() => {
        if (state.message) {
            if (state.success) {
                // Muestra el toast de éxito
                toast.success(state.message);
                // NOTA: No necesita redirección, ya que revalidatePath en la Server Action
                // hará que el elemento se elimine visualmente de la tabla.
            } else {
                toast.error(state.message);
            }
        }
    }, [state]);

    return (
        <AlertDialog>
            {/* Botón que abre el diálogo (Ícono de papelera con estilo 'ghost' destructivo) */}
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    // Clases idénticas al botón de cliente
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    title={`Eliminar ${productName}`}
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
                        Esta acción eliminará permanentemente el producto <span className="font-semibold">{productName}</span>. Esta acción no se puede deshacer.

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
                <form action={formAction}>
                    <input type="hidden" name="id" value={productId} />
                    <AlertDialogFooter className="pt-4">
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        {/* El AlertDialogAction actúa como un botón de submit con el estilo destructivo */}
                        <AlertDialogAction asChild>
                            <Button
                                type="submit"
                                variant="destructive"
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