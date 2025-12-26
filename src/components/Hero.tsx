import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Shield, Zap, Code2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Hero = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "You're on the list! 🎉",
        description: "We'll notify you when we launch.",
      });
      setEmail("");
    }
  };

  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-glow opacity-50 animate-pulse-glow" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container relative mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8 animate-fade-in">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Privacy-First · No Tracking</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            Launch before{" "}
            <span className="text-gradient-primary">you're ready</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            Add a beautiful waitlist to your product in 5 minutes.
            <br className="hidden md:block" />
            No backend required. No tracking. Just signups.
          </p>

          {/* CTA Form */}
          <form 
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-12 animate-fade-in-up opacity-0" 
            style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" variant="hero" size="lg" className="group">
              Join Waitlist
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>5-minute setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              <span>Frontend-only integration</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>GDPR compliant</span>
            </div>
          </div>
        </div>

        {/* Code Preview */}
        <div className="mt-20 max-w-3xl mx-auto animate-fade-in-up opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
          <div className="relative rounded-xl border border-border bg-card shadow-elevated overflow-hidden">
            {/* Window Controls */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-accent/60" />
              <div className="h-3 w-3 rounded-full bg-primary/60" />
              <span className="ml-4 text-xs text-muted-foreground font-mono">integration.js</span>
            </div>
            
            {/* Code Content */}
            <pre className="p-6 text-sm font-mono overflow-x-auto">
              <code>
                <span className="text-muted-foreground">{'// Add this to your landing page'}</span>
                {'\n'}
                <span className="text-accent">fetch</span>
                <span className="text-foreground">(</span>
                <span className="text-primary">'https://api.waitly.io/v1/subscribe'</span>
                <span className="text-foreground">, {'{'}</span>
                {'\n  '}
                <span className="text-foreground">method: </span>
                <span className="text-primary">'POST'</span>
                <span className="text-foreground">,</span>
                {'\n  '}
                <span className="text-foreground">headers: {'{'} </span>
                <span className="text-primary">'x-api-key'</span>
                <span className="text-foreground">: </span>
                <span className="text-primary">'your_api_key'</span>
                <span className="text-foreground"> {'}'},</span>
                {'\n  '}
                <span className="text-foreground">body: JSON.stringify({'{'} email {'}'})</span>
                {'\n'}
                <span className="text-foreground">{'}'})</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
