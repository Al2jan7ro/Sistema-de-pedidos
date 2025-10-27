'use client';

import { useActionState, useState } from 'react';
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
import { Trash2, Loader2 } from 'lucide-react';
import { cancelSale } from '@/app/dashboard/sales/actions'; // Importar acción de cancelar
import { ActionResponse } from '@/lib/schemas/orders';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface CancelSaleButtonProps {
    saleId: string;
    saleCode: string;
}

const initialState: ActionResponse = { success: false, message: '' };

export function CancelSaleButton({ saleId, saleCode }: CancelSaleButtonProps) {
    // Usamos useActionState para manejar la acción de borrado
    const [state, formAction, isPending] = useActionState(cancelSale, initialState);
    const [isOpen, setIsOpen] = useState(false);

    // Efecto para mostrar toast y cerrar diálogo al finalizar
    useEffect(() => {
        if (!state.message) return; // Solo actuar si hay mensaje

        if (state.success) {
            toast.success(state.message);
            setIsOpen(false); // Cerrar diálogo en éxito
        } else {
            toast.error(state.message || "Error al cancelar la venta.");
            // No cerramos el diálogo en error para que el usuario vea
        }
        // Reset state message to prevent re-triggering toast on re-render
        // (Requires careful handling in useActionState if available,
        // or manage message display differently)

    }, [state]);


    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100" title="Cancelar Venta">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar Cancelación?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción marcará la venta <span className="font-semibold">{saleCode}</span> como cancelada.
                        No se eliminará permanentemente pero no se incluirá en los totales futuros. ¿Desea continuar?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {/* Mostrar error de la acción si existe */}
                {state.message && !state.success && (
                    <p className="text-sm text-red-600">{state.message}</p>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Volver</AlertDialogCancel>
                    {/* Usar un form para llamar a la Server Action */}
                    <form action={formAction}>
                        <input type="hidden" name="saleId" value={saleId} />
                        <AlertDialogAction type="submit" disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                            {isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelando...</>
                            ) : (
                                'Sí, Cancelar Venta'
                            )}
                        </AlertDialogAction>
                    </form>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}