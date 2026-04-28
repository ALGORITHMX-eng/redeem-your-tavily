import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ExternalLink, MapPin, X } from "lucide-react";
import { AlgoNavbar } from "@/components/algoscout/Navbar";
import { ScorePill, StatusBadge } from "@/components/algoscout/ScorePill";
import { Job, JobStatus, loadJobs, updateJobStatus } from "@/lib/algoscout-data";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
    <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-zinc-400">{title}</h2>
    <div className="text-[14px] leading-relaxed text-zinc-200">{children}</div>
  </section>
);

export default function AlgoJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    const j = loadJobs().find((x) => x.id === id) || null;
    setJob(j);
  }, [id]);

  if (!job) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <AlgoNavbar />
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className="text-zinc-400">Job not found.</p>
          <Link to="/algoscout" className="mt-3 inline-block text-emerald-400 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const setStatus = (s: JobStatus) => {
    updateJobStatus(job.id, s);
    setJob({ ...job, status: s });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AlgoNavbar />

      <main className="mx-auto max-w-3xl px-5 py-8">
        <button
          onClick={() => navigate("/algoscout")}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-zinc-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
        </button>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wider text-emerald-400">{job.company}</div>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-zinc-100">
                {job.role}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                <span>· Found {job.dateFound}</span>
                <StatusBadge status={job.status} />
              </div>
            </div>
            <ScorePill score={job.score} size="lg" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setStatus("Approved")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3.5 py-2 text-sm font-medium text-emerald-400 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/25"
            >
              <Check className="h-4 w-4" /> Approve
            </button>
            <button
              onClick={() => setStatus("Rejected")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3.5 py-2 text-sm font-medium text-rose-400 ring-1 ring-rose-500/30 transition hover:bg-rose-500/25"
            >
              <X className="h-4 w-4" /> Reject
            </button>
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
            >
              Open application <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <Section title="Why this score">{job.reason}</Section>
          <Section title="Job description">
            <p className="whitespace-pre-line">{job.description}</p>
          </Section>
          <Section title="Tailored resume preview">
            <pre className="whitespace-pre-wrap font-sans">{job.resume}</pre>
          </Section>
          <Section title="Cover letter preview">
            <p className="whitespace-pre-line">{job.coverLetter}</p>
          </Section>
        </div>
      </main>
    </div>
  );
}
