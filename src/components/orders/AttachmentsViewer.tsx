'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { FileDown, Link, FileText, Download, Loader2, Image, FileSearch } from 'lucide-react';
import { Attachment } from '@/lib/schemas/orders';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

interface AttachmentsViewerProps {
    attachments: Attachment[];
    orderNumber: string;
}

// Inicializar Supabase Client para el cliente
const supabase = createClient();
const BUCKET_NAME = 'order-files'; // Asegúrate que coincida con tu Server Action

// --- Componente de Fila de Adjunto ---
const AttachmentRow = ({ attachment }: { attachment: Attachment }) => {
    const [, setSignedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Mapeo de íconos por tipo
    const getIcon = (type: string) => {
        switch (type) {
            case 'PDF': return <FileText className="h-4 w-4 text-red-500 mr-2" />;
            case 'CAD': return <FileSearch className="h-4 w-4 text-blue-500 mr-2" />;
            case 'Imagen': return <Image className="h-4 w-4 text-green-500 mr-2" aria-label="Imagen" />;
            default: return <FileDown className="h-4 w-4 text-gray-500 mr-2" />;
        }
    };

    // Función que genera la URL firmada (debe ser llamada al hacer clic para ahorrar peticiones)
    const generateAndOpenUrl = async () => {
        if (!attachment.storage_path) return;

        setIsLoading(true);
        try {
            // URL válida por 600 segundos (10 minutos)
            const { data } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(attachment.storage_path, 600);

            if (data?.signedUrl) {
                setSignedUrl(data.signedUrl);
                window.open(data.signedUrl, '_blank'); // Abrir en nueva pestaña
            } else {
                toast.error("Error: Permiso denegado o archivo no encontrado.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al generar el enlace de descarga.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TableRow key={attachment.id}>
            <TableCell className="font-medium flex items-center p-3">
                {getIcon(attachment.type)}
                {attachment.storage_path.split('/').pop()} {/* Muestra solo el nombre del archivo */}
            </TableCell>
            <TableCell className='text-sm p-3 w-[100px]'>{attachment.type}</TableCell>
            <TableCell className="text-right p-3 w-[100px]">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={generateAndOpenUrl}
                    disabled={isLoading}
                    title="Descargar Archivo"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                </Button>
            </TableCell>
        </TableRow>
    );
};

// --- Componente Principal ---
export function AttachmentsViewer({ attachments, orderNumber }: AttachmentsViewerProps) {
    if (!attachments || attachments.length === 0) {
        return (
            <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground border-muted-foreground/50 cursor-not-allowed"
                disabled
                title="No hay archivos adjuntos"
            >
                <FileDown className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <Dialog>
            <HoverCard>
                <HoverCardTrigger asChild>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-muted"
                        >
                            <Link className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                </HoverCardTrigger>
                <HoverCardContent className="w-auto px-3 py-1.5">
                    <p className="text-sm">
                        {`Ver ${attachments.length} archivo${attachments.length === 1 ? '' : 's'} adjunto${attachments.length === 1 ? '' : 's'}`}
                    </p>
                </HoverCardContent>
            </HoverCard>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Adjuntos del Pedido {orderNumber}</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    <Table>
                        <TableBody>
                            {attachments.map((att) => (
                                <AttachmentRow key={att.id} attachment={att} />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}