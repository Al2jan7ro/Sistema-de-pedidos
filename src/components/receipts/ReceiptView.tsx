'use client';

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';

// Tipo para los datos recibidos del Server Component
interface ReceiptData {
    orderNumber: string;
    orderDate: string;
    client: { name: string | null; email?: string | null; phone?: string | null; address?: string | null } | null;
    product: string | null;
    solicitant: string;
    totalLength: number;
    materials: { item_key: string; item_unit: string; total_value: number; label?: string }[]; // Label viene de getOrderTotals
}

interface ReceiptViewProps {
    data: ReceiptData;
}

export function ReceiptView({ data }: ReceiptViewProps) {
    const componentRef = useRef<HTMLDivElement>(null);

    // Hook para la impresión
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Recibo_Pedido_${data.orderNumber}`,
    });

    // Mapeo local simple para etiquetas si no vienen de getOrderTotals
    const ITEM_KEY_TO_LABEL_LOCAL: Record<string, string> = {
        "seccion de muro": "Sección de Muro",
        "seccion_muro": "Sección de Muro",
        "seccion_contrafuerte": "Sección de Contrafuerte",
        "seccion_cuna": "Sección de Cuña",
        "seccion_zapata": "Sección de Zapata",
        "canasta de 2x1x1": "Canasta 2x1x1",
        "canasta de 1,5x1x1": "Canasta 1.5x1x1",
        "canasta de 2x1x0,5": "Canasta 2x1x0.5",
        "geotextil 1600": "Geotextil 1600",
        "geotextil planar": "Geotextil Planar",
        "toba cemento": "Toba Cemento",
        "tuberia": "Tubería",
        "malla_triple_torsion": "Malla Triple Torsión",
        "alambre_de_amarre": "Alambre de Amarre",
        // ... (Tu mapeo completo aquí) ...
    };


    return (
        <div>
            {/* Contenedor que se imprimirá */}
            <div ref={componentRef} className="print-container p-4 md:p-8 border rounded-lg bg-white text-black">
                {/* Encabezado del Recibo */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">GAVIOTY SOLUTIONS</h1>
                        <p className="text-sm text-gray-600">Recibo de Materiales - Pedido #{data.orderNumber}</p>
                        <p className="text-sm text-gray-500">Fecha de Generación: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                        <p className="text-sm text-gray-500">Fecha del Pedido: {format(new Date(data.orderDate), 'dd/MM/yyyy')}</p>
                    </div>
                    {/* Puedes añadir logo aquí */}
                    {/* <img src="/path/to/logo.png" alt="Logo" className="h-12"/> */}
                </div>

                {/* Datos del Cliente y Producto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="border p-3 rounded bg-gray-50">
                        <h3 className="font-semibold mb-1 text-gray-700">Cliente</h3>
                        <p><strong>Nombre:</strong> {data.client?.name ?? 'N/A'}</p>
                        <p><strong>Email:</strong> {data.client?.email ?? 'N/A'}</p>
                        <p><strong>Teléfono:</strong> {data.client?.phone ?? 'N/A'}</p>
                        <p><strong>Dirección:</strong> {data.client?.address ?? 'N/A'}</p>
                    </div>
                    <div className="border p-3 rounded bg-gray-50">
                        <h3 className="font-semibold mb-1 text-gray-700">Detalles del Pedido</h3>
                        <p><strong>Producto:</strong> {data.product ?? 'N/A'}</p>
                        <p><strong>Solicitante:</strong> {data.solicitant}</p>
                        <p><strong>Longitud Total (Suma de Tramos):</strong> {data.totalLength.toFixed(2)} ml</p>
                    </div>
                </div>

                {/* Tabla de Materiales Totales */}
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Resumen Total de Materiales</h3>
                {data.materials.length > 0 ? (
                    <Table className="text-sm border">
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-700">Material</TableHead>
                                <TableHead className="text-right font-semibold text-gray-700">Cantidad Total</TableHead>
                                <TableHead className="font-semibold text-gray-700">Unidad</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.materials
                                .sort((a, b) => (a.label || a.item_key).localeCompare(b.label || b.item_key)) // Ordenar alfabéticamente
                                .map(mat => (
                                    <TableRow key={mat.item_key}>
                                        <TableCell>{mat.label || ITEM_KEY_TO_LABEL_LOCAL[mat.item_key] || mat.item_key}</TableCell>
                                        <TableCell className="text-right font-medium">{mat.total_value.toFixed(3)}</TableCell>
                                        <TableCell>{mat.item_unit}</TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-gray-500 py-4 border rounded">No hay materiales registrados para este pedido.</p>
                )}

                {/* Footer (Opcional) */}
                <div className="mt-8 text-xs text-gray-500 text-center print-footer">
                    <p>Este documento es un resumen de materiales y no representa una factura fiscal.</p>
                    <p>GAVIOTY SOLUTIONS - RIF J-XXXXXX</p>
                </div>

            </div> {/* Fin del contenedor imprimible */}

            {/* Botón de Imprimir (Fuera del contenedor) */}
            <div className="mt-6 flex justify-end">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir Recibo
                </Button>
            </div>

            {/* Estilos específicos para impresión */}
            <style jsx global>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact; /* Fuerza colores de fondo en Chrome/Safari */
                        print-color-adjust: exact; /* Estándar */
                    }
                    .print-container {
                        border: none;
                        box-shadow: none;
                        padding: 0;
                        margin: 0;
                        width: 100%;
                        max-width: 100%;
                    }
                    /* Ocultar elementos no deseados al imprimir */
                     .no-print { 
                        display: none !important; 
                    }
                     .print-footer {
                         position: fixed;
                         bottom: 10px;
                         width: 100%;
                     }
                }
            `}</style>
        </div>
    );
}