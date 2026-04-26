import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Globe2,
  TrendingUp,
  Users,
} from "lucide-react";
import { getProfiles } from "@/lib/storage";
import { SavedProfile } from "@/lib/unmapped-types";

// Seeded baseline so the demo looks meaningful even with no local profiles yet.
// These represent aggregated stats UNMAPPED partners would already see.
const SEED = {
  profiles: 1248,
  countries: 14,
  topSkills: [
    { skill: "Mobile money / agency banking", count: 312 },
    { skill: "Tailoring & garment work", count: 268 },
    { skill: "Phone & device repair", count: 241 },
    { skill: "Smallholder farming", count: 219 },
    { skill: "WhatsApp/social commerce", count: 198 },
    { skill: "Hairdressing & beauty", count: 174 },
    { skill: "Driving (boda / taxi / delivery)", count: 161 },
    { skill: "Basic bookkeeping", count: 142 },
  ],
  skillGaps: [
    { gap: "Digital literacy beyond WhatsApp", share: 64 },
    { gap: "Formal business registration", share: 57 },
    { gap: "English / French written fluency", share: 49 },
    { gap: "Data entry & spreadsheets", share: 44 },
    { gap: "Customer service in formal settings", share: 38 },
  ],
  avgRisk: 38,
};

const Policy = () => {
  const [local, setLocal] = useState<SavedProfile[]>([]);

  useEffect(() => {
    setLocal(getProfiles());
  }, []);

  const stats = useMemo(() => {
    const localCount = local.length;
    const totalProfiles = SEED.profiles + localCount;

    // Average automation risk (weighted by counts)
    const localRiskSum = local.reduce(
      (acc, p) => acc + (p.analysis.automation_risk?.score ?? 0),
      0,
    );
    const avgRisk =
      localCount > 0
        ? Math.round(
            (SEED.avgRisk * SEED.profiles + localRiskSum) / totalProfiles,
          )
        : SEED.avgRisk;

    // Merge local skills (rough tokenization) into top-skills count
    const skillCounts = new Map<string, number>();
    for (const s of SEED.topSkills) skillCounts.set(s.skill, s.count);
    for (const p of local) {
      const tokens = p.form.skills
        .toLowerCase()
        .split(/[,;.\n]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2);
      for (const t of tokens) {
        const key = capitalize(t);
        skillCounts.set(key, (skillCounts.get(key) ?? 0) + 1);
      }
    }
    const topSkills = [...skillCounts.entries()]
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Country list — seeded plus any new ones from local profiles
    const countrySet = new Set<string>();
    for (const p of local) {
      const c = p.analysis.country?.trim() || guessCountry(p.form.location);
      if (c) countrySet.add(c);
    }
    const countries = SEED.countries + countrySet.size;

    return { totalProfiles, avgRisk, topSkills, countries, localCount };
  }, [local]);

  const maxSkill = stats.topSkills[0]?.count ?? 1;

  return (
    <div className="min-h-screen bg-gradient-sun">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-3">
          <Link
            to="/"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-foreground transition active:bg-muted"
            aria-label="Back to UNMAPPED"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="font-display text-xs font-semibold tracking-[0.18em] text-primary">
              UNMAPPED · POLICY VIEW
            </div>
            <div className="truncate text-xs text-muted-foreground">
              Aggregated insight for ministries, NGOs & funders
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-5 py-6 pb-16">
        <section className="rounded-3xl bg-gradient-warm p-6 text-primary-foreground shadow-card">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-90">
            Live aggregate
          </div>
          <p className="mt-2 font-display text-xl font-semibold leading-snug text-balance">
            What people in your region can do, and where the future is heading.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed opacity-90">
            Combines seeded partner data with anonymised profiles mapped on this device.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat
            icon={<Users className="h-4 w-4" />}
            label="Profiles mapped"
            value={stats.totalProfiles.toLocaleString()}
            sub={
              stats.localCount > 0
                ? `+${stats.localCount} on this device`
                : "Demo seed"
            }
          />
          <Stat
            icon={<Globe2 className="h-4 w-4" />}
            label="Countries reached"
            value={String(stats.countries)}
            sub="Worldwide"
          />
          <Stat
            icon={<TrendingUp className="h-4 w-4" />}
            label="Avg automation risk by 2030"
            value={`${stats.avgRisk}%`}
            sub={stats.avgRisk < 33 ? "Low" : stats.avgRisk < 66 ? "Medium" : "High"}
          />
        </div>

        <Card title="Top skills in the region" icon={<BarChart3 className="h-4 w-4" />}>
          <ul className="space-y-2.5">
            {stats.topSkills.map((s) => (
              <li key={s.skill}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="truncate text-[13px] font-medium text-foreground">
                    {s.skill}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                    {s.count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(s.count / maxSkill) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Most common skill gaps" icon={<TrendingUp className="h-4 w-4" />}>
          <ul className="space-y-2.5">
            {SEED.skillGaps.map((g) => (
              <li key={g.gap}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="truncate text-[13px] font-medium text-foreground">
                    {g.gap}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                    {g.share}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{ width: `${g.share}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            Share of profiles where this gap was identified. Use to prioritise training programmes and curriculum design.
          </p>
        </Card>

        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Methodology
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-foreground/80">
            Aggregates combine seeded partner data (ILO ILOSTAT & World Bank WDI baselines) with
            anonymised profiles mapped on this device. Countries, skills and risk update as more
            people complete the intake form.
          </p>
        </div>
      </main>
    </div>
  );
};

const Stat = ({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) => (
  <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </div>
    <div className="mt-2 font-display text-2xl font-bold text-foreground">{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
  </div>
);

const Card = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <h2 className="font-display text-[15px] font-semibold text-foreground">{title}</h2>
    </div>
    {children}
  </section>
);

function capitalize(s: string) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

function guessCountry(location: string): string | null {
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || null;
}

export default Policy;
