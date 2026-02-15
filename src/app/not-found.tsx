import Link from "next/link"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
    return (
        <div className="min-h-screen w-full bg-white white-section flex items-center justify-center px-6">
            <div className="container mx-auto">
                <div className="max-w-3xl mx-auto text-center">


                    {/* Large 404 number with architectural style */}
                    <div className="relative mb-12">
                        <h1 className="text-[12rem] md:text-[16rem] lg:text-[20rem] font-light tracking-tighter leading-none text-foreground/5 select-none">
                            404
                        </h1>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-6 text-balance">
                                    Página no encontrada
                                </h2>
                                <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-xl mx-auto">
                                    La pagina que buscas no existe dentro de nuestro sistema.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-16">
                        <Link href="/login">
                            <Button
                                size="lg"
                                className="group bg-foreground text-background hover:bg-foreground/90 transition-all duration-300"
                            >
                                <Home className="mr-2 h-4 w-4" />
                                Volver al inicio
                            </Button>
                        </Link>

                    </div>


                    {/* Decorative line */}
                    <div className="flex items-center justify-center gap-4 mt-10">
                        <div className="h-px w-20 bg-border" />
                        <span className="text-sm font-light tracking-widest text-muted-foreground uppercase">Error 404</span>
                        <div className="h-px w-20 bg-border" />
                    </div>
                </div>
            </div>
        </div>
    )
}