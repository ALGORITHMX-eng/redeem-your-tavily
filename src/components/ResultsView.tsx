import { ArrowLeft, Briefcase, ShieldAlert, Target, TrendingUp } from "lucide-react";
import { Analysis, IntakeForm } from "@/lib/unmapped-types";
import { CareerGuideChat } from "@/components/CareerGuideChat";

interface Props {
  form: IntakeForm;
  analysis: Analysis;
  marketUsed: boolean;
  onReset: () => void;
}

const riskMeta = {
  low: {
    bg: "bg-risk-low/10",
    text: "text-risk-low",
    bar: "bg-risk-low",
    label: "Low risk",
  },
  medium: {
    bg: "bg-risk-mid/15",
    text: "text-risk-mid",
    bar: "bg-risk-mid",
    label: "Medium risk",
  },
  high: {
    bg: "bg-risk-high/10",
    text: "text-risk-high",
    bar: "bg-risk-high",
    label: "High risk",
  },
} as const;

export const ResultsView = ({ form, analysis, marketUsed, onReset }: Props) => {
  const { name, location } = form;
  const r = riskMeta[analysis.automation_risk.level];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-3">
          <button
            onClick={onReset}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-foreground transition active:bg-muted"
            aria-label="Start over"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="font-display text-xs font-semibold tracking-[0.18em] text-primary">
              UNMAPPED
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {name} · {location}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-5 py-6 pb-16">
        {/* Summary */}
        <section className="rounded-3xl bg-gradient-warm p-6 text-primary-foreground shadow-card">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-90">
            Your map
          </div>
          <p className="mt-2 font-display text-xl font-semibold leading-snug text-balance">
            {analysis.summary}
          </p>
        </section>

        {/* ISCO categories */}
        <Section
          icon={<Target className="h-4 w-4" />}
          title="Where your skills fit"
          subtitle="ISCO-08 occupation categories"
        >
          <ul className="space-y-2">
            {analysis.isco_categories.map((c) => (
              <li
                key={c.code}
                className="rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-[15px] font-semibold text-foreground">
                    {c.title}
                  </h3>
                  <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
                    {c.code}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {c.match_reason}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Automation risk */}
        <Section
          icon={<ShieldAlert className="h-4 w-4" />}
          title="Automation risk by 2030"
          subtitle="How likely AI replaces this kind of work"
        >
          <div className={`rounded-2xl p-5 ${r.bg}`}>
            <div className="flex items-end justify-between">
              <div>
                <div className={`font-display text-4xl font-bold ${r.text}`}>
                  {analysis.automation_risk.score}
                  <span className="text-xl">%</span>
                </div>
                <div className={`mt-0.5 text-xs font-semibold uppercase tracking-wider ${r.text}`}>
                  {r.label}
                </div>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/60">
              <div
                className={`h-full rounded-full ${r.bar} transition-all duration-700`}
                style={{ width: `${Math.min(100, Math.max(2, analysis.automation_risk.score))}%` }}
              />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-foreground/80">
              {analysis.automation_risk.explanation}
            </p>
          </div>
        </Section>

        {/* Opportunities */}
        <Section
          icon={<Briefcase className="h-4 w-4" />}
          title="3 opportunities for you"
          subtitle={`Real jobs with wage ranges in ${location}`}
        >
          <ul className="space-y-3">
            {analysis.opportunities.map((o, i) => (
              <li
                key={i}
                className="rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-[16px] font-semibold leading-snug text-foreground">
                    {o.title}
                  </h3>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {o.why_fit}
                </p>

                <div className="mt-3 flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span className="font-display text-sm font-semibold text-accent">
                    {formatWage(o.wage_low, o.currency)} – {formatWage(o.wage_high, o.currency)}
                    <span className="ml-1 text-[11px] font-medium opacity-75">/ month</span>
                  </span>
                </div>

                <div className="mt-3 border-t border-border pt-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Try this week
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-foreground">
                    {o.next_step}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* Market note */}
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {marketUsed ? "Live market data · Tavily" : "Regional knowledge"}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-foreground/80">
            {analysis.market_note}
          </p>
        </div>

        {/* Career Guide chat */}
        <CareerGuideChat form={form} analysis={analysis} />

        <button
          onClick={onReset}
          className="w-full rounded-2xl border border-border bg-card px-6 py-4 font-display text-sm font-semibold text-foreground transition active:bg-muted"
        >
          Try another profile
        </button>
      </main>
    </div>
  );
};

const Section = ({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <section>
    <div className="mb-3 px-1">
      <div className="flex items-center gap-2 font-display text-[15px] font-semibold text-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        {title}
      </div>
      <div className="ml-9 text-xs text-muted-foreground">{subtitle}</div>
    </div>
    {children}
  </section>
);

function formatWage(n: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(n) + " " + currency;
  } catch {
    return `${n} ${currency}`;
  }
}
