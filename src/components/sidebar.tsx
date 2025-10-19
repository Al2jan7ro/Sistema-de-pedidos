"use client"

import * as React from "react"
import Link from "next/link"
import {
    LayoutDashboard,
    ShoppingCart,
    TrendingUp,
    Package,
    Users,
    UserCircle,
    LogOut,
    ChevronRight,
    Menu,
    Briefcase, // Icono para Clientes
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// INTERFACE: Ahora acepta las props de usuario del servidor
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultCollapsed?: boolean
    userRole: string
    userName: string
    userEmail: string
    userInitial: string
}

// 1. DEFINICIÓN DE ENLACES CON RESTRICCIÓN DE ROL
const allMenuItems = [
    {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        adminOnly: false, // Todos
    },
    // Añadimos Clientes aquí, es accesible por todos
    {
        title: "Clientes",
        icon: Briefcase,
        href: "/dashboard/clients",
        adminOnly: false, // Todos
    },
    {
        title: "Pedidos",
        icon: ShoppingCart,
        href: "/dashboard/orders",
        adminOnly: false, // Todos
    },
    // Elementos Exclusivos del Administrador (Regla 2.3)
    {
        title: "Productos",
        icon: Package,
        href: "/dashboard/products",
        adminOnly: true, // Solo Admin
    },
    {
        title: "Ventas y Recibos",
        icon: TrendingUp,
        href: "/dashboard/sales",
        adminOnly: true, // Solo Admin
    },
    {
        title: "Gestión Usuarios",
        icon: Users,
        href: "/dashboard/users",
        adminOnly: true, // Solo Admin
    },
]

const accountItems = [
    {
        title: "Mi cuenta",
        icon: UserCircle,
        href: "/dashboard/account",
        variant: "default" as const,
    },
    // El item de Cerrar Sesión debe ser un formulario (POST) para seguridad
    {
        title: "Cerrar sesión",
        icon: LogOut,
        href: "/auth/signout",
        variant: "destructive" as const,
        isLogout: true, // Flag para usar formulario
    },
]

export function AppSidebar({
    className,
    defaultCollapsed = false,
    userRole,
    userName,
    userEmail,
    userInitial
}: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
    const [isMobileOpen, setIsMobileOpen] = React.useState(false)

    // 2. FILTRADO DE ENLACES BASADO EN EL ROL
    const menuItems = allMenuItems.filter(item =>
        !item.adminOnly || userRole === 'admin'
    );

    const commonLinkClasses = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground";


    return (
        <>
            {/* Mobile Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed left-4 top-4 z-50 lg:hidden"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed lg:sticky left-0 top-0 z-40 h-screen border-r border-border bg-background transition-all duration-300",
                    isCollapsed ? "w-16" : "w-64",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                    className,
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex h-16 items-center justify-between border-b border-border px-4">
                        {!isCollapsed && <img src="/assets/gaviotylogo.png" alt="Logo" width="120" height="120" />}

                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 overflow-y-auto p-2">
                        {/* Main Menu Items */}
                        <div className="space-y-1">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        commonLinkClasses,
                                        isCollapsed && "justify-center",
                                    )}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    {!isCollapsed && <span>{item.title}</span>}
                                </Link>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="my-4 border-t border-border" />

                        {/* Account Items */}
                        <div className="space-y-1">
                            {accountItems.map((item) => {
                                // 3. Lógica para Cerrar Sesión (Usar Formulario POST)
                                if (item.isLogout) {
                                    return (
                                        <form
                                            key={item.href}
                                            action={item.href}
                                            method="POST" // IMPORTANTE: Usa POST para la ruta de servidor de logout
                                            className={cn(isCollapsed && "flex justify-center", !isCollapsed && "px-3")}
                                        >
                                            <button
                                                type="submit"
                                                className={cn(
                                                    commonLinkClasses,
                                                    "w-full justify-start",
                                                    item.variant === "destructive" ? "text-destructive hover:bg-destructive/10" : "",
                                                    isCollapsed && "justify-center px-0",
                                                )}
                                                // Ajuste para el botón colapsado
                                                style={isCollapsed ? { width: '40px' } : undefined}
                                            >
                                                <item.icon className="h-5 w-5 shrink-0" />
                                                {!isCollapsed && <span className="ml-0">Cerrar sesión</span>}
                                            </button>
                                        </form>
                                    );
                                }

                                // Enlaces normales de la cuenta
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            commonLinkClasses,
                                            item.variant === "destructive"
                                                ? "text-destructive hover:bg-destructive/10"
                                                : "text-foreground",
                                            isCollapsed && "justify-center",
                                        )}
                                    >
                                        <item.icon className="h-5 w-5 shrink-0" />
                                        {!isCollapsed && <span>{item.title}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Footer with User Info and Collapse Button */}
                    <div className="border-t border-border">
                        {/* 4. USER INFO DINÁMICO */}
                        {!isCollapsed && (
                            <div className="flex items-center gap-3 p-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <span className="text-xs font-semibold">{userInitial}</span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate text-sm font-medium">{userName}</p>
                                    <p className="truncate text-xs text-muted-foreground uppercase">{userRole}</p>
                                    <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                                </div>
                            </div>
                        )}

                        {/* Collapse Button */}
                        <div className="hidden border-t border-border p-2 lg:block">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => setIsCollapsed(!isCollapsed)}
                            >
                                <ChevronRight className={cn("h-4 w-4 transition-transform", isCollapsed ? "" : "rotate-180")} />
                                {!isCollapsed && <span className="ml-2">Contraer</span>}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}