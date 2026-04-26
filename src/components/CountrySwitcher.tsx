import { Globe2 } from "lucide-react";

export type CountryPreset = {
  id: "ghana" | "kenya";
  label: string;
  city: string;
  country: string;
  flag: string;
  currency: string;
};

export const COUNTRY_PRESETS: CountryPreset[] = [
  { id: "ghana", label: "Ghana", city: "Accra", country: "Ghana", flag: "🇬🇭", currency: "GHS" },
  { id: "kenya", label: "Kenya", city: "Nairobi", country: "Kenya", flag: "🇰🇪", currency: "KES" },
];

interface Props {
  value: CountryPreset["id"];
  onChange: (id: CountryPreset["id"]) => void;
}

export const CountrySwitcher = ({ value, onChange }: Props) => {
  return (
    <div className="mx-auto flex max-w-md items-center gap-2 rounded-full border border-border bg-card/80 p-1 shadow-soft backdrop-blur">
      <span className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Globe2 className="h-3.5 w-3.5" />
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Demo region
      </span>
      <div className="ml-auto flex items-center gap-1">
        {COUNTRY_PRESETS.map((p) => {
          const active = p.id === value;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              aria-pressed={active}
              className={
                active
                  ? "flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-display text-[12px] font-semibold text-primary-foreground shadow-soft transition"
                  : "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-[12px] font-semibold text-muted-foreground transition active:bg-muted"
              }
            >
              <span aria-hidden>{p.flag}</span>
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
