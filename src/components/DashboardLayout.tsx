import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Upload, Menu, Trash2, History } from "lucide-react";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { deleteAllData } from "@/lib/api";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { UploadHistoryPanel } from "@/components/UploadHistoryPanel";
import { CsvMappingModal } from "@/components/CsvMappingModal";
import { FloatingAIBot } from "@/components/FloatingAIBot";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { API_BASE_URL } from "@/lib/api";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentFilter = searchParams.get('filter') || 'all';

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams({ filter: e.target.value });
    // small delay allows URL to update before triggering refetched endpoints to read new window.location.search
    setTimeout(() => queryClient.invalidateQueries(), 10);
  };

  // For CSV Column Mapping modal
  const [mappingState, setMappingState] = useState<{
    headers: string[];
    detectedMapping: Record<string, string | null>;
    fileFormData: FormData;
  } | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Invalid File", description: "Please upload a .csv or .pdf file.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: formData });
      const data = await res.json();

      // [A] If server says it needs column mapping, show the modal
      if (res.status === 422 && data.needsMapping) {
        const fd = new FormData();
        fd.append("file", file);
        setMappingState({ headers: data.headers, detectedMapping: data.detectedMapping, fileFormData: fd });
        return;
      }

      if (!res.ok) throw new Error(data.error || "Upload failed");

      toast({
        title: "✅ File Uploaded",
        description: `${data.imported} rows imported${data.skipped > 0 ? `, ${data.skipped} skipped` : ""}.`,
      });
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    setConfirmDelete(false);
    try {
      const res = await fetch(`${API_BASE_URL}/upload`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error: ${res.status}`);
      }
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Error deleting data", description: err.message, variant: "destructive" });
      setDeleting(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center justify-between px-4 border-b border-border glass-card sticky top-0 z-10 gap-2">
            <div className="flex items-center gap-3 shrink-0">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <h1 className="text-sm font-medium text-muted-foreground hidden sm:block">Financial Dashboard</h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              {/* Date Filter */}
              <select
                value={currentFilter}
                onChange={handleFilterChange}
                className="bg-transparent border border-border text-foreground text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[130px]"
              >
                <option value="all">All Time</option>
                <option value="this_month">This Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="this_year">This Year</option>
              </select>

              <ThemeToggle />

              {/* Add Transaction */}
              <AddTransactionDialog />

              {/* Export CSV */}
              <a
                href={`${API_BASE_URL}/export?filter=${currentFilter}`}
                download
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-sm font-medium hover:bg-blue-500/20 transition-colors"
                title="Export Filtered Data to CSV"
              >
                <Upload className="w-4 h-4 rotate-180" />
                <span className="hidden sm:inline">Export</span>
              </a>

              {/* Upload CSV or PDF */}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.pdf" className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">{uploading ? "Uploading..." : "Upload Statement"}</span>
              </button>

              {/* History */}
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition-colors"
                title="Upload History"
              >
                <History className="w-4 h-4" />
              </button>

              {/* Remove All */}
              {confirmDelete ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/20 border border-destructive/40 text-sm">
                  <span className="text-destructive font-medium text-xs">Delete all?</span>
                  <button
                    onClick={handleDeleteAll}
                    disabled={deleting}
                    className="px-2 py-0.5 rounded bg-destructive text-white text-xs font-bold hover:bg-destructive/80 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Yes, Delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs hover:bg-muted/80"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={deleting}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
                  title="Remove all data"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-muted-foreground text-sm font-medium hover:bg-secondary transition-colors"
              >
                Logout
              </button>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>

      {/* Modals */}
      {showHistory && <UploadHistoryPanel onClose={() => setShowHistory(false)} />}
      {mappingState && (
        <CsvMappingModal
          headers={mappingState.headers}
          detectedMapping={mappingState.detectedMapping}
          fileFormData={mappingState.fileFormData}
          onClose={() => setMappingState(null)}
        />
      )}
      
      {/* Global AI Chatbot */}
      <FloatingAIBot />
    </SidebarProvider>
  );
}
