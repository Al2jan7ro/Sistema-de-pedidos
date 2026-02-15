"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Bar,
    BarChart,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Package, ShoppingCart, Users, Clock } from "lucide-react"
import { DashboardData } from "@/data/dashboard"
import Image from "next/image"

interface DashboardProps {
    data: DashboardData
}

export function Dashboard({ data }: DashboardProps) {
    const { metrics, monthlySales, weeklyOrders, statusDistribution } = data;

    return (
        <div className="w-full space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-2">
                <Image src="/assets/gaviotylogo.png" alt="Logo" width={120} height={120} />

                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Gavioty Solutions - Sistema de Pedidos</p>
                </div>
            </div>

            {/* Métricas principales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.totalOrders.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Órdenes totales</p>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas (Metros)</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.totalLengthSold.toLocaleString()}m</div>
                        <p className="text-xs text-muted-foreground mt-1">Longitud total</p>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas Realizadas</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.totalSalesCount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Conteo de ventas</p>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.activeClients.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Último año</p>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos Pendientes</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.pendingOrders.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Gráfico de ventas mensuales */}
                <Card className="col-span-4 border-border shadow-md">
                    <CardHeader>
                        <CardTitle>Rendimiento Mensual (Longitud)</CardTitle>
                        <CardDescription>Metros vendidos en los últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer
                            config={{
                                sales: {
                                    label: "Metros",
                                    color: "hsl(var(--foreground))",
                                },
                            }}
                            className="h-[300px]"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlySales}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="hsl(var(--foreground))"
                                        strokeWidth={2}
                                        dot={{ fill: "hsl(var(--foreground))", r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Gráfico de estado de pedidos */}
                <Card className="col-span-3 border-border shadow-md">
                    <CardHeader>
                        <CardTitle>Estado de Pedidos</CardTitle>
                        <CardDescription>Distribución por estado</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                completed: {
                                    label: "Completados",
                                    color: "oklch(0.6 0.118 184.704)",
                                },
                                pending: {
                                    label: "Pendientes",
                                    color: "oklch(0.828 0.189 84.429)",
                                },
                                cancelled: {
                                    label: "Cancelados",
                                    color: "oklch(0.398 0.07 227.392)",
                                },
                            }}
                            className="h-[300px]"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Pie
                                        data={statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="hsl(var(--foreground))"
                                        dataKey="value"
                                    >
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <div className="mt-4 space-y-2">
                            {statusDistribution.filter(item => item.value > 0).map((item, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-muted-foreground">{item.name}</span>
                                    </div>
                                    <span className="font-medium">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico de pedidos semanales */}
            <Card className="border-border shadow-md">
                <CardHeader>
                    <CardTitle>Pedidos de la Semana</CardTitle>
                    <CardDescription>Cantidad de pedidos realizados por día</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ChartContainer
                        config={{
                            orders: {
                                label: "Pedidos",
                                color: "hsl(var(--foreground))",
                            },
                        }}
                        className="h-[300px]"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyOrders}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="orders" fill="hsl(var(--foreground))" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}