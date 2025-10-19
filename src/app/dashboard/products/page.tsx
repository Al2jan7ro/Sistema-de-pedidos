import { createClient } from '@/utils/supabase/server';
import { Product } from '@/lib/schemas/product';
import { redirect } from 'next/navigation';
import { ProductListTable } from '@/components/products/ProductListTable';

// Función Server Component para obtener los productos
async function fetchProducts(): Promise<Product[]> {
    const supabase = await createClient();

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, description, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return products as Product[];
}

// Función Server Component para obtener el rol del usuario
async function getUserRole(): Promise<string> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase.rpc('get_user_role');

    if (error) {
        console.error('Error fetching user role:', error);
        return 'user';
    }

    return data || 'user';
}

export default async function ProductsPage() {
    const [products, userRole] = await Promise.all([
        fetchProducts(),
        getUserRole()
    ]);

    const isAdmin = userRole === 'admin';
    const isSolicitante = userRole === 'solicitante';

    // 💥 CORRECCIÓN DE LÓGICA: Separamos permisos
    const canMutate = isAdmin;
    const canCreate = isAdmin || isSolicitante;

    return (
        <>
            {/* 💥 Pasamos ambos permisos a la tabla */}
            <ProductListTable products={products} canMutate={canMutate} canCreate={canCreate} />
        </>
    );
}