import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Componente para la página de error de acceso no autorizado
export default function UnauthorizedPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen
         bg-gray-50 text-gray-800">
            <div className="bg-white p-10 rounded-xl shadow-2xl max-w-lg w-full text-center">
                <div className="text-9xl font-extrabold text-gray-200 mb-4">403</div>
                <h1 className="text-4xl font-bold mb-3">Acceso Denegado</h1>
                <p className="text-lg mb-8 text-gray-600">
                    Tu cuenta de Google ha sido autenticada, pero no tiene un perfil interno ni un rol asignado en el sistema Gavioty.
                </p>
                <p className="text-md mb-8 font-semibold">
                    Solo el personal autorizado puede acceder.
                </p>
                <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-3 border 
                    border-transparent text-base font-medium rounded-lg shadow-sm text-white
                     bg-black hover:bg-gray-800 transition duration-150 ease-in-out"
                >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Volver a Iniciar Sesión
                </Link>
                <p className="mt-5 text-sm text-gray-400">
                    Si crees que esto es un error, contacta a tu administrador.
                </p>
            </div>
        </div>
    );
}
