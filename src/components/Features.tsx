import { Shield, Zap, Code2, BarChart3, Globe, Lock } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "5-Minute Setup",
    description: "Copy a single API call into your frontend. No backend, no server, no complexity.",
  },
  {
    icon: Shield,
    title: "Privacy-First",
    description: "No cookies, no fingerprinting, no tracking. Just the email you need.",
  },
  {
    icon: Code2,
    title: "Developer Friendly",
    description: "Simple REST API with comprehensive docs. Works with any framework.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track signups, conversion rates, and growth. All without compromising privacy.",
  },
  {
    icon: Globe,
    title: "Multi-Project Support",
    description: "Manage unlimited waitlists from a single dashboard. Perfect for serial builders.",
  },
  {
    icon: Lock,
    title: "Secure by Default",
    description: "Rate limiting, CORS protection, and encrypted storage. Built for production.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      
      <div className="container relative mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need.{" "}
            <span className="text-gradient-primary">Nothing you don't.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Built for founders who want to launch fast without sacrificing quality or privacy.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-xl border border-border bg-gradient-card hover:border-primary/50 transition-all duration-300"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
