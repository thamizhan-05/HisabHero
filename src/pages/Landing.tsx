import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TrendingUp, BarChart3, Shield, Lightbulb, ArrowRight, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track revenue, expenses, and cash flow with interactive charts updated in real time.",
  },
  {
    icon: Shield,
    title: "Anomaly Detection",
    description: "AI-powered alerts catch unusual spending patterns before they become problems.",
  },
  {
    icon: Lightbulb,
    title: "Smart Recommendations",
    description: "Get actionable insights to cut costs, improve margins, and extend your runway.",
  },
];

const benefits = [
  "Business Health Score at a glance",
  "Cash runway forecasting",
  "Expense breakdown by category",
  "Sortable transaction history",
  "CSV upload for instant analysis",
  "Built for Indian SMEs (₹ support)",
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 h-16 border-b border-border/50 glass-card">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="HisabHero Logo" className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.style.display='none' }} />
            <span className="text-lg font-bold text-foreground tracking-tight">HisabHero</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/login?signup=true">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="pt-32 pb-24 px-6 relative overflow-hidden"
        style={{
          backgroundImage: "url('/landing-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium border border-primary/30 backdrop-blur-sm">
            <Lightbulb className="w-3 h-3" />
            AI-Powered Financial Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-lg">
            Your SME finances,
            <br />
            <span className="text-primary">crystal clear.</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed drop-shadow">
            HisabHero gives small and medium businesses a powerful dashboard to track cash flow, detect anomalies, and get AI-driven recommendations — all in one place.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild className="gap-2 shadow-lg shadow-primary/30">
              <Link to="/login?signup=true">
                Start Free <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>


      {/* Features */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">
            Everything you need to master your finances
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass-card rounded-xl border border-border/50 p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-2xl font-bold text-foreground">What's inside the dashboard</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3 p-3 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{b}</span>
              </div>
            ))}
          </div>
          <Button size="lg" asChild className="gap-2">
            <Link to="/login?signup=true">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 HisabHero. Built for Indian SMEs.</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span>Hackathon Project</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
