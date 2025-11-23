import { Dashboard } from "@/components/dashboard/Dashboard"
import { fetchDashboardData } from "@/data/dashboard"

export default async function DashboardPage() {
    const data = await fetchDashboardData()

    return (
        <div className="overflow-hidden">
            <Dashboard data={data} />
        </div>
    )
}