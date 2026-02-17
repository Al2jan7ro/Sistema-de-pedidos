import { MaterialsManager } from "@/components/materials/MaterialsManager";

export const metadata = {
    title: "Gestión de Materiales | Gavioty Solutions",
    description: "Administra las tablas de materiales del sistema de pedidos.",
};

export default function MaterialsPage() {
    return (
        <div className="w-full space-y-6">
            <MaterialsManager />
        </div>
    );
}
