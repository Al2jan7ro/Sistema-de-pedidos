'use client';

import { useActionState, useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Client } from '@/lib/schemas/client';
import { Product } from '@/lib/schemas/product';
import { addOrder, uploadOrderAttachments } from '@/app/dashboard/orders/actions';
import { ActionResponse } from '@/lib/schemas/orders';
// Componentes UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUp, Loader2 } from 'lucide-react';

interface CreateOrderFormProps {
    clients: Client[];
    products: Product[];
}

const initialState: ActionResponse = {
    success: false,
    message: '',
};

// --- Límite máximo de archivos ---
const MAX_FILES = 3;

export function CreateOrderForm({ clients, products }: CreateOrderFormProps) {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(addOrder, initialState);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Referencias para el formulario y el input de archivos
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Lógica secuencial para la subida de archivos
    const handleUpload = useCallback(async (orderId: string) => {
        setIsUploading(true);
        // Llamada a la Server Action para subir archivos
        const fileUploadResponse = await uploadOrderAttachments(orderId, selectedFiles);

        if (fileUploadResponse.success) {
            toast.success(fileUploadResponse.message);
        } else {
            // Error de subida: ya sea por RLS, ruta incorrecta, o error de Supabase
            toast.error(`Error de adjuntos: ${fileUploadResponse.message}`);
        }

        setIsUploading(false);
        // Limpiamos la selección y redirigimos
        setSelectedFiles([]);
        formRef.current?.reset();
        setTimeout(() => router.push('/dashboard/orders'), 1500);
    }, [selectedFiles, router]);

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
        } else if (!state.success) {
            // Mostrar errores de validación o DB
            toast.error(state.message);
        }
    }, [state, router, selectedFiles, handleUpload]);

    // 🔴 FUNCIÓN CORREGIDA: Manejar la acumulación y el límite de archivos.
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const incomingFiles = Array.from(e.target.files);

        // Calcular el total si se añaden los nuevos archivos a los existentes
        const totalFiles = selectedFiles.length + incomingFiles.length;

        if (totalFiles > MAX_FILES) {
            // Si el total excede el límite
            toast.error(`Solo puedes adjuntar un total de ${MAX_FILES} archivos. Ya tienes ${selectedFiles.length}.`);

            // 💡 NOTA IMPORTANTE: Necesitas limpiar el input para que el usuario pueda intentar de nuevo.
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        // 🟢 Acumular los archivos: Añadir los nuevos al array de archivos existentes.
        setSelectedFiles(prevFiles => [...prevFiles, ...incomingFiles]);

        // 💡 Opcional: Limpiar el input para que el mismo archivo pueda ser re-seleccionado
        // si el usuario lo elimina del array, aunque en este caso, lo mejor es mantener
        // el input limpio para evitar selecciones accidentales.
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Función para remover un archivo
    const removeFile = (fileName: string) => {
        setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
        // No es necesario limpiar el input aquí, ya que la selección se maneja en el state.
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* ... (Campos Cliente, Producto, Ubicación, Fecha) ... */}
                        {/* Cliente */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium leading-none">Cliente <span className="text-red-500">*</span></label>
                            <Select name="client_id" required disabled={isLoading}>
                                <SelectTrigger className="w-full border-border focus:ring-foreground transition-colors">
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
                            Archivos Adjuntos (Imágenes, PDF, CAD)
                        </label>
                        <p className="text-xs text-muted-foreground">
                            Puedes subir hasta {MAX_FILES} archivos.
                        </p>
                        <Input
                            id="attachments"
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*,application/pdf,.dxf,.dwg"
                            disabled={isLoading || selectedFiles.length >= MAX_FILES} // Deshabilitar si ya se alcanzó el límite
                            className="h-11 border-border focus:border-foreground transition-colors"
                        />

                        {/* 🟢 Lista de Archivos Seleccionados */}
                        {selectedFiles.length > 0 && (
                            <div className=" space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {selectedFiles.length} de {MAX_FILES} archivos adjuntos listos para subir:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground pl-4">
                                    {selectedFiles.map((file, index) => (
                                        <li key={file.name + index} className="flex justify-between items-center py-0.5">
                                            <span>{file.name}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-red-500 hover:bg-red-500/10"
                                                onClick={() => removeFile(file.name)}
                                                title="Eliminar archivo"
                                            >
                                                Remover
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {/* Muestra un mensaje si el límite está lleno */}
                        {selectedFiles.length >= MAX_FILES && (
                            <p className="text-xs text-red-500 mt-1">
                                Has alcanzado el límite de {MAX_FILES} archivos.
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