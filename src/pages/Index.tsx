import { useState } from "react";
import { FileText } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AiReportModal } from "@/components/AiReportModal";
import { HealthScoreGauge } from "@/components/HealthScoreGauge";
import { QuickStats } from "@/components/QuickStats";
import { RevenueExpenseChart } from "@/components/RevenueExpenseChart";
import { CashRunwayChart } from "@/components/CashRunwayChart";
import { TransactionsTable } from "@/components/TransactionsTable";
import { AlertCards } from "@/components/AlertCards";

const Index = () => {
  const [reportOpen, setReportOpen] = useState(false);
  
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Welcome Header */}
        {user.fullName && (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {user.fullName}
              </h1>
              {user.companyName && (
                <p className="text-sm text-muted-foreground mt-1">{user.companyName}</p>
              )}
            </div>

            <button onClick={() => setReportOpen(true)} className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl transition-all shadow-md font-medium">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">AI Executive Report</span>
            </button>
          </div>
        )}

        {/* Hero: Health Score + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <HealthScoreGauge />
          </div>
          <div className="lg:col-span-2">
            <QuickStats />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueExpenseChart />
          <CashRunwayChart />
        </div>

        {/* Alerts */}
        <AlertCards />

        {/* Transactions */}
        <TransactionsTable />
      </div>
      
      <AiReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
    </DashboardLayout>
  );
};

export default Index;
