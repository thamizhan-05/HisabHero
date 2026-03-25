import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import React, { Fragment } from "react";
import { sendChatMessage, fetchStats, fetchExpenses, fetchRunway, fetchAlerts, fetchRevenueExpense } from "@/lib/api";

type Message = {
  role: "user" | "ai";
  content: string;
};

const formatText = (text: string) => {
  // Handle lists by transforming standard "- item" syntax, then handle bold/italics
  const lines = text.split("\\n");
  return lines.map((line, i) => {
    let parsedLine: React.ReactNode = line;
    
    // Support bold and italics safely
    const parts = line.split(/(\\*\\*.*?\\*\\*|\\*.*?\\*)/g);
    parsedLine = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={j} className="italic">{part.slice(1, -1)}</em>;
      }
      return <Fragment key={j}>{part}</Fragment>;
    });

    return (
      <Fragment key={i}>
        {parsedLine}
        {i < lines.length - 1 && <br />}
      </Fragment>
    );
  });
};

export function FloatingAIBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hi! I'm Hero Bot, your financial assistant. How can I help you analyze your data today?" }
  ]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch contextual data to send with query so the AI knows exact numbers
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: () => fetchStats() });
  const { data: expenses } = useQuery({ queryKey: ['expenses'], queryFn: () => fetchExpenses() });
  const { data: runwayChart } = useQuery({ queryKey: ['runway'], queryFn: () => fetchRunway() });
  const { data: alerts } = useQuery({ queryKey: ['alerts'], queryFn: () => fetchAlerts() });
  const { data: revenueExpense } = useQuery({ queryKey: ['revenue-expense'], queryFn: () => fetchRevenueExpense() });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isPending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsPending(true);

    const contextPayload = {
      stats: stats || {},
      expenses: expenses || {},
      runway: runwayChart || [],
      alerts: alerts || [],
      revenueExpense: revenueExpense || []
    };

    try {
      const resp = await sendChatMessage(userMsg, contextPayload);
      setMessages(prev => [...prev, { role: "ai", content: resp.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "ai", content: "Error: " + err.message }]);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center hover:bg-primary/90 transition-all hover:-translate-y-1 hover:scale-105"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[380px] h-[580px] max-h-[85vh] max-w-[calc(100vw-32px)] bg-background border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shrink-0 shadow-sm relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-background/20 p-2 rounded-xl backdrop-blur-md">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Hero Bot</h3>
                <p className="text-[10px] opacity-80 font-medium">AI Financial Analyst</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-background/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30 pb-6 relative">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 mt-1 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                
                <div
                  className={`text-sm px-4 py-3 max-w-[82%] leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-3xl rounded-br-[4px]"
                      : "bg-background border border-border text-foreground dark:text-white rounded-3xl rounded-bl-[4px]"
                  }`}
                >
                  {msg.role === "ai" ? (
                    <div className="break-words">
                      {formatText(msg.content)}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  )}
                </div>
              </div>
            ))}
            
            {isPending && (
              <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="text-sm px-4 py-3 bg-background border border-border rounded-3xl rounded-bl-[4px] flex items-center gap-2 text-muted-foreground shadow-sm w-fit">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-background border-t border-border/50 shrink-0 relative z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
            <div className="relative flex items-center group">
              <input
                type="text"
                placeholder="Ask about your financial data..."
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus
                disabled={isPending}
                className="w-full pl-4 pr-12 py-3.5 bg-muted/60 border border-border/50 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isPending}
                className="absolute right-2 w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm"
              >
                <Send className="w-4 h-4 relative -left-0.5" />
              </button>
            </div>
            <div className="text-[10px] text-center text-muted-foreground mt-2 opacity-70">
              AI analyzes your current dashboard context
            </div>
          </form>
        </div>
      )}
    </>
  );
}
