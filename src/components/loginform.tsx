"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
import { useState } from "react"
// No es necesario importar FaGoogle porque estás usando un SVG inline.

export function LoginForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);

        // 1. Inicializar el cliente de Supabase (browser)
        const supabase = createClient();

        // 2. Iniciar el flujo de autenticación de Google OAuth
        const { error: signInError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // El `redirectTo` debe apuntar a la ruta de callback que crearemos
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (signInError) {
            console.error("Error al iniciar sesión con Google:", signInError);
            setError("Error al iniciar sesión con Google. Inténtalo de nuevo.");
            setLoading(false); // Detener la carga si falla antes de la redirección
        }
        // Si es exitoso, Supabase automáticamente redirige a Google.
    }

    return (
        <Card className="w-full max-w-md mx-4 border-border shadow-lg">
            <CardHeader className="space-y-3 text-center pb-8">
                <div className="flex justify-center mb-2">
                    <img
                        src="/assets/gaviotylogo.png"
                        alt="Logo de la empresa Gavioty Pro solutions"
                        width={200}
                        height={200}
                    />
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight">Gavioty Solutions</CardTitle>
                <CardDescription className="text-base text-muted-foreground">Sistema de Gestión de Pedidos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
                {/* Mensaje de Error (Estilo Shadcn/Tailwind) */}
                {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <Button
                        onClick={handleGoogleLogin}
                        disabled={loading} // Deshabilitar durante el proceso
                        className="w-full h-12 text-base font-medium bg-foreground hover:bg-foreground/90 text-background transition-all duration-200 hover:shadow-md"
                        size="lg"
                    >
                        {loading ? (
                            // Spinner de carga (Añadido para mejor UX)
                            <span className="animate-spin h-5 w-5 border-t-2 border-white rounded-full mr-3"></span>
                        ) : (
                            // Icono original
                            <svg
                                className="mr-3 h-5 w-5"
                                aria-hidden="true"
                                focusable="false"
                                data-prefix="fab"
                                data-icon="google"
                                role="img"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 488 512"
                            >
                                <path
                                    fill="currentColor"
                                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                                ></path>
                            </svg>
                        )}
                        {loading ? "Redirigiendo a Google..." : "Iniciar sesión con Google"}
                    </Button>
                </div>

                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Accede de forma segura con tu cuenta de Google</p>
                </div>
            </CardContent>
        </Card>
    )
}