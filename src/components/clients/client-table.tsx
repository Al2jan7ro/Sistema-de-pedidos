'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, Edit } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Client } from "@/lib/schemas/client"
import { ClientDeleteButton } from "./ClientDeleteButton"
import Image from "next/image"

// Tipificación de las props
interface ClientTableProps {
    initialClients: Client[]
}

export function ClientTable({ initialClients }: ClientTableProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 4

    // El filtrado ahora se aplica a los datos recibidos por prop
    const filteredClients = initialClients.filter(
        (client) =>
            client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (client.phone && client.phone.includes(searchQuery)) // Se asegura que 'phone' exista antes de buscar
    )

    const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentClients = filteredClients.slice(startIndex, endIndex)


    // Función auxiliar para el Badge (asumiendo que no usas un componente Badge de shadcn)
    const getStatusBadge = (status: Client['status']) => {
        const styles: Record<string, string> = {
            Active: "bg-green-100 text-green-800 border-green-200",
            Inactive: "bg-red-100 text-red-800 border-red-200",
            Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
        }

        // El estado debería coincidir con el ENUM de Zod: 'Active', 'Inactive', 'Pending'
        const currentStatus = status as keyof typeof styles;

        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[currentStatus] || styles.Pending}`}
            >
                {status}
            </span>
        )
    }

    return (
        <Card className="w-full border-border shadow-lg min-h-[40vw]">
            <CardHeader className="space-y-3 pb-6">
                <div className="flex items-center gap-3">
                    {/* Ajusta esta ruta de imagen si es necesario */}
                    <Image src="/assets/gaviotylogo.png" alt="Logo" width={120} height={120} />
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Clientes</CardTitle>
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
                            placeholder="Buscar por nombre, email o teléfono..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1) // Resetear página al buscar
                            }}
                            className="pl-10 h-11 border-border focus:border-foreground transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        {/* Uso del componente Link para la navegación de creación */}
                        <Link href="/dashboard/clients/new">
                            <Button
                                className="h-11 px-4 bg-foreground hover:bg-foreground/90 text-background transition-all duration-200 hover:shadow-md"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Cliente
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {/* Tabla */}
                <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="font-semibold">Nombre Completo</TableHead>
                                <TableHead className="font-semibold">Email</TableHead>
                                <TableHead className="font-semibold">Teléfono</TableHead>
                                <TableHead className="font-semibold">Estado</TableHead>
                                <TableHead className="font-semibold">Fecha de Creación</TableHead>
                                <TableHead className="text-right font-semibold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentClients.length > 0 ? (
                                currentClients.map((client) => (
                                    <TableRow key={client.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium">{client.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{client.email}</TableCell>
                                        <TableCell className="text-muted-foreground">{client.phone || 'N/A'}</TableCell>
                                        <TableCell>{getStatusBadge(client.status)}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {/* Usamos format de date-fns para mejor control de formato */}
                                            {format(new Date(client.created_at || new Date()), 'dd/MMM/yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Botón de Edición con Link a la ruta de edición */}
                                                <Link href={`/dashboard/clients/edit/${client.id}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-muted"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {/* Botón de Eliminación */}
                                                <ClientDeleteButton clientId={client.id} clientName={client.name} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No se encontraron clientes
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
                            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredClients.length)} de {filteredClients.length}
                            {" "}clientes
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