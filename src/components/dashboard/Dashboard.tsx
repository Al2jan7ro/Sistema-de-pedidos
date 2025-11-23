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

// Datos de ejemplo para los gráficos
const salesData = [
    { month: "Ene", sales: 4500 },
    { month: "Feb", sales: 5200 },
    { month: "Mar", sales: 4800 },
    { month: "Abr", sales: 6100 },
    { month: "May", sales: 7200 },
    { month: "Jun", sales: 6800 },
]

const ordersData = [
    { day: "Lun", orders: 45 },
    { day: "Mar", orders: 52 },
    { day: "Mié", orders: 48 },
    { day: "Jue", orders: 61 },
    { day: "Vie", orders: 72 },
    { day: "Sáb", orders: 38 },
    { day: "Dom", orders: 29 },
]

const statusData = [
    { name: "Completados", value: 156, color: "oklch(0.6 0.118 184.704)" },
    { name: "Pendientes", value: 43, color: "oklch(0.828 0.189 84.429)" },
    { name: "En Proceso", value: 28, color: "oklch(0.398 0.07 227.392)" },
]

export function Dashboard() {
    return (
        <div className="w-full space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-2">
                <img src="/assets/gaviotylogo.png" alt="Logo" width="120" height="120" />

                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Gavioty Solutions - Sistema de Pedidos</p>
                </div>
            </div>

            {/* Métricas principales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">1,284</div>
                        <p className="text-xs text-muted-foreground mt-1">+12.5% desde el mes pasado</p>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">$34,600</div>
                        <p className="text-xs text-muted-foreground mt-1">+8.2% desde el mes pasado</p>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">573</div>
                        <p className="text-xs text-muted-foreground mt-1">+24 nuevos este mes</p>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos Pendientes</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">43</div>
                        <p className="text-xs text-muted-foreground mt-1">-5 desde ayer</p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Gráfico de ventas mensuales */}
                <Card className="col-span-4 border-border shadow-md">
                    <CardHeader>
                        <CardTitle>Ventas Mensuales</CardTitle>
                        <CardDescription>Evolución de ventas en los últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer
                            config={{
                                sales: {
                                    label: "Ventas",
                                    color: "hsl(var(--foreground))",
                                },
                            }}
                            className="h-[300px]"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={salesData}>
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
                        <CardDescription>Distribución actual de pedidos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                completed: {
                                    label: "Completados",
                                    color: "hsl(var(--chart-2))",
                                },
                                pending: {
                                    label: "Pendientes",
                                    color: "hsl(var(--chart-4))",
                                },
                                processing: {
                                    label: "En Proceso",
                                    color: "hsl(var(--chart-3))",
                                },
                            }}
                            className="h-[300px]"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Pie
                                        data={statusData}
                                        cx="30%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="hsl(var(--foreground))"
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <div className="mt-4 space-y-2">
                            {statusData.map((item, index) => (
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
                            <BarChart data={ordersData}>
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