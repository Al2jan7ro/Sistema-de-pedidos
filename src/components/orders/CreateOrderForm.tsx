'use client';

import { useActionState, useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Client } from '@/lib/schemas/client';
import { Product } from '@/lib/schemas/product';
import { addOrder, uploadOrderAttachments } from '@/app/dashboard/orders/actions';
import { ActionResponse } from '@/lib/schemas/orders';
// Componentes UI importados (asumiendo que son los de shadcn/ui con tus estilos)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUp, Loader2 } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CreateOrderFormProps {
    clients: Client[];
    products: Product[];
}

const initialState: ActionResponse = {
    success: false,
    message: '',
};

export function CreateOrderForm({ clients, products }: CreateOrderFormProps) {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(addOrder, initialState);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    // Manejo de Respuesta de la Server Action (addOrder)
    useEffect(() => {
        if (!state.message) return;

        if (state.success && state.data?.orderId) {
            // FASE 1: Pedido Base creado.
            toast.success(state.message);

            if (selectedFiles.length > 0) {
                // FASE 2: Subir archivos
                handleUpload(state.data.orderId);
            } else {
                // No hay archivos, redirigir
                setTimeout(() => router.push('/dashboard/orders'), 1500);
            }
            formRef.current?.reset();
        } else if (!state.success) {
            // Mostrar errores de validación o DB
            toast.error(state.message);
        }
    }, [state, router, selectedFiles]);

    // Lógica secuencial para la subida de archivos
    const handleUpload = async (orderId: string) => {
        setIsUploading(true);
        const fileUploadResponse = await uploadOrderAttachments(orderId, selectedFiles);

        if (fileUploadResponse.success) {
            toast.success(fileUploadResponse.message);
        } else {
            toast.error(`Error de adjuntos: ${fileUploadResponse.message}`);
        }

        setIsUploading(false);
        // Redirigir al final del proceso, independientemente del éxito de la subida de adjuntos
        setTimeout(() => router.push('/dashboard/orders'), 1500);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const isLoading = isPending || isUploading;

    return (
        <Card className="w-full border-border shadow-lg">
            <CardHeader className="space-y-2 ">
                <div className="flex items-center ">
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Nuevo Pedido
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Gavioty Solutions - Realice un nuevo pedido
                        </CardDescription>
                    </div>

                </div>
            </CardHeader>
            <CardContent className="">
                <form ref={formRef} action={formAction}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Cliente */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium leading-none">Cliente <span className="text-red-500">*</span></label>
                            <Select name="client_id" required disabled={isLoading}>
                                <SelectTrigger className="w-full  border-border focus:ring-foreground transition-colors">
                                    <SelectValue placeholder="Seleccione un cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {state.fieldErrors?.client_id && <p className="text-red-500 text-xs mt-1">{state.fieldErrors.client_id}</p>}
                        </div>

                        {/* Tipo de Producto */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium leading-none">Tipo de Producto <span className="text-red-500">*</span></label>
                            <Select name="product_id" required disabled={isLoading}>
                                <SelectTrigger className="w-full border-border focus:ring-foreground transition-colors">
                                    <SelectValue placeholder="Seleccione un producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(product => (
                                        <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {state.fieldErrors?.product_id && <p className="text-red-500 text-xs mt-1">{state.fieldErrors.product_id}</p>}
                        </div>

                        {/* Ubicación */}
                        <div className="space-y-1">
                            <label htmlFor="location" className="text-sm font-medium leading-none">Ubicación <span className="text-red-500">*</span></label>
                            <Input
                                id="location"
                                name="location"
                                placeholder="Ej: Av. Principal, Sector La Morita"
                                required
                                disabled={isLoading}
                                className=" border-border focus:border-foreground transition-colors"
                            />
                            {state.fieldErrors?.location && <p className="text-red-500 text-xs mt-1">{state.fieldErrors.location}</p>}
                        </div>

                        {/* Fecha (Automática) */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium leading-none">Fecha de Registro (Automática)</label>
                            <Input readOnly defaultValue={new Date().toLocaleDateString()} className=" text-muted-foreground bg-muted/50 border-border" />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="space-y-1 mt-5">
                        <label htmlFor="description" className="text-sm font-medium leading-none">Descripción (Opcional)</label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Detalles del pedido, referencias o especificaciones técnicas adicionales."
                            rows={3}
                            disabled={isLoading}
                            className="border-border focus:border-foreground transition-colors"
                        />
                        {state.fieldErrors?.description && <p className="text-red-500 text-xs mt-1">{state.fieldErrors.description}</p>}
                    </div>

                    {/* Archivos Adjuntos */}
                    <div className="space-y-1 mt-5">
                        <label htmlFor="attachments" className="text-sm font-medium leading-none flex items-center">
                            <FileUp className="h-4 w-4 mr-2" />
                            Archivos Adjuntos (**Imágenes, PDF, CAD**)
                        </label>
                        <Input
                            id="attachments"
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            accept="image/*,application/pdf,.dxf,.dwg,.acad"
                            disabled={isLoading}
                            className="h-11 border-border focus:border-foreground transition-colors"
                        />
                        {selectedFiles.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                **{selectedFiles.length} archivo(s)** seleccionado(s). Se subirán automáticamente después de crear el pedido.
                            </p>
                        )}
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex gap-4 mt-8">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isLoading}
                            className="flex-1 h-11"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 h-11 bg-foreground hover:bg-foreground/90 text-background transition-all duration-200 hover:shadow-md"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isUploading ? 'Subiendo archivos...' : 'Creando pedido...'}
                                </>
                            ) : (
                                'Crear Pedido'
                            )}
                        </Button>
                    </div>

                </form>
            </CardContent>
        </Card>
    );
}