'use client';

import { useActionState, useEffect, useState, useTransition, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Save, XCircle, Calculator, Ruler } from 'lucide-react'; // Added Ruler icon
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
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

// Initial state
const initialState: ActionResponse = { success: false, message: '' };

interface CreateSaleFormProps {
    orderId: string;
    productUnitTable: string; // Pass the unit table name determined on the server page
    availableHeights: number[]; // Pass the available heights for the Select
}

// Submit button
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            className="flex-1 h-9 text-sm font-medium transition-all duration-200"
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
                    Registrar Venta (Tramo)
                </>
            )}
        </Button>
    );
}

export function CreateSaleForm({ orderId, productUnitTable, availableHeights }: CreateSaleFormProps) {
    const router = useRouter();
    const [finalState, finalFormAction] = useActionState(createSale, initialState);
    // Use string for Select state, parse later
    const [selectedHeight, setSelectedHeight] = useState<string>('');
    const [length, setLength] = useState('');
    const [calculatedItems, setCalculatedItems] = useState<CalculatedItem[]>([]);
    const [calculationError, setCalculationError] = useState<string | null>(null);
    const [isCalculating, startCalculationTransition] = useTransition();

    // Effect for final save response
    useEffect(() => {
        if (!finalState.message) return;
        if (finalState.success) {
            toast.success(finalState.message);
            const timer = setTimeout(() => router.push('/dashboard/orders'), 1500);
            return () => clearTimeout(timer);
        } else {
            toast.error(finalState.message || "Ocurrió un error al guardar.");
        }
    }, [finalState, router]);

    // Parse height and length safely
    const currentHeight = useMemo(() => parseFloat(selectedHeight), [selectedHeight]);
    const currentLength = useMemo(() => parseFloat(length), [length]);

    // Function to call calculation action
    const handleCalculate = () => {
        // Use parsed numeric values
        if (isNaN(currentHeight) || currentHeight <= 0 || isNaN(currentLength) || currentLength <= 0) {
            setCalculationError('Seleccione una altura e ingrese una longitud positiva.');
            setCalculatedItems([]);
            return;
        }
        setCalculationError(null);

        startCalculationTransition(async () => {
            // Pass numeric values to the action
            const result = await calculateSaleItems(orderId, currentHeight, currentLength);
            if (result.success && result.items) {
                setCalculatedItems(result.items);
                setCalculationError(null);
            } else {
                setCalculatedItems([]);
                setCalculationError(result.message || 'Error al calcular.');
                toast.error(result.message || 'No se pudieron calcular los materiales.');
            }
        });
    };

    // Recalculate when valid height and length change
    useEffect(() => {
        if (selectedHeight && length && !isNaN(currentHeight) && !isNaN(currentLength) && currentHeight > 0 && currentLength > 0) {
            handleCalculate();
        } else {
            setCalculatedItems([]); // Clear results if inputs are invalid/empty
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedHeight, length, orderId]); // Re-run calculation when these change

    const finalErrors = finalState.fieldErrors || {};

    return (
        <form action={finalFormAction} className="space-y-6">
            <input type="hidden" name="orderId" value={orderId} />
            {/* Pass selected numeric height to final action */}
            <input
                type="hidden"
                name="height"
                value={isNaN(currentHeight) ? '' : currentHeight.toString()}
            />
            <input
                type="hidden"
                name="length"
                value={isNaN(currentLength) ? '' : currentLength.toString()}
            />

            {/* General Error Display */}
            {finalState.message && !finalState.success && !finalState.fieldErrors && (
                <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200" role="alert">
                    <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <div><span className="font-medium">Error al guardar:</span> {finalState.message}</div>
                </div>
            )}


            {/* Inputs: Height (Select) and Length (Input) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* --- HEIGHT SELECT --- */}
                <div className="space-y-1.5">
                    <Label htmlFor="heightSelect" className="text-sm font-medium text-gray-700 flex items-center">
                        Altura (m) *
                    </Label>
                    <Select
                        name="heightSelectInternal" // Internal name, value passed via hidden input
                        required
                        value={selectedHeight}
                        onValueChange={setSelectedHeight} // Update local state on change
                        disabled={availableHeights.length === 0}
                    >
                        <SelectTrigger className=" border-border focus:ring-primary focus:border-primary w-full ">
                            <SelectValue placeholder="Seleccione Altura..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableHeights.length > 0 ? (
                                availableHeights.map(h => (
                                    <SelectItem key={h} value={String(h)}>
                                        {h} m
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm text-muted-foreground">
                                    No hay alturas disponibles
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                    {/* Display validation error for height from final action */}
                    {finalErrors.height && <p className="text-xs text-red-600 mt-1">{finalErrors.height}</p>}
                </div>
                {/* --- LENGTH INPUT --- */}
                <div className="space-y-1.5">
                    <Label htmlFor="lengthInput" className="text-sm font-medium text-gray-700">Longitud (ml) *</Label>
                    <Input
                        id="lengthInput"
                        name="lengthInputInternal" // Internal name
                        type="number"
                        step="0.1"
                        placeholder="Ej: 20"
                        required
                        value={length}
                        onChange={(e) => setLength(e.target.value)} // Update local state
                        className="border-border focus:ring-primary focus:border-primary"
                        aria-invalid={!!finalErrors.length}
                    />
                    {finalErrors.length && <p className="text-xs text-red-600 mt-1">{finalErrors.length}</p>}
                </div>
            </div>

            {/* Calculation Indicator & Error */}
            {isCalculating && (
                <div className="flex items-center text-sm text-gray-600">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando materiales...
                </div>
            )}
            {calculationError && !isCalculating && (
                <div className="flex items-center text-sm text-red-600">
                    <XCircle className="mr-2 h-4 w-4" /> {calculationError}
                </div>
            )}

            {/* Calculated Items Display */}
            {calculatedItems.length > 0 && !isCalculating && (
                <div className=" space-y-1">
                    <Separator />
                    <h3 className="text-md font-semibold text-gray-800 flex items-center">
                        Materiales Calculados
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm border p-4 rounded-md bg-muted/20">
                        {calculatedItems.map(item => (
                            <div key={item.item_key}>
                                <span className="font-medium text-gray-700">{item.item_label || item.item_key}:</span>{' '}
                                <span className="text-gray-900">{item.item_value}</span>{' '}
                                <span className="text-muted-foreground">{item.item_unit}</span>
                            </div>
                        ))}
                    </div>
                    <Separator />
                </div>
            )}

            {/* Optional Description */}
            <div className="space-y-1">
                <Label htmlFor="saleDescription" className="text-sm font-medium text-gray-700">
                    Descripción <span className="text-xs text-muted-foreground">(Opcional)</span>
                </Label>
                <Textarea
                    id="saleDescription"
                    name="saleDescription"
                    placeholder="Detalles específicos de este tramo..."
                    className="min-h-[70px]"
                />
                {finalErrors.saleDescription && (
                    <p className="text-xs text-red-600 mt-1">{finalErrors.saleDescription}</p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-9 text-sm font-medium border-border hover:bg-muted transition-all duration-200 bg-transparent"
                    asChild
                >
                    <Link href="/dashboard/orders">
                        Cancelar
                    </Link>
                </Button>
                <SubmitButton />

            </div>
        </form>
    );
}