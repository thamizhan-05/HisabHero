import React, { useState } from "react";
import { X, Printer, Loader2, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchStats, fetchExpenses, fetchRunway, fetchAlerts, fetchRevenueExpense, sendChatMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const formatReportText = (text: string) => {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    let parsedLine: React.ReactNode = line;
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    parsedLine = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={j} className="italic text-muted-foreground">{part.slice(1, -1)}</em>;
      }
      return <React.Fragment key={j}>{part}</React.Fragment>;
    });

    if (line.trim().startsWith("- ")) {
      return (
        <li key={i} className="ml-4 mb-2 list-disc text-muted-foreground">
          {parsedLine}
        </li>
      );
    }
    
    if (line.match(/^#{1,6}\s/)) {
        return <h3 key={i} className="text-xl font-bold mt-6 mb-3 text-foreground">{line.replace(/^#{1,6}\s/, '')}</h3>;
    }

    return (
      <React.Fragment key={i}>
        {parsedLine}
        {i < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

export function AiReportModal({ isOpen, onClose }: Props) {
  const [reportText, setReportText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: () => fetchStats(), enabled: isOpen });
  const { data: expenses } = useQuery({ queryKey: ['expenses'], queryFn: () => fetchExpenses(), enabled: isOpen });
  const { data: runwayChart } = useQuery({ queryKey: ['runway'], queryFn: () => fetchRunway(), enabled: isOpen });
  const { data: alerts } = useQuery({ queryKey: ['alerts'], queryFn: () => fetchAlerts(), enabled: isOpen });
  const { data: revenueExpense } = useQuery({ queryKey: ['revenue-expense'], queryFn: () => fetchRevenueExpense(), enabled: isOpen });

  const generateReport = async () => {
    setIsGenerating(true);
    setReportText("");

    const contextPayload = {
      stats: stats || {},
      expenses: expenses || {},
      runway: runwayChart || [],
      alerts: alerts || [],
      revenueExpense: revenueExpense || []
    };

    const prompt = "Generate a comprehensive Executive Financial Report based on this data. Format it perfectly using markdown with 4 clear sections: 1. Executive Summary, 2. Revenue & Expense Analysis, 3. Cash Flow & Runway, 4. Anomalies & Recommendations. Use bullet points heavily for readability. Make it sound highly professional as if a CFO wrote it.";

    try {
      const resp = await sendChatMessage(prompt, contextPayload);
      setReportText(resp.reply);
    } catch (err: any) {
      setReportText("Failed to generate report: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('ai-report-content');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write('<html><head><title>Executive Financial Report</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: black; line-height: 1.6; max-width: 800px; margin: 0 auto; }');
    printWindow.document.write('h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; border-bottom: 2px solid black; padding-bottom: 12px; }');
    printWindow.document.write('h3 { font-size: 20px; font-weight: 700; margin-top: 32px; margin-bottom: 16px; color: #111; }');
    printWindow.document.write('p { margin-bottom: 16px; color: #333; font-size: 15px; }');
    printWindow.document.write('.text-muted-foreground { color: #666; font-size: 14px; margin-bottom: 24px; display: block; }');
    printWindow.document.write('li { margin-bottom: 12px; margin-left: 24px; font-size: 15px; }');
    printWindow.document.write('strong { font-weight: 700; color: black; }');
    printWindow.document.write('em { font-style: italic; color: #555; }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-background border border-border shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">AI Executive Report</h2>
              <p className="text-xs text-muted-foreground">Generated by Hero Bot</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
          {!reportText && !isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ready to generate your report?</h3>
              <p className="text-muted-foreground max-w-sm mb-6">Hero Bot will analyze your live data and instantly construct a detailed executive presentation.</p>
              <Button onClick={generateReport} size="lg" className="rounded-xl font-medium shadow-md gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Now
              </Button>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px]">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium text-foreground">Analyzing Financials...</p>
              <p className="text-sm text-muted-foreground">Hero Bot is compiling your executive report.</p>
            </div>
          ) : (
            <div id="ai-report-content" className="max-w-3xl mx-auto space-y-4 text-sm leading-relaxed text-foreground">
              <div className="mb-8 border-b border-border pb-6">
                <h1 className="text-3xl font-bold text-foreground mb-2">Executive Financial Report</h1>
                <p className="text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
              </div>
              {formatReportText(reportText)}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
          {reportText && !isGenerating && (
            <Button variant="outline" onClick={handlePrint} className="gap-2 rounded-xl">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
