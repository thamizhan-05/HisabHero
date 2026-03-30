import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { X, ArrowRight } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface MappingModalProps {
  headers: string[];
  detectedMapping: Record<string, string | null>;
  fileFormData: FormData;
  onClose: () => void;
}

const FIELDS = [
  { key: "date",        label: "Date Column",        required: true  },
  { key: "description", label: "Description Column",  required: false },
  { key: "category",    label: "Category Column",     required: false },
  { key: "amount",      label: "Amount Column",       required: false, note: "Use Amount OR Debit+Credit" },
  { key: "type",        label: "Type Column (income/expense)", required: false },
  { key: "debit",       label: "Debit Column",        required: false },
  { key: "credit",      label: "Credit Column",       required: false },
];

export function CsvMappingModal({ headers, detectedMapping, fileFormData, onClose }: MappingModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [mapping, setMapping] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map(f => [f.key, detectedMapping[f.key] || ""]))
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapping.date) {
      toast({ title: "Date column required", variant: "destructive" }); return;
    }
    if (!mapping.amount && !mapping.credit && !mapping.debit) {
      toast({ title: "Provide an Amount or Debit/Credit column", variant: "destructive" }); return;
    }

    setLoading(true);
    // Re-upload with the confirmed mapping as query params
    const url = new URL(`${API_BASE_URL}/upload`);
    Object.entries(mapping).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });
    url.searchParams.set("mappingConfirmed", "true");

    try {
      const res = await fetch(url.toString(), { method: "POST", body: fileFormData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast({ title: "✅ Upload Success", description: `${data.imported} transactions imported.` });
      await queryClient.invalidateQueries();
      onClose();
    } catch (err: any) {
      toast({ title: "Upload Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl w-full max-w-lg border border-border shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Map CSV Columns</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Some columns couldn't be auto-detected. Please map them manually.</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3 max-h-[65vh] overflow-y-auto">
          {FIELDS.map(f => (
            <div key={f.key} className="flex items-center gap-3">
              <label className="w-44 text-sm text-muted-foreground shrink-0">
                {f.label} {f.required && <span className="text-danger">*</span>}
              </label>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={mapping[f.key] || ""}
                onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">— skip —</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              {loading ? "Uploading..." : "Confirm & Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
