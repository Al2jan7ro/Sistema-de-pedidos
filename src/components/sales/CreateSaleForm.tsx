'use client';

import { useActionState, useEffect, useState, useTransition, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Save, XCircle, Calculator, ShoppingCart, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { toast } from 'sonner';
import { ActionResponse } from '@/lib/schemas/orders';
import { CalculatedItem } from '@/lib/schemas/sales';
import { createSale, calculateSaleItems } from '@/app/dashboard/sales/actions';
import { useRouter } from 'next/navigation';
import { SelectOrder } from '../orders/SelectOrder';

interface CreateSaleFormProps {
    orderId?: string; // Hacer opcional para permitir selección manual
    availableHeights: number[];
}

const initialState: ActionResponse = { success: false, message: '' };

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            className="flex-1 h-11 bg-foreground hover:bg-foreground/90 text-background transition-all duration-200 hover:shadow-md"
            disabled={pending}
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                </>
            ) : (
                <>
                    <Save className="mr-2 h-4 w-4" />
                    Registrar Venta
                </>
            )}
        </Button>
    );
}

export function CreateSaleForm({
    orderId: initialOrderId,
    availableHeights
}: CreateSaleFormProps) {
    const router = useRouter();
    const [orderId, setOrderId] = useState(initialOrderId || '');
    const [finalState, finalFormAction] = useActionState(createSale, initialState);
    const [selectedHeight, setSelectedHeight] = useState<string>('');
    const [length, setLength] = useState('');
    const [saleDescription, setSaleDescription] = useState('');
    const [calculatedItems, setCalculatedItems] = useState<CalculatedItem[]>([]);
    const [calculationError, setCalculationError] = useState<string | null>(null);
    const [isCalculating, startCalculationTransition] = useTransition();

    // Efecto para redirección después de guardar
    useEffect(() => {
        if (!finalState.message) return;
        if (finalState.success) {
            toast.success(finalState.message);
            const timer = setTimeout(() => {
                router.push(`/dashboard/sales`);
            }, 1500);
            return () => clearTimeout(timer);
        } else {
            toast.error(finalState.message || "Ocurrió un error al guardar.");
        }
    }, [finalState, router, initialOrderId]);

    // Manejar cambio de pedido
    const handleOrderChange = (selectedOrderId: string) => {
        setOrderId(selectedOrderId);
        // Resetear cálculos al cambiar de pedido
        setCalculatedItems([]);
        setCalculationError(null);
        setSelectedHeight('');
        setLength('');
    };

    const currentHeight = useMemo(() => parseFloat(selectedHeight), [selectedHeight]);
    const currentLength = useMemo(() => parseFloat(length), [length]);

    // Función para calcular los materiales
    const handleCalculate = () => {
        if (!orderId) {
            setCalculationError('Por favor, selecciona un pedido primero.');
            return;
        }

        if (isNaN(currentHeight) || currentHeight <= 0 || isNaN(currentLength) || currentLength <= 0) {
            setCalculationError('Selecciona una altura e ingresa una longitud positiva.');
            setCalculatedItems([]);
            return;
        }
        setCalculationError(null);

        startCalculationTransition(async () => {
            const result = await calculateSaleItems(orderId, currentHeight, currentLength);
            if (result.success && result.items) {
                setCalculatedItems(result.items);
                setCalculationError(null);
            } else {
                setCalculatedItems([]);
                setCalculationError(result.message || 'Error al calcular los materiales.');
                toast.error(result.message || 'No se pudieron calcular los materiales.');
            }
        });
    };

    useEffect(() => {
        if (orderId && selectedHeight && length) {
            handleCalculate();
        } else {
            setCalculatedItems([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, selectedHeight, length]);

    // Renderizar el formulario
    return (
        <div className="w-full">
            <form action={finalFormAction} className="space-y-6">
                {/* Campos ocultos para la acción del servidor */}
                <input type="hidden" name="orderId" value={orderId} />
                <input type="hidden" name="height" value={currentHeight || ''} />
                <input type="hidden" name="length" value={currentLength || ''} />
                <input type="hidden" name="saleDescription" value={saleDescription} />

                {/* Selector de pedido (solo si no viene pre-seleccionado) */}
                {!initialOrderId && (
                    <div className="space-y-2 p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <Label htmlFor="orderId" className="text-sm font-semibold flex items-center gap-2 text-primary">
                            <ShoppingCart className="h-4 w-4" />
                            Paso 1: Seleccionar Pedido
                        </Label>
                        <SelectOrder
                            value={orderId}
                            onValueChange={handleOrderChange}
                        />
                    </div>
                )}

                {/* Sección de Inputs para Cálculo - Diseño Premium */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-accent/30 border border-border/50">
                    <div className="space-y-2">
                        <Label htmlFor="height" className="text-sm font-semibold flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-primary" />
                            Altura seleccionada (m)
                        </Label>
                        <Select
                            name="height"
                            value={selectedHeight}
                            onValueChange={setSelectedHeight}
                            required
                        >
                            <SelectTrigger className="bg-background/50 border-border/60 focus:ring-primary h-11">
                                <SelectValue placeholder="Selecciona una altura" />
                            </SelectTrigger>
                            <SelectContent >
                                {availableHeights.map((height) => (
                                    <SelectItem key={height} value={height.toString()}>
                                        {height} m
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="length" className="text-sm font-semibold flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-primary" />
                            Longitud del tramo (ml)
                        </Label>
                        <Input
                            id="length"
                            name="length"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={length}
                            onChange={(e) => setLength(e.target.value)}
                            placeholder="Ej: 25.5"
                            className="bg-background/50 border-border/60 focus:ring-primary h-11"
                            required
                        />
                    </div>
                </div>

                {/* Resultados del Cálculo - Diseño Premium */}
                <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Materiales Calculados</h3>

                    {isCalculating ? (
                        <div className="border border-dashed border-primary/30 rounded-xl p-8 text-center bg-primary/5 animate-pulse">
                            <Loader2 className="mx-auto h-8 w-8 mb-2 animate-spin text-primary" />
                            <p className="text-sm font-medium text-primary">Calculando materiales necesarios...</p>
                        </div>
                    ) : calculatedItems.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            {calculatedItems.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-card border border-border/50 shadow-sm hover:shadow transition-all duration-200">
                                    <span className="text-sm text-muted-foreground">{item.item_label || item.item_key}</span>
                                    <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded">
                                        {item.item_value} {item.item_unit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border border-dashed rounded-xl p-8 text-center text-muted-foreground bg-muted/20 flex flex-col items-center justify-center min-h-[150px]">
                            <Calculator className="h-10 w-10 mb-2 opacity-20" />
                            <p className="text-sm font-medium">Esperando datos de cálculo</p>
                            <p className="text-xs mt-1">Ingresa altura y longitud para ver resultados.</p>
                        </div>
                    )}

                    {calculationError && (
                        <div className="text-sm text-destructive p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <XCircle className="h-4 w-4" />
                            {calculationError}
                        </div>
                    )}
                </div>

                {/* Descripción */}
                <div className="space-y-2 pt-2">
                    <Label htmlFor="saleDescription" className="text-sm font-semibold">Notas y Observaciones (Opcional)</Label>
                    <Textarea
                        id="saleDescription"
                        name="saleDescription"
                        value={saleDescription}
                        onChange={(e) => setSaleDescription(e.target.value)}
                        placeholder="Detalles específicos del tramo, ubicación, etc..."
                        className="bg-background/50 border-border/60 focus:ring-primary min-h-[100px] resize-none"
                    />
                </div>

                {/* Botones de acción */}
                <div className="flex gap-4 pt-6 mt-4 border-t border-border/60">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="flex-1 h-11 px-8 hover:bg-accent/50"
                    >
                        Cancelar
                    </Button>
                    <SubmitButton />
                </div>
            </form>
        </div>
    );
}