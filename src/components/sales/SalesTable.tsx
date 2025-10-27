'use client';

import { useState, useMemo } from 'react';
import { SaleExtended } from '@/lib/schemas/sales';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, Edit, Trash2, FileText } from 'lucide-react'; // Importar iconos
import Link from 'next/link';
import { format } from 'date-fns';
// Importar componente de borrado (lo crearemos)
import { CancelSaleButton } from './CancelSaleButton';

interface SalesTableProps {
    initialSales: SaleExtended[];
}

export function SalesTable({ initialSales }: SalesTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    // ... (Lógica de paginación similar a OrderTable si es necesaria) ...

    const filteredSales = useMemo(() => {
        if (!initialSales) return [];
        const query = searchQuery.toLowerCase();
        return initialSales.filter(sale => {
            if (!sale) return false;
            return (
                (sale.sale_code?.toLowerCase() || '').includes(query) ||
                (sale.orders?.order_number?.toLowerCase() || '').includes(query) ||
                (sale.orders?.clients?.name?.toLowerCase() || '').includes(query) ||
                (sale.orders?.products?.name?.toLowerCase() || '').includes(query)
            );
        });
    }, [initialSales, searchQuery]);

    // ... (Implementar paginación con currentSales si hay muchos registros) ...
    const currentSales = filteredSales; // Simplificado por ahora

    return (
        <Card className="border-border shadow-lg">
            <CardHeader>
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Buscar por Código Venta, # Pedido, Cliente, Producto..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 border-border focus:border-foreground"
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead>Cód. Venta</TableHead>
                                <TableHead># Pedido</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead>Altura (m)</TableHead>
                                <TableHead>Longitud (ml)</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentSales && currentSales.length > 0 ? (
                                currentSales.map(sale => (
                                    <TableRow key={sale.id}>
                                        <TableCell className="font-medium">{sale.sale_code || 'N/A'}</TableCell>
                                        <TableCell>{sale.orders?.order_number || 'N/A'}</TableCell>
                                        <TableCell>{sale.orders?.clients?.name || 'N/A'}</TableCell>
                                        <TableCell>{sale.orders?.products?.name || 'N/A'}</TableCell>
                                        <TableCell>{sale.height !== null && sale.height !== undefined ? sale.height : '-'}</TableCell>
                                        <TableCell>{sale.length !== null && sale.length !== undefined ? sale.length : '-'}</TableCell>
                                        <TableCell>{sale.created_at ? format(new Date(sale.created_at), 'dd/MM/yy HH:mm') : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                {/* Botón Ver Recibo (Pedido Completo) */}
                                                <Link href={`/dashboard/orders/${sale.orders?.id}/receipt`} title="Ver Recibo del Pedido Completo">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100">
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {/* Botón Editar Venta */}
                                                <Link href={`/dashboard/sales/edit/${sale.id}`} title="Editar esta Venta/Tramo">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:bg-muted">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {/* Botón Cancelar Venta */}
                                                <CancelSaleButton saleId={sale.id} saleCode={sale.sale_code} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        {!initialSales || initialSales.length === 0 ? (
                                            'No hay ventas registradas.'
                                        ) : (
                                            'No se encontraron ventas que coincidan con la búsqueda.'
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* ... (Paginación UI si se implementa) ... */}
            </CardContent>
        </Card>
    );
}