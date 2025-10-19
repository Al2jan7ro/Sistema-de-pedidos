
import { ClientForm } from '@/components/clients/client-form'; // Crearemos esto en el siguiente paso

// Página de creación (Server Component)
export default function CreateClientPage() {
    return (
        <div className="space-y-6">
            <ClientForm formType="create" />
        </div>
    );
}