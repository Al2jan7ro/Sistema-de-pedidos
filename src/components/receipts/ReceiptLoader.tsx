'use client';

import dynamic from 'next/dynamic';
import { ReceiptData } from './ReceiptView';
import { Loader2 } from 'lucide-react';

const ReceiptView = dynamic(
    () => import('./ReceiptView').then((mod) => mod.ReceiptView),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <p>Cargando vista previa del recibo...</p>
            </div>
        ),
    }
);

export function ReceiptLoader({ data }: { data: ReceiptData }) {
    return <ReceiptView data={data} />;
}