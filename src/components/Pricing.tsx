import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for testing and small projects",
    features: [
      "1 project",
      "500 signups/month",
      "Basic analytics",
      "Email export",
      "Community support",
    ],
    cta: "Start Free",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For serious builders and growing products",
    features: [
      "Unlimited projects",
      "10,000 signups/month",
      "Advanced analytics",
      "Webhook integrations",
      "Custom branding",
      "Priority support",
    ],
    cta: "Get Pro",
    variant: "hero" as const,
    popular: true,
  },
  {
    name: "Scale",
    price: "$29",
    period: "/month",
    description: "For teams and high-traffic launches",
    features: [
      "Everything in Pro",
      "Unlimited signups",
      "Team members",
      "API rate limit boost",
      "Custom domains",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      
      <div className="container relative mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, transparent{" "}
            <span className="text-gradient-primary">pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when you need more. No hidden fees, no surprises.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl border transition-all duration-300 ${
                plan.popular
                  ? "border-primary bg-gradient-card shadow-glow"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 text-xs font-semibold rounded-full bg-gradient-primary text-primary-foreground">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button variant={plan.variant} className="w-full" size="lg">
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
