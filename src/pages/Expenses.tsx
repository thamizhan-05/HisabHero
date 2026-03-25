import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchExpenses } from "@/lib/api";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

export default function Expenses() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-muted-foreground animate-pulse">Loading expenses data...</div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="p-8 text-danger">Failed to load expenses data.</div>
      </DashboardLayout>
    );
  }

  const { categories = [], monthlyTrend = [] } = data;
  const total = categories.reduce((s: number, c: any) => s + c.value, 0);

  // Sorting categories safely
  const sortedCategories = [...categories].sort((a, b) => b.value - a.value);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Expense Analysis</h2>
          <p className="text-muted-foreground text-sm mt-1">Breakdown of where your money goes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card border-border/50">
            <CardHeader><CardTitle className="text-base">Expense Distribution</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={240}>
                <PieChart>
                  <Pie data={categories} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {categories.map((c: any, i: number) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(220 18% 13%)", border: "1px solid hsl(220 14% 18%)", borderRadius: 8 }}
                    itemStyle={{ color: "hsl(210 20% 92%)" }}
                    labelStyle={{ color: "hsl(210 20% 92%)" }}
                    formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 flex-1">
                {categories.map((c: any) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                      <span className="text-muted-foreground">{c.name}</span>
                    </div>
                    <span className="text-foreground font-medium">{((c.value / total) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader><CardTitle className="text-base">Monthly Expense Trend</CardTitle></CardHeader>
            <CardContent>
              {monthlyTrend.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[240px] text-center text-muted-foreground">
                  <p className="text-sm">No monthly expense data yet.</p>
                  <p className="text-xs mt-1 opacity-60">Upload a statement to see the trend.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                    <XAxis dataKey="month" stroke="hsl(215 15% 55%)" fontSize={12} />
                    <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: "hsl(220 18% 13%)", border: "1px solid hsl(220 14% 18%)", borderRadius: 8 }}
                      itemStyle={{ color: "hsl(210 20% 92%)" }}
                      labelStyle={{ color: "hsl(210 20% 92%)" }}
                      formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`}
                    />
                    <Bar dataKey="total" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} name="Total Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card border-border/50">
          <CardHeader><CardTitle className="text-base">Top Expenses This Month</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedCategories.map((c: any) => (
                <div key={c.name} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-24">{c.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(c.value / sortedCategories[0].value) * 100}%`, background: c.color }} />
                  </div>
                  <span className="text-sm font-medium text-foreground w-24 text-right">₹{c.value.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
