import { Globe2 } from "lucide-react";
import { Link } from "react-router-dom";

export const AppHeader = ({ subtitle }: { subtitle?: string }) => (
  <div className="mx-auto flex max-w-md items-center gap-2 rounded-full border border-border bg-card/80 p-1.5 pl-3 shadow-soft backdrop-blur">
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Globe2 className="h-3.5 w-3.5" />
    </span>
    <div className="min-w-0 flex-1">
      <div className="font-display text-[12px] font-semibold leading-tight text-foreground">
        UNMAPPED
      </div>
      <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
        {subtitle ?? "Worldwide skills mapping"}
      </div>
    </div>
    <Link
      to="/policy"
      className="rounded-full bg-primary px-3 py-1.5 font-display text-[12px] font-semibold text-primary-foreground shadow-soft transition active:scale-[0.98]"
    >
      Policy View
    </Link>
  </div>
);
