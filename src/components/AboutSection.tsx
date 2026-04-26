import { Database, Globe2, Search, Tags } from "lucide-react";

const SOURCES = [
  {
    name: "ILO ILOSTAT",
    desc: "Labor force & wage statistics",
    icon: <Globe2 className="h-4 w-4" />,
  },
  {
    name: "World Bank WDI",
    desc: "Development indicators",
    icon: <Database className="h-4 w-4" />,
  },
  {
    name: "Tavily",
    desc: "Live job market search",
    icon: <Search className="h-4 w-4" />,
  },
  {
    name: "ISCO-08",
    desc: "Occupation taxonomy",
    icon: <Tags className="h-4 w-4" />,
  },
];

export const AboutSection = () => (
  <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
    <div className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-primary">
      About UNMAPPED
    </div>
    <h2 className="mt-2 font-display text-lg font-semibold leading-snug text-foreground text-balance">
      Open infrastructure for the next billion workers.
    </h2>
    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      UNMAPPED is a free, open layer that any NGO, ministry, or community
      program can plug into — to map informal skills to real economic
      opportunity. Built mobile-first, designed for low-bandwidth.
    </p>

    <div className="mt-4">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Powered by open data
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {SOURCES.map((s) => (
          <li
            key={s.name}
            className="flex items-start gap-2 rounded-xl border border-border bg-background p-2.5"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {s.icon}
            </span>
            <div className="min-w-0">
              <div className="font-display text-[12px] font-semibold leading-tight text-foreground">
                {s.name}
              </div>
              <div className="truncate text-[11px] leading-tight text-muted-foreground">
                {s.desc}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
