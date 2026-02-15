import { createServiceClient } from "@/utils/supabase/service";
import { format, startOfDay, startOfMonth, subDays, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import type { Tables } from "@/lib/database.types";

export interface DashboardMetrics {
    totalOrders: number;
    // Cambiado para reflejar que ahora sumamos la longitud
    totalLengthSold: number;
    totalSalesCount: number;
    activeClients: number;
    pendingOrders: number;
}

export interface MonthlySalesPoint {
    month: string;
    sales: number;
};


export interface WeeklyOrdersPoint {
    day: string;
    orders: number;
}

export interface StatusDistributionSlice {
    status: string;
    name: string;
    value: number;
    color: string;
}

export interface DashboardData {
    metrics: DashboardMetrics;
    monthlySales: MonthlySalesPoint[];
    weeklyOrders: WeeklyOrdersPoint[];
    statusDistribution: StatusDistributionSlice[];
    lastUpdated: string;
}

const MONTHS_RANGE = 6;
const WEEK_DAYS_RANGE = 7;
const ACTIVE_CLIENTS_WINDOW_DAYS = 365; // Aumentado a 1 año para mostrar datos reales de prueba

// Usamos los tipos de la base de datos para mayor consistencia
type OrderStatus = Tables<'orders'>['status'];

const ORDER_STATUS_PRIORITY: OrderStatus[] = ["Pendiente", "Completado", "Cancelado"];
const ORDER_STATUS_LABELS: Record<string, string> = {
    Pendiente: "Pendientes",
    Completado: "Completados",
    Cancelado: "Cancelados",
};
const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    Pendiente: "oklch(0.828 0.189 84.429)",
    Completado: "oklch(0.6 0.118 184.704)",
    Cancelado: "oklch(0.398 0.07 227.392)",
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const buildMonthlyBuckets = (reference: Date, length: number) => {
    const anchor = startOfMonth(reference);
    return Array.from({ length }, (_, index) => {
        const offset = length - index - 1;
        const date = subMonths(anchor, offset);
        return {
            key: `${date.getFullYear()}-${date.getMonth()}`,
            label: capitalize(format(date, "LLL", { locale: es })),
        };
    });
};

const buildWeeklyBuckets = (reference: Date, length: number) => {
    return Array.from({ length }, (_, index) => {
        const offset = length - index - 1;
        const date = startOfDay(subDays(reference, offset));
        return {
            key: date.toISOString().slice(0, 10),
            label: capitalize(format(date, "EEE", { locale: es })),
        };
    });
};

const emptyDashboardData = (): DashboardData => ({
    metrics: {
        totalOrders: 0,
        totalLengthSold: 0,
        totalSalesCount: 0,
        activeClients: 0,
        pendingOrders: 0,
    },
    monthlySales: buildMonthlyBuckets(new Date(), MONTHS_RANGE).map((bucket) => ({
        month: bucket.label,
        sales: 0,
    })),
    weeklyOrders: buildWeeklyBuckets(new Date(), WEEK_DAYS_RANGE).map((bucket) => ({
        day: bucket.label,
        orders: 0,
    })),
    statusDistribution: ORDER_STATUS_PRIORITY.map((status) => ({
        status,
        name: ORDER_STATUS_LABELS[status],
        value: 0, // `value` es el recuento
        color: ORDER_STATUS_COLORS[status],
    })),
    lastUpdated: new Date().toISOString(),
});

export async function fetchDashboardData(): Promise<DashboardData> {
    try {
        const supabase = createServiceClient();
        const now = new Date();
        const monthlyBuckets = buildMonthlyBuckets(now, MONTHS_RANGE);
        const weeklyBuckets = buildWeeklyBuckets(now, WEEK_DAYS_RANGE);
        const sixMonthsAgo = startOfMonth(subMonths(now, MONTHS_RANGE - 1));
        const weekStart = startOfDay(subDays(now, WEEK_DAYS_RANGE - 1));
        const clientsWindowStart = startOfDay(subDays(now, ACTIVE_CLIENTS_WINDOW_DAYS));

        const [
            { count: totalOrders, error: ordersError },
            { data: salesData, error: salesError },
            { count: pendingOrders, error: pendingOrdersError },
            { data: recentClientsData, error: recentClientsError },
            { data: weeklyOrdersData, error: weeklyOrdersError },
            { data: statusDistributionData, error: statusDistError },
        ] = await Promise.all([
            // 1. Total de Pedidos
            supabase.from("orders").select("id", { count: "exact", head: true }),

            // 2. Total de Ventas (ahora traemos longitud para sumar)
            supabase
                .from("sales")
                .select("length, created_at")
                .in("status", ["pending", "completed"]) // Status de ventas
                .gte("created_at", sixMonthsAgo.toISOString()),

            // 3. Pedidos Pendientes
            supabase
                .from("orders")
                .select("id", { count: "exact", head: true })
                .eq("status", "Pendiente"), // Status de pedidos

            // 4. Clientes Activos (obtenemos IDs de clientes de pedidos recientes)
            supabase
                .from("orders")
                .select("clients(id, status)")
                .gte("created_at", clientsWindowStart.toISOString()),

            // 5. Pedidos Semanales
            supabase
                .from("orders")
                .select("created_at")
                .gte("created_at", weekStart.toISOString()),

            // 6. Distribución de Estados (usando la función RPC)
            supabase
                .rpc('get_order_status_distribution')
                .select('status, status_count'),
        ]);

        // Manejo centralizado de errores
        const errors = [ordersError, salesError, pendingOrdersError, recentClientsError, weeklyOrdersError, statusDistError].filter(Boolean);
        if (errors.length > 0) {
            errors.forEach(error => console.error("Supabase fetch error:", error?.message));
            throw new Error(`Fallo al obtener datos del dashboard: ${errors.map(e => e?.message).join(', ')}`);
        }

        // --- Procesamiento de Métricas ---
        const totalLengthSold = salesData?.reduce((sum, sale) => sum + (sale.length ?? 0), 0) ?? 0;

        // Filtra clientes para asegurar que no sean nulos y estén activos
        const activeClientIds = new Set<string>();
        recentClientsData?.forEach(order => {
            const client = order.clients;
            if (client && client.status === 'Active') {
                activeClientIds.add(client.id);
            }
        });
        const activeClients = activeClientIds.size;

        // --- Procesamiento de Gráfico Semanal de Pedidos ---
        const weeklyCounts = Object.fromEntries(weeklyBuckets.map((bucket) => [bucket.key, 0]));
        weeklyOrdersData?.forEach((row) => {
            if (!row.created_at) return;
            const date = startOfDay(new Date(row.created_at));
            const key = date.toISOString().slice(0, 10);
            if (weeklyCounts[key] !== undefined) {
                weeklyCounts[key] += 1;
            }
        });
        const weeklyOrders: WeeklyOrdersPoint[] = weeklyBuckets.map((bucket) => ({
            day: bucket.label,
            orders: weeklyCounts[bucket.key] ?? 0,
        }));

        // --- Procesamiento de Gráfico Mensual de Ventas (por longitud) ---
        const monthlyCounts = Object.fromEntries(monthlyBuckets.map((bucket) => [bucket.key, 0]));
        salesData?.forEach((row) => {
            if (!row.created_at) return;
            const date = new Date(row.created_at);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            if (monthlyCounts[key] !== undefined) {
                monthlyCounts[key] += row.length ?? 0; // Sumamos la longitud
            }
        });
        const monthlySales: MonthlySalesPoint[] = monthlyBuckets.map((bucket) => ({
            month: bucket.label,
            sales: monthlyCounts[bucket.key] ?? 0,
        }));

        // --- Procesamiento de Distribución de Estados (desde RPC) ---
        const statusTotals = new Map<OrderStatus, number>(
            statusDistributionData?.map((row: { status: string; status_count: number }) => [row.status as OrderStatus, Number(row.status_count) || 0])
        );

        const statusDistribution: StatusDistributionSlice[] = [];
        ORDER_STATUS_PRIORITY.forEach((status) => {
            const value = statusTotals.get(status) ?? 0;
            statusDistribution.push({
                status,
                name: ORDER_STATUS_LABELS[status],
                value, // El valor es el recuento
                color: ORDER_STATUS_COLORS[status],
            });
            statusTotals.delete(status);
        });

        return {
            metrics: {
                totalOrders: totalOrders ?? 0,
                totalLengthSold: Math.round(totalLengthSold),
                totalSalesCount: salesData?.length ?? 0,
                activeClients,
                pendingOrders: pendingOrders ?? 0,
            },
            monthlySales,
            weeklyOrders,
            statusDistribution,
            lastUpdated: now.toISOString(),
        };
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return emptyDashboardData();
    }
}
