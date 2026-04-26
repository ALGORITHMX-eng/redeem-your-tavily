import { useEffect, useState } from "react";
import { Compass, Loader2, MapPin, Sparkles } from "lucide-react";
import { IntakeForm, SavedProfile } from "@/lib/unmapped-types";
import { COUNTRY_PRESETS, CountryPreset, CountrySwitcher } from "@/components/CountrySwitcher";
import { ProfileHistory } from "@/components/ProfileHistory";
import { AboutSection } from "@/components/AboutSection";

interface Props {
  onSubmit: (form: IntakeForm) => void;
  loading: boolean;
  country: CountryPreset["id"];
  onCountryChange: (id: CountryPreset["id"]) => void;
  history: SavedProfile[];
  onOpenHistory: (p: SavedProfile) => void;
  onDeleteHistory: (id: string) => void;
}

const educationOptions = [
  "No formal schooling",
  "Primary school",
  "Junior high / Middle school",
  "Senior high / Secondary",
  "Vocational / Technical",
  "Some university",
  "University degree",
];

const sampleFor = (id: CountryPreset["id"]) => {
  const preset = COUNTRY_PRESETS.find((p) => p.id === id)!;
  return `${preset.city}, ${preset.country}`;
};

export const SkillsForm = ({
  onSubmit,
  loading,
  country,
  onCountryChange,
  history,
  onOpenHistory,
  onDeleteHistory,
}: Props) => {
  const [form, setForm] = useState<IntakeForm>(() => ({
    name: "",
    location: sampleFor(country),
    education: "",
    skills: "",
    experience: "",
  }));

  // When country toggle changes, reflect it in the location field if user hasn't customised it
  useEffect(() => {
    setForm((f) => {
      const matchesAnyPreset = COUNTRY_PRESETS.some(
        (p) => f.location.trim().toLowerCase() === `${p.city}, ${p.country}`.toLowerCase()
      );
      if (matchesAnyPreset || !f.location.trim()) {
        return { ...f, location: sampleFor(country) };
      }
      return f;
    });
  }, [country]);

  const valid =
    form.name.trim() &&
    form.location.trim() &&
    form.education &&
    form.skills.trim().length >= 3 &&
    form.experience.trim().length >= 3;

  const update = <K extends keyof IntakeForm>(k: K, v: IntakeForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen bg-gradient-sun">
      {/* Hero */}
      <header className="px-5 pt-10 pb-6">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-2 text-primary">
            <Compass className="h-5 w-5" strokeWidth={2.4} />
            <span className="font-display text-sm font-semibold tracking-[0.18em]">
              UNMAPPED
            </span>
          </div>
          <h1 className="mt-5 font-display text-[2.1rem] font-bold leading-[1.05] text-foreground text-balance">
            Your skills are worth more than you think.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Tell us what you can do — we'll map it to real jobs and wages
            in your region, using live market data.
          </p>
        </div>
      </header>

      {/* Form card */}
      <main className="px-5 pb-16">
        <form
          className="mx-auto max-w-md space-y-5 rounded-3xl bg-card p-6 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid && !loading) onSubmit(form);
          }}
        >
          <Field label="Your name">
            <input
              type="text"
              inputMode="text"
              autoComplete="given-name"
              maxLength={60}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Amara"
              className="input-base"
              required
            />
          </Field>

          <Field
            label="Where do you live?"
            icon={<MapPin className="h-4 w-4 text-secondary" />}
          >
            <input
              type="text"
              maxLength={80}
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. Accra, Ghana"
              className="input-base"
              required
            />
          </Field>

          <Field label="Highest education">
            <select
              value={form.education}
              onChange={(e) => update("education", e.target.value)}
              className="input-base appearance-none bg-[right_1rem_center] bg-no-repeat pr-10"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23925a3a' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
              }}
              required
            >
              <option value="" disabled>
                Choose one
              </option>
              {educationOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Skills you have (formal or informal)"
            hint="Anything you can do — sewing, repairing phones, cooking, selling, coding, hairdressing…"
          >
            <textarea
              rows={3}
              maxLength={500}
              value={form.skills}
              onChange={(e) => update("skills", e.target.value)}
              placeholder="e.g. Braid hair, run a small WhatsApp shop, basic bookkeeping"
              className="input-base resize-none"
              required
            />
          </Field>

          <Field
            label="Your experience so far"
            hint="Where you've worked, helped family, sold things, learned trades."
          >
            <textarea
              rows={3}
              maxLength={500}
              value={form.experience}
              onChange={(e) => update("experience", e.target.value)}
              placeholder="e.g. 2 years at my aunt's salon, sold airtime since school"
              className="input-base resize-none"
              required
            />
          </Field>

          <button
            type="submit"
            disabled={!valid || loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-warm px-6 py-4 font-display text-base font-semibold text-primary-foreground shadow-soft transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Mapping your future…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Map my potential
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Takes ~15 seconds. Works on slow connections.
          </p>
        </form>
      </main>
    </div>
  );
};

const Field = ({
  label,
  hint,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="mb-1.5 flex items-center gap-1.5 font-display text-sm font-semibold text-foreground">
      {icon}
      {label}
    </span>
    {hint && (
      <span className="mb-2 block text-xs leading-snug text-muted-foreground">
        {hint}
      </span>
    )}
    {children}
  </label>
);
