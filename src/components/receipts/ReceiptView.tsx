'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, usePDF } from '@react-pdf/renderer';

// Estilos para el PDF
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 12,
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#000',
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 3,
        color: '#666',
    },
    section: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    col: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#e5e7eb',
        borderRadius: 4,
        backgroundColor: '#f9fafb',
    },
    table: {
        width: '100%',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#e5e7eb',
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#e5e7eb',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#e5e7eb',
    },
    tableCell: {
        flex: 1,
        padding: 8,
    },
    tableHeaderCell: {
        flex: 1,
        padding: 8,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 10,
        color: '#6b7280',
    },
});

// Componente para el documento PDF
const ReceiptPdf = ({ data }: { data: ReceiptData }) => {
    const ITEM_KEY_TO_LABEL_LOCAL: Record<string, string> = {
        "seccion de muro": "Sección de Muro",
        "canasta de 2x1x1": "Canasta 2x1x1",
        "canasta de 1,5x1x1": "Canasta 1.5x1x1",
        "canasta de 2x1x0,5": "Canasta 2x1x0.5",
        "geotextil 1600": "Geotextil 1600",
        "geotextil 1700": "Geotextil 1700",
        "geotextil 2100": "Geotextil 2100",
        "geotextil 2400": "Geotextil 2400",
        "geotextil 3000": "Geotextil 3000",
        "geotextil 4000": "Geotextil 4000",
        "geotextil 5000": "Geotextil 5000",
        "geotextil 6000": "Geotextil 6000",
        "geotextil 10000": "Geotextil 10000",
        "geotextil planar": "Geotextil Planar",
        "toba cemento": "Toba Cemento",
        "tuberia": "Tubería"
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>GAVIOTY SOLUTIONS</Text>
                    <Text style={styles.subtitle}>Recibo de Materiales - Pedido #{data.orderNumber}</Text>
                    <Text style={styles.subtitle}>Fecha de Generación: {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
                    <Text style={styles.subtitle}>Fecha del Pedido: {format(new Date(data.orderDate), 'dd/MM/yyyy')}</Text>
                </View>

                <View style={{ ...styles.row, marginBottom: 20 }}>
                    <View style={styles.col}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Cliente</Text>
                        <Text>Nombre: {data.client?.name || 'N/A'}</Text>
                        <Text>Email: {data.client?.email || 'N/A'}</Text>
                        <Text>Teléfono: {data.client?.phone || 'N/A'}</Text>
                        <Text>Dirección: {data.client?.address || 'N/A'}</Text>
                    </View>
                    <View style={{ width: 20 }} />
                    <View style={styles.col}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Detalles del Pedido</Text>
                        <Text>Producto: {data.product || 'N/A'}</Text>
                        <Text>Solicitante: {data.solicitant}</Text>
                        <Text>Longitud Total: {data.totalLength.toFixed(2)} ml</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Resumen Total de Materiales</Text>
                    {data.materials.length > 0 ? (
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Material</Text>
                                <Text style={{ ...styles.tableHeaderCell, textAlign: 'right' }}>Cantidad Total</Text>
                                <Text style={styles.tableHeaderCell}>Unidad</Text>
                            </View>
                            {data.materials
                                .sort((a, b) => (a.label || a.item_key).localeCompare(b.label || b.item_key))
                                .map((mat, index) => (
                                    <View key={index} style={styles.tableRow}>
                                        <Text style={{ ...styles.tableCell, flex: 2 }}>
                                            {mat.label || ITEM_KEY_TO_LABEL_LOCAL[mat.item_key] || mat.item_key}
                                        </Text>
                                        <Text style={{ ...styles.tableCell, textAlign: 'right' }}>
                                            {mat.total_value.toFixed(3)}
                                        </Text>
                                        <Text style={styles.tableCell}>{mat.item_unit}</Text>
                                    </View>
                                ))}
                        </View>
                    ) : (
                        <Text>No hay materiales registrados para este pedido.</Text>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text>Este documento es un resumen de materiales y no representa una factura fiscal.</Text>
                    <Text>GAVIOTY SOLUTIONS</Text>
                </View>
            </Page>
        </Document>
    );
};

// Tipo para los datos recibidos del Server Component
export interface ReceiptData {
    orderNumber: string;
    orderDate: string;
    client: { name: string | null; email?: string | null; phone?: string | null; address?: string | null } | null;
    product: string | null;
    solicitant: string;
    totalLength: number;
    materials: { item_key: string; item_unit: string; total_value: number; label?: string }[];
}

interface ReceiptViewProps {
    data: ReceiptData;
}

export function ReceiptView({ data }: ReceiptViewProps) {
    // Memoizamos la creación del documento para evitar re-renders infinitos.
    const memoizedDocument = useMemo(() => <ReceiptPdf data={data} />, [data]);

    const [instance, updateInstance] = usePDF({ document: memoizedDocument });

    const handlePrint = () => {
        if (instance.loading || !instance.url) {
            toast.info('Generando PDF para imprimir, por favor espere...');
            return;
        }

        // Abrir el PDF en una nueva pestaña y disparar la impresión
        const printWindow = window.open(instance.url);
        if (printWindow) {
            printWindow.onload = () => {
                printWindow.print();
            };
        } else {
            alert('Por favor, deshabilite el bloqueador de ventanas emergentes para imprimir.');
        }
    };
    return (
        <div className="p-4">

            {/* Vista previa del recibo */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Vista Previa</h2>
                <div className="border rounded p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">GAVIOTY SOLUTIONS</h1>
                        <p className="text-sm text-gray-600">Recibo de Materiales - Pedido #{data.orderNumber}</p>
                        <p className="text-sm text-gray-500">Fecha de Generación: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                        <p className="text-sm text-gray-500">Fecha del Pedido: {format(new Date(data.orderDate), 'dd/MM/yyyy')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="border p-4 rounded bg-gray-50">
                            <h3 className="font-semibold mb-2 text-gray-700">Cliente</h3>
                            <p><span className="font-medium">Nombre:</span> {data.client?.name || 'N/A'}</p>
                            <p><span className="font-medium">Email:</span> {data.client?.email || 'N/A'}</p>
                            <p><span className="font-medium">Teléfono:</span> {data.client?.phone || 'N/A'}</p>
                            <p><span className="font-medium">Dirección:</span> {data.client?.address || 'N/A'}</p>
                        </div>
                        <div className="border p-4 rounded bg-gray-50">
                            <h3 className="font-semibold mb-2 text-gray-700">Detalles del Pedido</h3>
                            <p><span className="font-medium">Producto:</span> {data.product || 'N/A'}</p>
                            <p><span className="font-medium">Solicitante:</span> {data.solicitant}</p>
                            <p><span className="font-medium">Longitud Total:</span> {data.totalLength.toFixed(2)} ml</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800">Resumen Total de Materiales</h3>
                        {data.materials.length > 0 ? (
                            <div className="border rounded overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Material
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cantidad Total
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Unidad
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.materials
                                            .sort((a, b) => (a.label || a.item_key).localeCompare(b.label || b.item_key))
                                            .map((mat, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {mat.label || mat.item_key}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                        {mat.total_value.toFixed(3)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {mat.item_unit}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">No hay materiales registrados para este pedido.</p>
                        )}
                    </div>

                    <div className="text-xs text-gray-500 text-center mt-8">
                        <p>Este documento es un resumen de materiales y no representa una factura fiscal.</p>
                        <p>GAVIOTY SOLUTIONS</p>
                    </div>
                </div>


                <div className="p-6 mb-6">
                    <p className="text-gray-600 mb-6">
                        Este es un resumen de los materiales del pedido. Puedes descargar el PDF o imprimirlo directamente.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <PDFDownloadLink
                            document={memoizedDocument}
                            fileName={`Recibo_Pedido_${data.orderNumber}.pdf`}
                        >
                            {({ loading }) =>
                                <Button variant="outline" disabled={loading}>
                                    {loading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    {loading ? 'Generando...' : 'Descargar PDF'}
                                </Button>
                            }
                        </PDFDownloadLink>

                        <Button onClick={handlePrint} disabled={instance.loading} className="bg-foreground hover:bg-foreground/90 text-background">
                            {instance.loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Printer className="mr-2 h-4 w-4" />
                            )}
                            {instance.loading ? 'Preparando...' : 'Imprimir'}
                        </Button>
                    </div>
                </div>
            </div>


        </div>
    );
}