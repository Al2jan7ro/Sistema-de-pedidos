'use client';

// 💥 CORRECCIÓN AQUÍ: useActionState se importa desde 'react', no desde 'react-dom'
import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom'; // useFormStatus SÍ se importa desde 'react-dom'

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
// Asegúrate de que esta ruta sea correcta:
import { softDeleteClient, type ActionResponse } from '@/app/dashboard/clients/actions';
import { toast } from 'sonner';

interface ClientDeleteButtonProps {
    clientId: string;
    clientName: string;
}

// Estado inicial y componente de botón interno con estado de carga
const initialState: ActionResponse = { success: false, message: '' };

function DeleteButtonContent() {
    const { pending } = useFormStatus();

    if (pending) {
        return (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Desactivando...
            </>
        );
    }
    return 'Confirmar Desactivación';
}

export function ClientDeleteButton({ clientId, clientName }: ClientDeleteButtonProps) {
    const [state, formAction] = useActionState(softDeleteClient, initialState);

    // 💥 NOTA: Para manejar el estado y usar toast, lo ideal es usar useEffect.
    // Aunque funciona fuera, useEffect garantiza que se ejecuta solo después 
    // de que el render se ha completado.
    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast.success(state.message);
            } else {
                toast.error(state.message);
            }
            // Limpia el mensaje en el estado para evitar que el toast 
            // se muestre en cada re-render si no hay una acción nueva.
            // Esto requiere un setter, pero como estamos usando useActionState,
            // usaremos el patrón de comprobación o simplemente confiaremos
            // en que la acción de Supabase ya revalida y redirige.
        }
        // Añadimos state como dependencia
    }, [state]);

    return (
        <AlertDialog>
            {/* Botón que abre el diálogo (la papelera en la tabla) */}
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
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
                        Esta acción desactivará permanentemente el cliente {clientName}. Ya no aparecerá en las listas activas.
                        Podrás reactivarlo manualmente si es necesario.

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
                    <input type="hidden" name="id" value={clientId} />
                    <AlertDialogFooter className="pt-4">
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        {/* El AlertDialogAction actúa como un botón de submit */}
                        <AlertDialogAction asChild>
                            <Button type="submit" variant="destructive" disabled={state.success}>
                                <DeleteButtonContent />
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
