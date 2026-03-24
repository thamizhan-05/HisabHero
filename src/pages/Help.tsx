import { DashboardLayout } from "@/components/DashboardLayout";
import { HelpCircle, BookOpen, BarChart2, Activity, AlertTriangle, TrendingUp, Upload, FileText } from "lucide-react";

const sections = [
  {
    icon: Activity,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Business Health Score",
    formula: "Health Score = clamp(Net Margin × 2, 0, 100)",
    description: "The score is a direct, honest reflection of your profitability. It only counts up when you are making money.",
    rows: [
      { label: "50% margin", result: "100 / 100 — Excellent 🟢" },
      { label: "25% margin", result: "50 / 100 — Healthy 🟡" },
      { label: "10% margin", result: "20 / 100 — Low ⚠️" },
      { label: "0% or negative", result: "0 / 100 — Critical 🔴" },
    ],
    note: "This is intentionally strict. A health score of 0 when you are in a loss is a reality check — not a bug."
  },
  {
    icon: TrendingUp,
    color: "text-success",
    bg: "bg-success/10",
    title: "Net Margin",
    formula: "Net Margin = ((Revenue − Expenses) ÷ Revenue) × 100",
    description: "Measures how much profit you keep from every rupee of revenue. The core driver of your Health Score.",
    rows: [],
    note: null,
  },
  {
    icon: BarChart2,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    title: "Cash Runway",
    formula: "Runway (months) = Current Net Balance ÷ Average Monthly Burn",
    description: "Answers: 'How many months can the business survive at the current burn rate?' Projected forward using your average monthly expenses.",
    rows: [],
    note: null,
  },
  {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    title: "Auto-Generated Alerts",
    formula: null,
    description: "Alerts are triggered automatically from your data when any of these conditions are met:",
    rows: [
      { label: "🔴 Net Margin < 0%", result: "Negative margin alert fires" },
      { label: "🟡 Any category > 40% of expenses", result: "High spend concentration warning" },
      { label: "🔴 Runway < 4 months", result: "Low cash runway alert fires" },
      { label: "🟢 Net Margin ≥ 20%", result: "Healthy margin confirmation shown" },
    ],
    note: null,
  },
  {
    icon: Upload,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    title: "CSV Column Detection",
    formula: null,
    description: "When you upload a CSV file, the system auto-detects your column headers using these aliases:",
    rows: [
      { label: "Date", result: "date, trans_date, txn_date, timestamp, posting_date..." },
      { label: "Amount", result: "amount, value, total, trans_amt, net_amount..." },
      { label: "Type", result: "type, transaction_type, cr_dr, kind..." },
      { label: "Category", result: "category, cat, label, expense_type..." },
      { label: "Description", result: "description, narration, particulars, memo, payee..." },
      { label: "Debit / Credit", result: "debit, dr, withdrawal / credit, cr, deposit" },
    ],
    note: "If your column names don't match, a mapping modal will appear automatically so you can match them manually."
  },
  {
    icon: FileText,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    title: "Ideal CSV Format",
    formula: null,
    description: "For the best results without any manual mapping, structure your CSV with these column names:",
    rows: [
      { label: "Date", result: "YYYY-MM-DD  (e.g. 2026-03-15)" },
      { label: "Description", result: "Short text  (e.g. Monthly Rent)" },
      { label: "Category", result: "Word or phrase  (e.g. Payroll, Sales)" },
      { label: "Amount", result: "Numeric only  (e.g. 5000)" },
      { label: "Type", result: "'income' or 'expense' (case-insensitive)" },
    ],
    note: "You can also have separate Debit and Credit columns instead of a single Amount + Type pair."
  },
];

export default function Help() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Help & Methodology</h2>
            <p className="text-sm text-muted-foreground">How your dashboard calculates everything — full transparency</p>
          </div>
        </div>

        {/* Sections */}
        {sections.map((section, i) => (
          <div key={i} className="glass-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${section.bg} flex items-center justify-center shrink-0`}>
                <section.icon className={`w-5 h-5 ${section.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
            </div>

            {section.formula && (
              <div className="font-mono text-sm px-4 py-3 rounded-xl bg-muted/40 border border-border text-foreground">
                {section.formula}
              </div>
            )}

            <p className="text-sm text-muted-foreground leading-relaxed">{section.description}</p>

            {section.rows.length > 0 && (
              <div className="rounded-xl overflow-hidden border border-border">
                {section.rows.map((row, j) => (
                  <div key={j} className={`flex gap-4 px-4 py-2.5 text-sm ${j % 2 === 0 ? "bg-muted/20" : ""}`}>
                    <span className="text-muted-foreground font-medium w-40 shrink-0">{row.label}</span>
                    <span className="text-foreground">{row.result}</span>
                  </div>
                ))}
              </div>
            )}

            {section.note && (
              <div className="text-xs text-muted-foreground bg-muted/30 px-4 py-2.5 rounded-lg border border-border/50">
                💡 {section.note}
              </div>
            )}
          </div>
        ))}

        {/* Built with note */}
        <div className="text-center text-xs text-muted-foreground py-4">
          Built for the SME Business Health Dashboard · React + Express + Local JSON
        </div>
      </div>
    </DashboardLayout>
  );
}
