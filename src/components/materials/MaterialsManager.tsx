"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GripVertical, Plus, Trash2, Save, X, Loader2, LayoutGrid, Settings2, MoreVertical, Edit2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export function MaterialsManager() {
    const supabase = createClient();
    const [selectedTable, setSelectedTable] = useState<"tabla_gavioterranet_units" | "tabla_gavioflex_units">("tabla_gavioterranet_units");
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);

    // Column Management States
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnName, setNewColumnName] = useState("");
    const [isRenamingColumn, setIsRenamingColumn] = useState(false);
    const [oldColumnName, setOldColumnName] = useState("");
    const [renamedColumnValue, setRenamedColumnValue] = useState("");

    // Confirmation States
    const [confirmConfig, setConfirmConfig] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({
        open: false,
        title: "",
        description: "",
        onConfirm: () => { },
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: colData, error: colError } = await supabase.rpc("get_table_columns", {
                table_name_text: selectedTable,
            });

            if (colError) throw colError;

            const dynamicCols = (colData as any[]).map((c: any) => c.column_name);
            const sortedCols = ["altura", ...dynamicCols.filter((c) => c !== "altura")];
            setColumns(sortedCols);

            const { data: fetchedData, error } = await supabase
                .from(selectedTable)
                .select("*")
                .order("altura", { ascending: true });

            if (error) throw error;
            setData(fetchedData || []);
        } catch (error: any) {
            console.error("Error fetching data:", error);
            toast.error("Error al cargar datos", { description: error.message });
        } finally {
            setLoading(false);
        }
    }, [selectedTable, supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddMaterialRow = async () => {
        const newMaterial: any = { altura: 0 };
        columns.forEach((col) => {
            if (col !== "altura") newMaterial[col] = 0;
        });

        try {
            const { data: insertedData, error } = await supabase
                .from(selectedTable)
                .insert(newMaterial)
                .select()
                .single();

            if (error) throw error;

            setData([...data, insertedData]);
            setEditingId(insertedData.id);
            toast.success("Nueva fila añadida");
        } catch (error: any) {
            toast.error("Error al añadir fila", { description: error.message });
        }
    };

    const handleAddField = async () => {
        const name = newColumnName.trim().toLowerCase();
        if (!name) return;

        setLoading(true);
        try {
            const { error } = await supabase.rpc("add_column_to_table", {
                p_table_name: selectedTable,
                p_column_name: name,
            });

            if (error) throw error;

            setNewColumnName("");
            setIsAddingColumn(false);
            await fetchData();
            toast.success(`Material "${name}" añadido correctamente`);
        } catch (error: any) {
            toast.error("Error al añadir material", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRenameField = async () => {
        const newName = renamedColumnValue.trim().toLowerCase();
        if (!newName || newName === oldColumnName) {
            setIsRenamingColumn(false);
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.rpc("rename_column_in_table", {
                p_table_name: selectedTable,
                p_old_column_name: oldColumnName,
                p_new_column_name: newName,
            });

            if (error) throw error;

            setIsRenamingColumn(false);
            await fetchData();
            toast.success(`Material cambiado a "${newName}"`);
        } catch (error: any) {
            toast.error("Error al renombrar", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteField = async (colName: string) => {
        if (colName === "altura") return;

        setConfirmConfig({
            open: true,
            title: "¿Eliminar material permanentemente?",
            description: `Esta acción eliminará el material "${colName}" y TODOS sus valores asociados en la tabla ${selectedTable}. No se puede deshacer.`,
            onConfirm: async () => {
                setLoading(true);
                try {
                    const { error } = await supabase.rpc("drop_column_from_table", {
                        p_table_name: selectedTable,
                        p_column_name: colName,
                    });

                    if (error) throw error;

                    await fetchData();
                    toast.success(`Material "${colName}" eliminado`);
                } catch (error: any) {
                    toast.error("Error al eliminar material", { description: error.message });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleDeleteMaterialRow = (id: string) => {
        setConfirmConfig({
            open: true,
            title: "¿Eliminar esta fila?",
            description: "Se borrarán permanentemente todos los valores de esta altura.",
            onConfirm: async () => {
                try {
                    const { error } = await supabase.from(selectedTable).delete().eq("id", id);
                    if (error) throw error;

                    setData(data.filter((item) => item.id !== id));
                    toast.success("Fila eliminada correctamente");
                } catch (error: any) {
                    toast.error("Error al eliminar fila", { description: error.message });
                }
            }
        });
    };

    const handleEditMaterial = (id: string, field: string, value: string) => {
        setData(
            data.map((item) =>
                item.id === id ? { ...item, [field]: Number.parseFloat(value) || 0 } : item
            )
        );
    };

    const handleSaveEdit = async (id: string) => {
        const itemToUpdate = data.find((item) => item.id === id);
        if (!itemToUpdate) return;

        const updatePayload: any = { id };
        columns.forEach(col => {
            updatePayload[col] = itemToUpdate[col];
        });

        try {
            const { error } = await supabase
                .from(selectedTable)
                .update(updatePayload)
                .eq("id", id);

            if (error) throw error;

            setEditingId(null);
            toast.success("Valores actualizados");
        } catch (error: any) {
            toast.error("Error al guardar cambios", { description: error.message });
        }
    };

    // Drag and Drop
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedItem(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedItem || draggedItem === targetId) return;

        const draggedIndex = data.findIndex((item) => item.id === draggedItem);
        const targetIndex = data.findIndex((item) => item.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newData = [...data];
        const [removed] = newData.splice(draggedIndex, 1);
        newData.splice(targetIndex, 0, removed);

        setData(newData);
        setDraggedItem(null);
    };

    return (
        <Card className="w-full border-border shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-4 pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Image src="/assets/gaviotylogo.png" alt="Logo" width={120} height={120} />

                        <div>
                            <CardTitle className="text-2xl font-bold tracking-tight">Configuración de Materiales</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                Ajusta los valores técnicos para los cálculos de pedidos de Gaviotex y Gavioterranet.
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Dialog open={isAddingColumn} onOpenChange={setIsAddingColumn}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 border-dashed transition-all hover:bg-foreground hover:text-background">
                                    <LayoutGrid className="h-4 w-4 mr-2" />
                                    Añadir Material (Columna)
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nuevo Tipo de Material</DialogTitle>
                                    <DialogDescription>Añadirás una nueva columna técnica a la tabla.</DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Input
                                        placeholder="Nombre (ej: geotextil 1700)..."
                                        value={newColumnName}
                                        onChange={(e) => setNewColumnName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddField()}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsAddingColumn(false)}>Cancelar</Button>
                                    <Button onClick={handleAddField} disabled={loading || !newColumnName}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Crear Material
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Select
                        value={selectedTable}
                        onValueChange={(value: any) => setSelectedTable(value)}
                    >
                        <SelectTrigger className="w-full sm:w-[320px] h-11 border-border/60 bg-background/50 focus:ring-foreground">
                            <SelectValue placeholder="Seleccione una tabla" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tabla_gavioterranet_units" className="py-3 cursor-pointer">
                                <span className="font-semibold">Gavioterranet</span>
                                <span className="block text-xs text-muted-foreground">Tabla con geotextiles múltiples</span>
                            </SelectItem>
                            <SelectItem value="tabla_gavioflex_units" className="py-3 cursor-pointer">
                                <span className="font-semibold">Gavioflex</span>
                                <span className="block text-xs text-muted-foreground">Tabla estándar de unidades</span>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={handleAddMaterialRow}
                        disabled={loading}
                        className="h-10 px-6 bg-foreground hover:bg-foreground/90 text-background transition-all"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevos valores (Fila)
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pb-6">
                <div className="mb-6 p-4 bg-muted/30 rounded-xl border border-border/40 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <p className="text-xs text-muted-foreground">
                                <strong className="text-foreground">Materiales:</strong> {columns.length}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                <strong className="text-foreground">Variantes de Altura:</strong> {data.length}
                            </p>
                        </div>
                    </div>
                </div>

                <Dialog open={isRenamingColumn} onOpenChange={setIsRenamingColumn}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar nombre de material</DialogTitle>
                            <DialogDescription>
                                Cambiar "{oldColumnName}" por:
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                placeholder="Nuevo nombre..."
                                value={renamedColumnValue}
                                onChange={(e) => setRenamedColumnValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleRenameField()}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsRenamingColumn(false)}>Cancelar</Button>
                            <Button onClick={handleRenameField} disabled={loading || !renamedColumnValue}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambio
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={confirmConfig.open} onOpenChange={(open) => setConfirmConfig(prev => ({ ...prev, open }))}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{confirmConfig.title}</AlertDialogTitle>
                            <AlertDialogDescription>{confirmConfig.description}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmConfig.onConfirm}
                                className="bg-black text-white cursor-pointer"
                            >
                                Confirmar Eliminación
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <div className="relative border border-border/50 rounded-xl overflow-hidden bg-background/30 shadow-inner">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50 border-b-2">
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead className="text-left font-bold w-[140px] pl-4">ACCIONES</TableHead>
                                    {columns.map((col) => (
                                        <TableHead key={col} className="font-bold text-foreground text-xs uppercase tracking-wider py-4 whitespace-nowrap min-w-[160px]">
                                            <div className="flex items-center justify-between gap-2 px-1">
                                                <span>{col}</span>
                                                {col !== "id" && col !== "altura" && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-foreground/10">
                                                                <MoreVertical className="h-3 w-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setOldColumnName(col);
                                                                    setRenamedColumnValue(col);
                                                                    setIsRenamingColumn(true);
                                                                }}
                                                                className="cursor-pointer"
                                                            >
                                                                <Edit2 className="h-4 w-4 mr-2" />
                                                                Renombrar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteField(col)}
                                                                className="text-destructive focus:text-destructive cursor-pointer"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length + 2} className="text-center py-20">
                                            <Loader2 className="h-10 w-10 animate-spin mx-auto text-muted-foreground/50" />
                                            <p className="mt-4 text-muted-foreground font-medium">Sincronizando base de datos...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : data.length > 0 ? (
                                    data.map((material) => (
                                        <TableRow
                                            key={material.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, material.id)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, material.id)}
                                            onDragEnd={() => setDraggedItem(null)}
                                            className={`hover:bg-muted/20 transition-all border-b border-border/30 cursor-move ${draggedItem === material.id ? "opacity-30 bg-muted" : ""
                                                }`}
                                        >
                                            <TableCell className="text-center group">
                                                <GripVertical className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                                            </TableCell>
                                            <TableCell className="text-left pl-4">
                                                <div className="flex justify-start gap-1">
                                                    {editingId === material.id ? (
                                                        <>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => handleSaveEdit(material.id)}
                                                                className="h-8 w-8 p-0 bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700"
                                                            >
                                                                <Save className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setEditingId(null)}
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setEditingId(material.id)}
                                                                className="h-8 px-4 text-xs font-semibold hover:bg-foreground hover:text-background transition-colors"
                                                            >
                                                                EDITAR
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteMaterialRow(material.id)}
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            {columns.map((col) => (
                                                <TableCell key={col} className="py-2">
                                                    {editingId === material.id ? (
                                                        <Input
                                                            type="number"
                                                            step="0.001"
                                                            value={material[col] ?? 0}
                                                            onChange={(e) => handleEditMaterial(material.id, col, e.target.value)}
                                                            className="h-9 w-full min-w-[110px] bg-background border-foreground/20 focus:border-foreground transition-all"
                                                        />
                                                    ) : (
                                                        <div className="px-3 py-1 bg-muted/40 rounded text-sm text-foreground/80 font-medium border border-transparent hover:border-border transition-all">
                                                            {material[col]}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length + 2} className="text-center py-16 text-muted-foreground bg-muted/10">
                                            <div className="max-w-xs mx-auto space-y-2">
                                                <p className="font-semibold text-foreground">No hay alturas definidas</p>
                                                <p className="text-xs">Usa el botón "Nuevos valores" para empezar.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
