'use client';

import { useActionState, useEffect, useState, useTransition, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Save, XCircle, Calculator, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ActionResponse } from '@/lib/schemas/orders';
import { CalculatedItem, SaleForEditPageProps } from '@/lib/schemas/sales'; // Use SaleForEditPageProps for props
import { updateSale, calculateSaleItems } from '@/app/dashboard/sales/actions'; // Usar updateSale
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

// Estado inicial
const initialState: ActionResponse = { success: false, message: '' }; // Keep this as ActionResponse

interface EditSaleFormProps {
    sale: SaleForEditPageProps; // Use the new type here
    availableHeights: number[];
}

// Botón de envío
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="h-11 px-6 bg-foreground hover:bg-foreground/90 text-background" disabled={pending}>
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando Cambios...</> : <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>}
        </Button>
    );
}

export function EditSaleForm({ sale, availableHeights }: EditSaleFormProps) {
    const router = useRouter();
    // Usar la acción 'updateSale'
    const [finalState, finalFormAction] = useActionState(updateSale, initialState);

    // Estados locales inicializados con los datos de la venta existente
    const [selectedHeight, setSelectedHeight] = useState<string>(String(sale.height ?? '')); // Usar nullish coalescing
    const [length, setLength] = useState<string>(String(sale.length ?? '')); // Usar nullish coalescing
    const [saleDescription, setSaleDescription] = useState<string>(sale.sale_description ?? ''); // Estado para descripción, asegurar que es string
    const [calculatedItems, setCalculatedItems] = useState<CalculatedItem[]>([]);
    const [calculationError, setCalculationError] = useState<string | null>(null);
    const [isCalculating, startCalculationTransition] = useTransition();

    // Efecto para la respuesta de 'updateSale'
    useEffect(() => {
        if (!finalState.message) return;
        if (finalState.success) {
            toast.success(finalState.message);
            // Redirigir a la lista de ventas después de editar
            const timer = setTimeout(() => router.push('/dashboard/sales'), 1500);
            return () => clearTimeout(timer);
        } else {
            toast.error(finalState.message || "Error al guardar cambios.");
        }
    }, [finalState, router]);

    // Parseo seguro de altura y longitud
    const currentHeight = useMemo(() => parseFloat(selectedHeight), [selectedHeight]);
    const currentLength = useMemo(() => parseFloat(length), [length]);

    // Función de cálculo (igual que en CreateSaleForm)
    const handleCalculate = () => {
        if (isNaN(currentHeight) || currentHeight <= 0 || isNaN(currentLength) || currentLength <= 0) {
            setCalculationError('Seleccione altura e ingrese longitud positiva.');
            setCalculatedItems([]);
            return;
        }
        setCalculationError(null);
        startCalculationTransition(async () => {
            // Usar el order_id de la venta
            if (sale.order_id === null) {
                setCalculationError('ID de pedido no encontrado para el cálculo.');
                setCalculatedItems([]);
                return;
            }
            const orderIdForCalculation: string = sale.order_id;
            const result = await calculateSaleItems(orderIdForCalculation, currentHeight, currentLength);

            if (result.success && result.items) {
                setCalculatedItems(result.items);
                setCalculationError(null);
            } else {
                setCalculatedItems([]);
                setCalculationError(result.message || 'Error al calcular los materiales.');
                toast.error(result.message || 'No se pudieron recalcular los materiales.');
            }
        });
    };

    // Calcular al montar y cuando cambien los inputs
    useEffect(() => {
        if (selectedHeight && length && !isNaN(currentHeight) && !isNaN(currentLength) && currentHeight > 0 && currentLength > 0) {
            handleCalculate();
        } else {
            setCalculatedItems([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedHeight, length, sale.order_id]);

    const finalErrors = finalState.fieldErrors || {};

    return (
        <form action={finalFormAction} className="space-y-6">
            {/* IDs ocultos para la acción */}
            <input type="hidden" name="saleId" value={sale.id} />
            <input type="hidden" name="orderId" value={sale.order_id || ""} />
            <input type="hidden" name="height" value={isNaN(currentHeight) ? '' : currentHeight.toString()} />
            <input type="hidden" name="length" value={isNaN(currentLength) ? '' : currentLength.toString()} />
            <input type="hidden" name="saleDescription" value={saleDescription} />

            {/* Inputs: Height (Select) y Length */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-accent/30 border border-border/50">
                <div className="space-y-2">
                    <Label htmlFor="heightSelect" className="text-sm font-semibold flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-primary" />
                        Altura seleccionada (m)
                    </Label>
                    <Select name="heightSelectInternal" required value={selectedHeight} onValueChange={setSelectedHeight} >
                        <SelectTrigger className="bg-background/50 border-border/60 focus:ring-primary">
                            <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableHeights.map(h => <SelectItem key={h} value={String(h)}>{h} m</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {finalErrors.height && <p className="text-xs text-destructive mt-1 font-medium">{finalErrors.height}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="lengthInput" className="text-sm font-semibold flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-primary" />
                        Longitud del tramo (ml)
                    </Label>
                    <Input
                        id="lengthInput"
                        name="lengthInputInternal"
                        type="number"
                        step="0.01"
                        required
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="bg-background/50 border-border/60 focus:ring-primary"
                    />
                    {finalErrors.length && <p className="text-xs text-destructive mt-1 font-medium">{finalErrors.length}</p>}
                </div>
            </div>

            {/* Error de Cálculo si existe */}
            {calculationError && (
                <div className="text-sm text-destructive p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                    <XCircle className="h-4 w-4" />
                    {calculationError}
                </div>
            )}

            {/* Resultados Calculados - Diseño Premium */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Materiales Calculados</h3>
                {isCalculating ? (
                    <div className="border border-dashed border-primary/30 rounded-xl p-8 text-center bg-primary/5 animate-pulse">
                        <Loader2 className="mx-auto h-8 w-8 mb-2 animate-spin text-primary" />
                        <p className="text-sm font-medium text-primary">Recalculando materiales...</p>
                    </div>
                ) : calculatedItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <div className="border border-dashed rounded-xl p-8 text-center text-muted-foreground bg-muted/20">
                        <Calculator className="mx-auto h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm">Ingresa valores para ver el desglose de materiales.</p>
                    </div>
                )}
            </div>

            {/* Descripción (Editable) */}
            <div className="space-y-2 pt-2">
                <Label htmlFor="saleDescriptionEdit" className="text-sm font-semibold">Notas y Observaciones</Label>
                <Textarea
                    id="saleDescriptionEdit"
                    placeholder="Detalles específicos del tramo..."
                    value={saleDescription}
                    onChange={(e) => setSaleDescription(e.target.value)}
                    className="min-h-[100px] bg-background/50 border-border/60 focus:ring-primary resize-none"
                />
                {finalErrors.saleDescription && <p className="text-xs text-destructive mt-1 font-medium">{finalErrors.saleDescription}</p>}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border/60">
                <Button type="button" variant="outline" onClick={() => router.back()} className="h-11 px-8 hover:bg-accent/50">
                    Cancelar
                </Button>
                <SubmitButton />
            </div>
        </form>
    );
}