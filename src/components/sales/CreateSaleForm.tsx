'use client';

import { useActionState, useEffect, useState, useTransition, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Save, XCircle, Calculator, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { toast } from 'sonner';
import { ActionResponse } from '@/lib/schemas/orders';
import { CalculatedItem } from '@/lib/schemas/sales';
import { createSale, calculateSaleItems } from '@/app/dashboard/sales/actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { SelectOrder } from '../orders/SelectOrder';

interface CreateSaleFormProps {
    orderId?: string; // Hacer opcional para permitir selección manual
    productUnitTable: string;
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
    productUnitTable,
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
            <form action={finalFormAction} className="space-y-4">
                {/* Campos ocultos para la acción del servidor */}
                <input type="hidden" name="orderId" value={orderId} />
                <input type="hidden" name="height" value={currentHeight || ''} />
                <input type="hidden" name="length" value={currentLength || ''} />
                <input type="hidden" name="saleDescription" value={saleDescription} />

                {/* Selector de pedido (solo si no viene pre-seleccionado) */}
                {!initialOrderId && (
                    <div className="space-y-1.5">
                        <Label htmlFor="orderId" className="text-sm font-medium">Seleccionar Pedido *</Label>
                        <SelectOrder
                            value={orderId}
                            onValueChange={handleOrderChange}
                        />
                    </div>
                )}

                {/* Sección de Inputs para Cálculo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="height" className="text-sm font-medium">Altura (m) *</Label>
                        <Select
                            name="height"
                            value={selectedHeight}
                            onValueChange={setSelectedHeight}
                            required
                        >
                            <SelectTrigger className="w-full border-border focus:ring-foreground transition-colors">
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

                    <div className="space-y-1.5">
                        <Label htmlFor="length" className="text-sm font-medium">Longitud (ml) *</Label>
                        <Input
                            id="length"
                            name="length"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={length}
                            onChange={(e) => setLength(e.target.value)}
                            placeholder="Ej: 25.5"
                            className="border-border focus:border-foreground transition-colors"
                            required
                        />
                    </div>
                </div>

                {/* Botón de Cálculo y Errores */}
                <div className="pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCalculate}
                        disabled={isCalculating || !orderId || !selectedHeight || !length || parseFloat(length) <= 0}
                        className="w-full h-10"
                    >
                        {isCalculating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Calculator className="mr-2 h-4 w-4" />
                        )}
                        Calcular Materiales
                    </Button>

                    {calculationError && (
                        <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-md mt-4">
                            {calculationError}
                        </div>
                    )}
                </div>

                <div className="space-y-1.5 pt-4">
                    <Label htmlFor="saleDescription" className="text-sm font-medium">Descripción (Opcional)</Label>
                    <Textarea
                        id="saleDescription"
                        name="saleDescription"
                        value={saleDescription}
                        onChange={(e) => setSaleDescription(e.target.value)}
                        placeholder="Detalles específicos del tramo, como ubicación o características especiales..."
                        className="border-border focus:border-foreground transition-colors min-h-[80px] resize-none"
                    />
                </div>

                {/* Resultados del Cálculo */}
                <div className="space-y-1.5 pt-4">
                    <Label className="text-sm font-medium">Materiales Calculados</Label>
                    {calculatedItems.length > 0 ? (
                        <div className="border rounded-md p-4 space-y-2 bg-muted/30">
                            {calculatedItems.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <span>{item.item_label || item.item_key}</span>
                                    <span className="font-medium">
                                        {item.item_value} {item.item_unit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border border-dashed rounded-md p-8 text-center text-muted-foreground flex flex-col justify-center items-center min-h-[150px]">
                            <Calculator className="mx-auto h-8 w-8 mb-2" />
                            <p>Los materiales calculados aparecerán aquí.</p>
                            <p className="text-xs">Ingresa altura, longitud y presiona "Calcular".</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="flex-1 h-11"
                    >
                        Cancelar
                    </Button>
                    <SubmitButton />
                </div>
            </form>
        </div>
    );
}