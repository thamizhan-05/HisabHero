import { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { addTransaction, fetchExpenses } from "@/lib/api";
import { Plus, X, TrendingDown, TrendingUp } from "lucide-react";

const TODAY = new Date().toISOString().split("T")[0];

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [date, setDate] = useState(TODAY);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  const reset = () => {
    setType("expense"); setDate(TODAY);
    setDescription(""); setCategory(""); setAmount("");
  };
  const close = () => { reset(); setOpen(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast({ title: "Invalid amount", description: "Enter an amount greater than 0.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await addTransaction({ date, description, category: category || "Other", amount: amt, type });
      toast({
        title: type === "income" ? "💰 Revenue Added!" : "💸 Expense Recorded!",
        description: `${description || category} — ₹${amt.toLocaleString("en-IN")}`,
      });
      close();
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isIncome = type === "income";

  // Fetch categories to populate datalist
  const { data: expensesData } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => fetchExpenses(),
  });
  const existingCategories = Array.from(new Set([
    "Rent", "Payroll", "Utilities", "Marketing", "Sales", "Consulting",
    ...(expensesData?.categories?.map((c: any) => c.name) || [])
  ]));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Add Transaction</span>
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <>
          {/* Backdrop — 80% opaque black */}
          <div
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={close}
          />

          {/* Strict Viewport Centering Wrapper */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            
            {/* Dialog Card properly themed and strictly constrained */}
            <div className="w-full max-w-[440px] bg-background border border-border shadow-2xl rounded-2xl pointer-events-auto text-left flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Add Transaction</h2>
                  <p className="text-xs text-muted-foreground mt-1">Record a new financial entry</p>
                </div>
                <button
                  onClick={close}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Boundary - makes internal area scrollable if screen is too small */}
              <div className="overflow-y-auto w-full">
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

                  {/* Toggle */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Transaction Type</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setType("expense")}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all focus:outline-none ${
                          !isIncome
                            ? "border-destructive bg-destructive/10 text-destructive shadow-sm"
                            : "border-border text-muted-foreground hover:border-destructive/30 hover:text-destructive"
                        }`}
                      >
                        <TrendingDown className="w-4 h-4" />
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => setType("income")}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all focus:outline-none ${
                          isIncome
                            ? "border-success bg-success/10 text-success shadow-sm"
                            : "border-border text-muted-foreground hover:border-success/30 hover:text-success"
                        }`}
                      >
                        <TrendingUp className="w-4 h-4" />
                        Revenue
                      </button>
                    </div>
                  </div>

                  {/* Form Grid */}
                  <div className="space-y-4">
                    {/* Date */}
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Date</label>
                      <input
                        type="date"
                        value={date}
                        max={TODAY}
                        onChange={e => setDate(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-xl text-sm bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      />
                    </div>

                    {/* Description & Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Description <span className="font-normal opacity-70 normal-case">— optional</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Client Payment"
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl text-sm bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Category</label>
                        <input
                          type="text"
                          list="category-suggestions"
                          placeholder="e.g. Sales"
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl text-sm bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                        <datalist id="category-suggestions">
                          {existingCategories.map((cat: any) => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Amount (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₹</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          min="1"
                          step="0.01"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          required
                          className={`w-full pl-7 pr-3 py-2.5 rounded-xl text-base font-medium bg-muted/50 border focus:outline-none focus:ring-1 text-foreground transition-colors ${
                            isIncome ? "border-success/50 focus:ring-success" : "border-destructive/50 focus:ring-destructive"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <button
                      type="button"
                      onClick={close}
                      className="py-3 rounded-xl text-sm font-semibold text-muted-foreground border border-border hover:bg-muted transition-colors focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`py-3 rounded-xl text-sm font-bold text-white transition-all focus:outline-none disabled:opacity-50 flex items-center justify-center gap-2 ${
                        isIncome
                          ? "bg-success hover:bg-success/90 shadow-md shadow-success/20"
                          : "bg-destructive hover:bg-destructive/90 shadow-md shadow-destructive/20"
                      }`}
                    >
                      {loading ? "Saving..." : isIncome ? (
                        <><TrendingUp className="w-4 h-4" /> Save Revenue</>
                      ) : (
                        <><TrendingDown className="w-4 h-4" /> Save Expense</>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
