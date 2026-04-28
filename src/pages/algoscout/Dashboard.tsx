import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Check, X, Inbox, Clock, CheckCircle2, XCircle } from "lucide-react";
import { AlgoNavbar } from "@/components/algoscout/Navbar";
import { ScorePill, StatusBadge } from "@/components/algoscout/ScorePill";
import { Job, JobStatus, loadJobs, updateJobStatus } from "@/lib/algoscout-data";

const FILTERS: ("All" | JobStatus)[] = ["All", "Pending", "Approved", "Rejected"];

const StatCard = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: any;
  tone: "zinc" | "amber" | "emerald" | "rose";
}) => {
  const map = {
    zinc: "bg-zinc-500/10 text-zinc-300 ring-zinc-500/30",
    amber: "bg-amber-500/10 text-amber-400 ring-amber-500/30",
    emerald: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
    rose: "bg-rose-500/10 text-rose-400 ring-rose-500/30",
  } as const;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ${map[tone]}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-3 font-display text-3xl font-semibold text-zinc-100">{value}</div>
    </div>
  );
};

export default function AlgoDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  useEffect(() => {
    setJobs(loadJobs());
  }, []);

  const stats = useMemo(
    () => ({
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "Pending").length,
      approved: jobs.filter((j) => j.status === "Approved").length,
      rejected: jobs.filter((j) => j.status === "Rejected").length,
    }),
    [jobs],
  );

  const visible = filter === "All" ? jobs : jobs.filter((j) => j.status === filter);

  const setStatus = (id: string, status: JobStatus) => {
    setJobs(updateJobStatus(id, status));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AlgoNavbar />

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500">AI-scored job leads, ready for your review.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total leads" value={stats.total} icon={Inbox} tone="zinc" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} tone="amber" />
          <StatCard label="Applied" value={stats.approved} icon={CheckCircle2} tone="emerald" />
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="rose" />
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
            <div className="font-display text-sm font-semibold text-zinc-100">Job leads</div>
            <div className="flex gap-1 rounded-lg bg-zinc-900 p-1 ring-1 ring-zinc-800">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    filter === f
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/60 text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Company</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Score</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Date found</th>
                  <th className="px-4 py-3 text-left font-medium">Apply</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((j) => (
                  <tr key={j.id} className="border-t border-zinc-800/70 transition hover:bg-zinc-900/60">
                    <td className="px-4 py-3">
                      <Link to={`/algoscout/job/${j.id}`} className="font-medium text-zinc-100 hover:text-emerald-400">
                        {j.company}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <Link to={`/algoscout/job/${j.id}`} className="hover:text-emerald-400">
                        {j.role}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><ScorePill score={j.score} /></td>
                    <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                    <td className="px-4 py-3 text-zinc-400">{j.dateFound}</td>
                    <td className="px-4 py-3">
                      <a
                        href={j.applyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setStatus(j.id, "Approved")}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2.5 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/25"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => setStatus(j.id, "Rejected")}
                          className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2.5 py-1.5 text-xs font-medium text-rose-400 ring-1 ring-rose-500/30 transition hover:bg-rose-500/25"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-500">
                      No jobs match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
