import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("signup") === "true");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form details
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
      const payload = isSignUp ? { email, password, fullName, companyName } : { email, password };
      
      const res = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast({
        title: isSignUp ? "Account Created!" : "Welcome back!",
        description: "Successfully logged in.",
      });

      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="HisabHero Logo" className="w-12 h-12 object-contain" onError={(e) => { e.currentTarget.style.display='none' }} />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">HisabHero</h1>
          <p className="text-muted-foreground text-sm">
            {isSignUp ? "Create your account to get started" : "Sign in to your financial dashboard"}
          </p>
        </div>

        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <Input 
                    placeholder="John Doe" 
                    className="bg-muted/50 border-border" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input 
                  type="email" 
                  placeholder="you@company.com" 
                  className="bg-muted/50 border-border" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="bg-muted/50 border-border pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Company Name</label>
                  <Input 
                    placeholder="Acme Corp" 
                    className="bg-muted/50 border-border"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required 
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : (isSignUp ? "Create Account" : "Sign In")}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                type="button"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
