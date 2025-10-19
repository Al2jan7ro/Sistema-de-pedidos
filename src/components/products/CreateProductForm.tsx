'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { useEffect } from 'react';
import { addProduct, ActionResponse } from '@/app/dashboard/products/actions';
import { Loader2, Save, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Link from 'next/link';

// Estado inicial
const initialState: ActionResponse = {
    success: false,
    message: '',
    fieldErrors: undefined,
};

// Componente para manejar el estado del botón de envío
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
                    <Save className="mr-2 h-4 w-4" /> Crear Producto
                </>
            )}
        </Button>
    );
}

export function CreateProductForm() {
    // 1. Integración de useActionState con la Server Action
    const [state, formAction] = useActionState(addProduct, initialState);

    // Mapeo de errores
    const errors = state.fieldErrors || {};

    // 2. Manejar los toasts (notificaciones) y redirección
    useEffect(() => {
        console.log('Estado actual:', state); // Debug
        if (state?.message) {
            if (state.success) {
                toast.success(state.message || 'Producto creado con éxito.');
                // Redirigir a la lista de productos después de 1.5 segundos
                const timer = setTimeout(() => {
                    window.location.href = '/dashboard/products';
                }, 1500);
                return () => clearTimeout(timer);
            } else {
                toast.error(state.message || 'Error al crear el producto.');
            }
        }
    }, [state]);

    return (
        <div className="flex items-center justify-center">
            <form action={formAction} className="w-full max-w-[100vw]">
                <Card className="border-border shadow-lg min-h-[40vw] px-6">
                    <CardHeader className="space-y-2 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-bold tracking-tight">
                                    Nuevo Producto
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground">
                                    Gavioty Solutions - Registre un nuevo tipo de producto
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="border-border hover:bg-muted"
                            >
                                <Link href="/dashboard/products">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Volver
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        {/* Mensaje de error general de la Server Action */}
                        {state.message && state.success === false && (
                            <div className="flex items-center p-2 mb-3 text-xs text-red-700 bg-red-100 rounded-lg" role="alert">
                                <XCircle className="w-4 h-4 mr-2" />
                                <span className="font-medium">Error: </span> {state.message}
                            </div>
                        )}

                        {/* Fila 1: Nombre */}
                        <div className="grid grid-cols-1 gap-4 mb-4">
                            {/* Campo Nombre */}
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs font-medium">Nombre del Producto *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Ej: Gaviobox, GavioWallnet, etc."
                                    className="h-9 text-sm border-border focus:border-gray-500 transition-colors"
                                    required
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name[0]}</p>}
                            </div>
                        </div>

                        {/* Fila 2: Descripción */}
                        <div className="space-y-1.5 mb-4">
                            <Label htmlFor="description" className="text-xs font-medium">Descripción</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Descripción detallada del tipo de producto (Opcional)"
                                className="border-border text-sm focus:border-gray-500 transition-colors min-h-[100px] resize-none"
                            />
                            {errors.description && <p className="text-xs text-red-500">{errors.description[0]}</p>}
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex gap-3 pt-2">
                            <SubmitButton />
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-9 text-sm font-medium border-border hover:bg-muted transition-all duration-200 bg-transparent"
                                asChild
                            >
                                <Link href="/dashboard/products">
                                    Cancelar
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}