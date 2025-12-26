import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create a Project",
    description: "Sign up and create your first waitlist project. Get your unique API key in seconds.",
  },
  {
    number: "02",
    title: "Add the API Call",
    description: "Copy our simple fetch snippet into your landing page. Works with React, Vue, vanilla JS, anything.",
  },
  {
    number: "03",
    title: "Collect Signups",
    description: "Start collecting emails immediately. View analytics in your dashboard in real-time.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2" />

      <div className="container relative mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            From zero to waitlist in{" "}
            <span className="text-gradient-accent">5 minutes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No configuration hell. No deployment pipelines. Just results.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-border to-transparent" />
                )}
                
                <div className="relative">
                  {/* Step Number */}
                  <div className="text-6xl font-bold text-gradient-primary opacity-30 mb-4">
                    {step.number}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Demo */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Dashboard Preview */}
            <div className="relative rounded-xl border border-border bg-card shadow-elevated overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold">Project: awesome-saas</h4>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary">Active</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                    <span className="text-sm text-muted-foreground">Total Signups</span>
                    <span className="text-2xl font-bold text-primary">1,247</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                    <span className="text-sm text-muted-foreground">Today</span>
                    <span className="text-2xl font-bold text-foreground">+42</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <span className="text-2xl font-bold text-accent">12.4%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow & Text */}
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-primary mb-4">
                <ArrowRight className="h-5 w-5" />
                <span className="text-sm font-medium">Real-time updates</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Watch your waitlist grow
              </h3>
              <p className="text-muted-foreground">
                Every signup appears instantly in your dashboard. Export to CSV anytime. 
                No more checking email or spreadsheets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
