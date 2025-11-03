'use client';

import { useState, useMemo, useEffect } from 'react';
import { SaleExtended } from '@/lib/schemas/sales';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, Edit, FileText, Plus, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge"
import { CancelSaleButton } from './CancelSaleButton';

interface SalesTableProps {
    initialSales: SaleExtended[];
}

export function SalesTable({ initialSales }: SalesTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

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

    // Ajuste de paginación al filtrar
    useEffect(() => {
        const newTotalPages = Math.ceil(filteredSales.length / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        } else if (filteredSales.length === 0 && currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [filteredSales.length, currentPage]);

    const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSales = filteredSales.slice(startIndex, endIndex);

    // Función auxiliar para el Badge de Estado
    const getStatusBadge = (status: string) => {
        let colorClass = '';

        switch (status) {
            case 'completed':
                colorClass = 'bg-green-100 text-green-800 border-green-200';
                break;
            case 'cancelled':
                colorClass = 'bg-red-100 text-red-800 border-red-200';
                break;
            case 'pending':
            default:
                colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                break;
        }

        return (
            <Badge
                className={`text-xs font-medium border ${colorClass} hover:bg-transparent cursor-default capitalize`}
                variant="default"
            >
                {status}
            </Badge>
        )
    }

    return (
        <Card className="w-full border-border shadow-lg min-h-[40vw]">
            <CardHeader className="space-y-3 pb-6">
                <div className="flex items-center gap-3">
                    <img src="/assets/gaviotylogo.png" alt="Logo" width="120" height="120" />

                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Gestión de Ventas</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Visualiza y gestiona todas las ventas del sistema.
                        </CardDescription>
                    </div>
                </div>

                {/* Barra de búsqueda y acciones */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Buscar por Código Venta, # Pedido, Cliente o Producto..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10 h-11 border-border focus:border-foreground transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Link href="/dashboard/sales/new">
                            <Button
                                className="h-11 px-4 bg-foreground hover:bg-foreground/90 text-background transition-all duration-200 hover:shadow-md"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Venta
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="font-semibold w-[120px]">Código Venta</TableHead>
                                <TableHead className="font-semibold"># Pedido</TableHead>
                                <TableHead className="font-semibold">Cliente</TableHead>
                                <TableHead className="font-semibold">Producto</TableHead>
                                <TableHead className="font-semibold w-[100px]">Estado</TableHead>
                                <TableHead className="font-semibold">Fecha</TableHead>
                                <TableHead className="text-right font-semibold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentSales && currentSales.length > 0 ? (
                                currentSales.map(sale => (
                                    <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium text-foreground/90">{sale.sale_code || 'N/A'}</TableCell>
                                        <TableCell className="text-muted-foreground">{sale.orders?.order_number || 'N/A'}</TableCell>
                                        <TableCell className="text-muted-foreground">{sale.orders?.clients?.name || 'N/A'}</TableCell>
                                        <TableCell className="text-muted-foreground">{sale.orders?.products?.name || 'N/A'}</TableCell>
                                        <TableCell>{getStatusBadge(sale.status || 'pending')}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {sale.created_at ? format(new Date(sale.created_at), 'dd/MMM/yyyy') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/dashboard/orders/${sale.orders?.id}/receipt`} title="Ver Recibo">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100">
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/dashboard/sales/edit/${sale.id}`} title="Editar Venta">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <CancelSaleButton saleId={sale.id} saleCode={sale.sale_code} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        {!initialSales || initialSales.length === 0 ? (
                                            'No hay ventas registradas en el sistema.'
                                        ) : (
                                            'No se encontraron ventas que coincidan con la búsqueda.'
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Navegación de paginación */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-2 mt-4">
                        <div className="text-sm text-muted-foreground">
                            Mostrando {Math.min(startIndex + 1, filteredSales.length)}-{Math.min(endIndex, filteredSales.length)} de {filteredSales.length} ventas
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                            >
                                <span className="sr-only">Página anterior</span>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Button>
                            <div className="text-sm font-medium">
                                Página {currentPage} de {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0"
                            >
                                <span className="sr-only">Siguiente página</span>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}