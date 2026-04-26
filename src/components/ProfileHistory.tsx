import { Clock, MapPin, Trash2 } from "lucide-react";
import { SavedProfile } from "@/lib/unmapped-types";

interface Props {
  profiles: SavedProfile[];
  onOpen: (profile: SavedProfile) => void;
  onDelete: (id: string) => void;
}

export const ProfileHistory = ({ profiles, onOpen, onDelete }: Props) => {
  if (profiles.length === 0) return null;

  return (
    <section className="mx-auto max-w-md rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Clock className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-[14px] font-semibold text-foreground">
            Your past maps
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Saved locally on this device
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {profiles.map((p) => (
          <li
            key={p.id}
            className="group flex items-center gap-2 rounded-2xl border border-border bg-background p-3 transition active:bg-muted"
          >
            <button
              onClick={() => onOpen(p)}
              className="flex min-w-0 flex-1 flex-col items-start text-left"
            >
              <div className="font-display text-[13px] font-semibold text-foreground">
                {p.form.name}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{p.form.location}</span>
                <span aria-hidden>·</span>
                <span>{formatDate(p.createdAt)}</span>
              </div>
            </button>
            <button
              onClick={() => onDelete(p.id)}
              aria-label={`Delete ${p.form.name}'s map`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:text-destructive active:bg-muted"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
