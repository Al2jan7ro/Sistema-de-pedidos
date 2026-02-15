'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Edit } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Product } from '@/lib/schemas/product';
import { DeleteProductButton } from './DeleteProductButton';
import Image from 'next/image';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';

interface ProductListTableProps {
    products: Product[];
    canMutate: boolean; // Permiso para editar/eliminar (Solo Admin)
    canCreate: boolean; // Permiso para crear (Admin y Solicitante) 
}

export function ProductListTable({ products, canMutate, canCreate }: ProductListTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    return (
        <Card className="w-full border-border shadow-lg min-h-[40vw]">
            <CardHeader className="space-y-3 pb-6">
                <div className="flex items-center gap-3">
                    <Image src="/assets/gaviotylogo.png" alt="Logo" width={120} height={120} />
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Productos</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Gavioty Solutions - Sistema de Pedidos
                        </CardDescription>
                    </div>
                </div>

                {/* Barra de búsqueda y acciones */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Buscar por nombre o descripción..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10 h-11 border-border focus:border-foreground transition-colors"
                        />
                    </div>
                    {/* 💥 CORRECCIÓN DE LÓGICA: Usar canCreate para el botón de creación */}
                    {canCreate && (
                        <div className="flex gap-2">
                            <Link href="/dashboard/products/new">
                                <Button className="h-11 px-4 bg-foreground hover:bg-foreground/90 text-background transition-all duration-200 hover:shadow-md">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Crear Producto
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {/* Tabla */}
                <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="font-semibold">Nombre</TableHead>
                                <TableHead className="font-semibold hidden sm:table-cell">Descripción</TableHead>
                                <TableHead className="font-semibold">Fecha de Creación</TableHead>
                                {canMutate && <TableHead className="text-right font-semibold">Acciones</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentProducts.length > 0 ? (
                                currentProducts.map((product) => (
                                    <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                                            {product.description ? (
                                                <HoverCard>
                                                    <HoverCardTrigger asChild>
                                                        <span className="cursor-default hover:underline">
                                                            {product.description.length > 50
                                                                ? `${product.description.substring(0, 50)}...`
                                                                : product.description}
                                                        </span>
                                                    </HoverCardTrigger>
                                                    {product.description.length > 50 && (
                                                        <HoverCardContent className="w-80">
                                                            <div className="space-y-2">
                                                                <h4 className="text-sm font-semibold">Descripción completa</h4>
                                                                <p className="text-sm">{product.description}</p>
                                                            </div>
                                                        </HoverCardContent>
                                                    )}
                                                </HoverCard>
                                            ) : (
                                                <span>No especificada</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(product.created_at), 'dd/MMM/yyyy')}
                                        </TableCell>
                                        {canMutate && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/dashboard/products/edit/${product.id}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 hover:bg-muted"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <DeleteProductButton
                                                        productId={product.id}
                                                        productName={product.name}
                                                    />
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={canMutate ? 4 : 3}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No se encontraron productos
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
                            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProducts.length)} de {filteredProducts.length}
                            {" "}productos
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
    );
}