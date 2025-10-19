'use client';

// Importado como useActionState
import { useActionState, useEffect } from 'react'; // 💥 Importamos useEffect
import { useFormStatus } from 'react-dom';
import { Loader2, Save, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ClientStatusEnum } from '@/lib/schemas/client';
import { addClient, type ActionResponse } from '@/app/dashboard/clients/actions';
import { toast } from 'sonner'; // 💥 Importamos toast de sonner

// Estado inicial del formulario (vacío y sin errores)
const initialState: ActionResponse = {
    success: false,
    message: '',
};

interface ClientFormProps {
    formType: 'create' | 'edit';
    // Si formType fuera 'edit', se pasaría un cliente inicial
    // initialClientData?: Client; 
}

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
                    <Save className="mr-2 h-4 w-4" /> Crear Cliente
                </>
            )}
        </Button>
    );
}

export function ClientForm({ formType }: ClientFormProps) {
    // 1. Integración de useActionState con la Server Action
    const [state, formAction] = useActionState(addClient, initialState);

    // Mapeo de errores simplificado
    const errors = state.fieldErrors || {};

    // 💥 2. Manejar los toasts (notificaciones) y redirección
    useEffect(() => {
        // Solo para el formulario de creación
        if (formType === 'create' && state.message) {
            if (state.success) {
                toast.success(state.message);

                // Redirección del lado del cliente después de un pequeño retraso (para ver el toast)
                const timer = setTimeout(() => {
                    window.location.href = '/dashboard/clients';
                }, 1500); // 1.5 segundos

                return () => clearTimeout(timer);
            } else {
                // Muestra el error general, incluyendo errores de duplicidad de BD
                toast.error(state.message);
            }
        }
    }, [state, formType]); // Dependencia de state y formType

    return (
        // El prop 'action' llama a la Server Action directamente
        <div className="flex items-center justify-center">
            <form action={formAction} className="w-full max-w-[100vw] ">
                <Card className="border-border shadow-lg min-h-[40vw] px-6">
                    <CardHeader className="space-y-2 pb-4">
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            {formType === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Gavioty Solutions - Ingrese los datos del cliente
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                        {/* Mensaje de error general de la Server Action (ej. duplicidad en BD) */}
                        {state.message && state.success === false && (
                            // Mantenemos el error visual aquí también para capturar errores de Zod al inicio
                            // y errores de BD que no tienen un campo asociado (como duplicidad).
                            <div className="flex items-center p-2 mb-3 text-xs text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                                <XCircle className="w-4 h-4 mr-2" />
                                <span className="font-medium">Error: </span> {state.message}
                            </div>
                        )}

                        {/* Fila 1: Nombre y Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Campo Nombre */}
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs font-medium">Nombre Completo *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Ingrese el nombre completo"
                                    className="h-9 text-sm border-border focus:border-gray-500 transition-colors"
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>

                            {/* Campo Email */}
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-medium">Correo Electrónico *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    className="h-9 text-sm border-border focus:border-gray-500 transition-colors"
                                />
                                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                            </div>
                        </div>

                        {/* Fila 2: Teléfono y Estado */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Campo Teléfono */}
                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-xs font-medium">Teléfono de Contacto</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+1 555 000 0000"
                                    className="h-9 text-sm border-border focus:border-gray-500 transition-colors"
                                />
                                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                            </div>

                            {/* Campo Estado */}
                            <div className="space-y-1.5">
                                <Label htmlFor="status" className="text-xs font-medium">Estado *</Label>
                                {/* Nota: Si no hay valor inicial, es mejor usar <Select defaultValue=""> para evitar advertencias de React si el valor es undefined, o establecer el default en la acción como hicimos. */}
                                <Select name="status" defaultValue={ClientStatusEnum.enum.Active}>
                                    <SelectTrigger className="h-9 text-sm border-border focus:border-gray-500 transition-colors">
                                        <SelectValue placeholder="Seleccione un estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ClientStatusEnum.enum.Active}>Activo</SelectItem>
                                        <SelectItem value={ClientStatusEnum.enum.Inactive}>Inactivo</SelectItem>
                                        <SelectItem value={ClientStatusEnum.enum.Pending}>Pendiente</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-xs text-red-500">{errors.status}</p>}
                            </div>
                        </div>

                        {/* Fila 3: Dirección */}
                        <div className="space-y-1.5 mb-4">
                            <Label htmlFor="address" className="text-xs font-medium">Dirección</Label>
                            <Textarea
                                id="address"
                                name="address"
                                placeholder="Ingrese la dirección completa"
                                className="border-border text-sm focus:border-gray-500 transition-colors min-h-[60px] resize-none"
                            />
                            {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                        </div>

                        {/* Botones de Acción */}
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
        </div>
    );
}
