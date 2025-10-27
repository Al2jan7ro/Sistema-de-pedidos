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
            if (sale.order_id === null) { // Explicitly check for null
                setCalculationError('ID de pedido no encontrado para el cálculo.');
                setCalculatedItems([]);
                return;
            }
            const orderIdForCalculation: string = sale.order_id; // Capture and assert type
            const result = await calculateSaleItems(orderIdForCalculation, currentHeight, currentLength);
            if (result.success && result.items) { /* ... setCalculatedItems ... */ }
            else { /* ... setCalculationError ... */ }
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
    }, [selectedHeight, length, sale.order_id]); // Depender del order_id de la prop

    const finalErrors = finalState.fieldErrors || {};

    return (
        <form action={finalFormAction} className="space-y-6">
            {/* IDs ocultos para la acción */}
            <input type="hidden" name="saleId" value={sale.id} />
            <input type="hidden" name="orderId" value={sale.order_id} />
            {/* Pasar height y length finales */}
            <input type="hidden" name="height" value={isNaN(currentHeight) ? '' : currentHeight.toString()} />
            <input type="hidden" name="length" value={isNaN(currentLength) ? '' : currentLength.toString()} />
            {/* Pasar descripción actualizada */}
            <input type="hidden" name="saleDescription" value={saleDescription} />


            {/* Display de Error General */}
            {/* ... (Igual que en Create) ... */}

            {/* Inputs: Height (Select) y Length */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="heightSelect" className="text-sm font-medium">Altura (m) *</Label>
                    <Select name="heightSelectInternal" required value={selectedHeight} onValueChange={setSelectedHeight} >
                        <SelectTrigger> <SelectValue placeholder="Seleccione..." /> </SelectTrigger>
                        <SelectContent>
                            {availableHeights.map(h => <SelectItem key={h} value={String(h)}>{h} m</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {finalErrors.height && <p className="text-xs text-red-600 mt-1">{finalErrors.height}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="lengthInput" className="text-sm font-medium">Longitud (ml) *</Label>
                    <Input id="lengthInput" name="lengthInputInternal" type="number" step="0.1" required value={length} onChange={(e) => setLength(e.target.value)} />
                    {finalErrors.length && <p className="text-xs text-red-600 mt-1">{finalErrors.length}</p>}
                </div>
            </div>

            {/* Indicador de Cálculo y Error */}
            {/* ... (Igual que en Create) ... */}

            {/* Resultados Calculados */}
            {calculatedItems.length > 0 && !isCalculating && (
                <div className="mt-6 space-y-3">
                    {/* ... (Mostrar lista de calculatedItems - Igual que en Create) ... */}
                </div>
            )}

            {/* Descripción (Editable) */}
            <div className="space-y-1.5 pt-4">
                <Label htmlFor="saleDescriptionEdit" className="text-sm font-medium">Descripción</Label>
                <Textarea
                    id="saleDescriptionEdit"
                    // name="saleDescription" // Ya se pasa por input oculto
                    placeholder="Detalles específicos..."
                    value={saleDescription} // Controlado por estado local
                    onChange={(e) => setSaleDescription(e.target.value)} // Actualizar estado local
                    className="min-h-[70px]"
                />
                {finalErrors.saleDescription && <p className="text-xs text-red-600 mt-1">{finalErrors.saleDescription}</p>}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                <SubmitButton />
            </div>
        </form>
    );
}