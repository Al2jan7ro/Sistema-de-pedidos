'use client'

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, Edit, DollarSign } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { OrderExtended } from "@/lib/schemas/orders"
import { DeleteOrderButton } from './DeleteOrderButton';
import { Badge } from "@/components/ui/badge"
// IMPORTAR EL NUEVO COMPONENTE
import { AttachmentsViewer } from './AttachmentsViewer';

// Tipificación de las props
interface OrderTableProps {
    initialOrders: OrderExtended[]
}

export function OrderTable({ initialOrders }: OrderTableProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 4

    // --- Lógica de Filtrado y Paginación ---
    const filteredOrders = useMemo(() => {
        const query = searchQuery.toLowerCase()
        return initialOrders.filter(
            (order) =>
                order.order_number.toLowerCase().includes(query) ||
                order.clients.name.toLowerCase().includes(query) ||
                order.products.name.toLowerCase().includes(query) ||
                `${order.solicitant.first_name} ${order.solicitant.last_name}`.toLowerCase().includes(query) ||
                order.status.toLowerCase().includes(query)
        )
    }, [initialOrders, searchQuery])

    // Ajuste de paginación al filtrar
    useEffect(() => {
        const newTotalPages = Math.ceil(filteredOrders.length / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        } else if (filteredOrders.length === 0 && currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [filteredOrders.length, currentPage]);

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentOrders = filteredOrders.slice(startIndex, endIndex)

    // Función auxiliar para el Badge de Estado (estilos personalizados)
    const getStatusBadge = (status: OrderExtended['status']) => {
        let colorClass = '';

        switch (status) {
            case 'Completado':
                colorClass = 'bg-green-100 text-green-800 border-green-200';
                break;
            case 'Cancelado':
                colorClass = 'bg-red-100 text-red-800 border-red-200';
                break;
            case 'Pendiente':
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
                        <CardTitle className="text-2xl font-bold tracking-tight">Pedidos de Obra</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Gestión de todos los pedidos realizados por los solicitantes.
                        </CardDescription>
                    </div>
                </div>

                {/* Barra de búsqueda y acciones */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Buscar por # Pedido, Cliente, Producto o Solicitante..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="pl-10 h-11 border-border focus:border-foreground transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        {/* Botón para crear nuevo pedido */}
                        <Link href="/dashboard/orders/new">
                            <Button
                                className="h-11 px-4 bg-foreground hover:bg-foreground/90 text-background transition-all duration-200 hover:shadow-md"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Pedido
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {/* Tabla de Pedidos */}
                <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="font-semibold w-[120px]">Pedido</TableHead>
                                <TableHead className="font-semibold">Cliente</TableHead>
                                <TableHead className="font-semibold">Producto</TableHead>
                                <TableHead className="font-semibold">Solicitante</TableHead>
                                <TableHead className="font-semibold w-[120px]">Estado</TableHead>
                                <TableHead className="font-semibold">Fecha</TableHead>
                                <TableHead className="font-semibold text-center w-[50px]">Archivos</TableHead> {/* NUEVA COLUMNA */}
                                <TableHead className="text-right font-semibold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentOrders.length > 0 ? (
                                currentOrders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium text-foreground/90">{order.order_number}</TableCell>
                                        <TableCell className="text-muted-foreground">{order.clients.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{order.products.name}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {order.solicitant.first_name} {order.solicitant.last_name}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(order.created_at || new Date()), 'dd/MMM/yyyy')}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {/* CELDA DE ARCHIVOS */}
                                            <AttachmentsViewer
                                                attachments={order.order_attachments}
                                                orderNumber={order.order_number}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* FIN CELDA DE ARCHIVOS */}
                                                {/* 1. Botón para Crear Venta */}
                                                <Link href={`/dashboard/sales/new?orderId=${order.id}`} title="Crear Venta a partir de este Pedido">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700"
                                                    >
                                                        <DollarSign className="h-4 w-4" />
                                                    </Button>
                                                </Link>

                                                {/* 2. Botón de Edición/Vista */}
                                                <Link href={`/dashboard/orders/edit/${order.id}`} title="Ver/Editar Pedido">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-muted"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>

                                                {/* 3. Componente de Eliminación */}
                                                <DeleteOrderButton
                                                    orderId={order.id}
                                                    orderNumber={order.order_number}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        {initialOrders.length === 0 && searchQuery === ""
                                            ? "No hay pedidos registrados en el sistema."
                                            : `No se encontraron pedidos para la búsqueda: "${searchQuery}"`
                                        }
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="flex lg:flex-row flex-col items-center justify-between pt-6">
                        <p className="text-sm text-muted-foreground">
                            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredOrders.length)} de {filteredOrders.length}
                            {" "}pedidos
                        </p>
                        <div className="flex gap-2 lg:mt-0 mt-5">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="h-9 border-border hover:bg-muted"
                            >
                                Anterior
                            </Button>
                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={`h-9 w-9 ${currentPage === page
                                            ? "bg-foreground hover:bg-foreground/90 text-background"
                                            : "border-border hover:bg-muted"
                                            }`}
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="h-9 border-border hover:bg-muted"
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>

        </Card>
    )
}