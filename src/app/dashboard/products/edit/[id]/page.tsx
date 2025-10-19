import { createClient } from '@/utils/supabase/server';
import { Product } from '@/lib/schemas/product';
import { notFound } from 'next/navigation';

// 💥 Importamos el componente de formulario
import { EditProductForm } from '@/components/products/EditProductForm';

// Función Server Component para obtener un producto por ID
async function GetProduct(productId: string): Promise<Product | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('products')
        .select('id, name, description, created_at')
        .eq('id', productId)
        .single();

    if (error) {
        console.error('Error fetching product for edit:', error);
        return null;
    }

    return data as Product;
}

interface EditPageProps {
    params: {
        id: string; // El ID del producto a editar
    };
}

export default async function EditProductPage({ params }: EditPageProps) {

    const { id: productId } = await params;

    const productsData = await GetProduct(productId);

    if (!productsData) {
        notFound();
    }

    return (
        <>

            {/* 💥 Usamos el componente de formulario aquí */}
            <EditProductForm product={productsData} />
        </>
    );
}