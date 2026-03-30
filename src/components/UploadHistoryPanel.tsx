import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { X, FileText, Trash2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

async function fetchUploads() {
  const res = await fetch("http://localhost:5000/api/uploads");
  if (!res.ok) throw new Error("Failed to fetch uploads");
  return res.json();
}

export function UploadHistoryPanel({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const { data: uploads = [], isLoading } = useQuery({ queryKey: ['uploads'], queryFn: fetchUploads });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = async (uploadId: string, mongoId: string) => {
    setDeletingId(mongoId);
    setConfirmId(null);
    try {
      // Try deleting by MongoDB _id first
      const res = await fetch(`http://localhost:5000/api/upload/${mongoId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error: ${res.status}`);
      }
      // Reload entire page to refresh all charts and data
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl w-full max-w-lg border border-border shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Upload History</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {!isLoading && uploads.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No uploads yet.</p>
          )}
          {uploads.map((u: any) => {
            const mongoId = u._id || u.id;
            const uploadId = u.uploadId;
            const isDeleting = deletingId === mongoId;
            const isConfirming = confirmId === mongoId;
            return (
              <div key={mongoId} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/20 border border-border/50">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.rowCount} rows · {new Date(u.uploadedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>

                {isConfirming ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-destructive font-medium">Delete?</span>
                    <button
                      onClick={() => handleDelete(uploadId, mongoId)}
                      disabled={isDeleting}
                      className="px-2 py-0.5 rounded bg-destructive text-white text-xs font-bold hover:bg-destructive/80"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs hover:bg-muted/80"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(mongoId)}
                    disabled={isDeleting}
                    className="shrink-0 p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    title="Remove this upload"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
