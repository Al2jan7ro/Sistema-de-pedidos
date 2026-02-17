import { Dashboard } from "@/components/dashboard/Dashboard"
import { fetchDashboardData } from "@/data/dashboard"

export default async function DashboardPage() {
    const data = await fetchDashboardData()

    return (
        <div className="w-full space-y-6">
            <Dashboard data={data} />
        </div>
    )
}