import { useState } from "react";
import { ArrowUpDown, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTransactions, deleteTransaction } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type Transaction = {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense";
};

export function TransactionsTable() {
  const [sortKey, setSortKey] = useState<keyof Transaction>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: () => fetchTransactions(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "Transaction Deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const toggle = (key: keyof Transaction) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const headers: { key: keyof Transaction; label: string }[] = [
    { key: "date", label: "Date" },
    { key: "description", label: "Description" },
    { key: "category", label: "Category" },
    { key: "amount", label: "Amount" },
  ];

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">Recent Transactions</h3>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-muted/20 rounded" />)}
        </div>
      </div>
    );
  }

  if (error || !transactions) {
    return <div className="text-danger text-sm">Failed to load transactions.</div>;
  }

  const sorted = [...transactions].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
    return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
        Recent Transactions
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {headers.map((h) => (
                <th
                  key={h.key}
                  className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggle(h.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {h.label}
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
              ))}
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx) => (
              <tr key={tx.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{tx.date}</td>
                <td className="py-3 px-4 text-foreground">{tx.description}</td>
                <td className="py-3 px-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                    {tx.category}
                  </span>
                </td>
                <td className={`py-3 px-4 font-mono font-medium ${tx.type === "income" ? "text-success" : "text-danger"}`}>
                  {tx.type === "income" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => deleteMutation.mutate(tx.id)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleteMutation.isPending && deleteMutation.variables === tx.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
