import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { History, MessageCircle, Send, Sparkles, Trash2 } from "lucide-react";
import { Analysis, ChatMessage, IntakeForm } from "@/lib/unmapped-types";
import { useToast } from "@/hooks/use-toast";
import { clearChat, getChat, saveChat } from "@/lib/storage";

interface Props {
  profileId: string;
  form: IntakeForm;
  analysis: Analysis;
}

const SUGGESTIONS = [
  "What jobs can I find near me?",
  "How do I become a web developer?",
  "What should I learn first?",
];

export const CareerGuideChat = ({ profileId, form, analysis }: Props) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChat(profileId));
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reload chat when switching profiles
  useEffect(() => {
    setMessages(getChat(profileId));
    setShowHistory(false);
  }, [profileId]);

  // Persist on every change
  useEffect(() => {
    saveChat(profileId, messages);
  }, [profileId, messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: next,
          profile: { ...form, analysis },
        }),
      });

      if (!resp.ok || !resp.body) {
        let msg = "Could not reach the Career Guide.";
        try {
          const j = await resp.json();
          if (j?.error) msg = j.error;
        } catch {}
        throw new Error(msg);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      let pushed = false;
      let done = false;

      while (!done) {
        const { value, done: rDone } = await reader.read();
        if (rDone) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") { done = true; break; }
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((prev) => {
                if (!pushed) {
                  pushed = true;
                  return [...prev, { role: "assistant", content: assistant }];
                }
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
              requestAnimationFrame(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast({
        title: "Career Guide unavailable",
        description: e?.message ?? "Try again in a moment.",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  };

  const userQuestions = messages.filter((m) => m.role === "user");

  const clearAll = () => {
    clearChat(profileId);
    setMessages([]);
    setShowHistory(false);
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <header className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MessageCircle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[15px] font-semibold text-foreground">
            Ask your Career Guide
          </h2>
          <p className="truncate text-[11px] text-muted-foreground">
            Honest, practical advice for {form.name} in {form.location}
          </p>
        </div>
        {userQuestions.length > 0 && (
          <button
            onClick={() => setShowHistory((v) => !v)}
            aria-pressed={showHistory}
            className={
              showHistory
                ? "flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground transition"
                : "flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground transition active:bg-muted"
            }
          >
            <History className="h-3 w-3" />
            History · {userQuestions.length}
          </button>
        )}
      </header>

      {showHistory ? (
        <div className="max-h-[420px] overflow-y-auto px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Your questions this session
            </div>
            <button
              onClick={clearAll}
              className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground transition active:bg-muted"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          </div>
          <ul className="space-y-2">
            {userQuestions.map((q, i) => (
              <li
                key={i}
                className="rounded-2xl border border-border bg-background p-3 text-[13px] leading-relaxed text-foreground"
              >
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Q {i + 1}
                </div>
                {q.content}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setShowHistory(false)}
            className="mt-4 w-full rounded-2xl border border-border bg-background py-2.5 font-display text-[12px] font-semibold text-foreground transition active:bg-muted"
          >
            Back to chat
          </button>
        </div>
      ) : (
        <div ref={scrollRef} className="max-h-[420px] space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-2xl bg-accent/10 p-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-[13px] leading-relaxed text-foreground">
                  Hi {form.name.split(" ")[0]} — ask me anything about your next step. I know your skills and what's realistic in {form.location}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground transition active:bg-muted"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-[13px] leading-relaxed text-primary-foreground"
                    : "max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground"
                }
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none break-words [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_li]:my-0.5 [&_p]:my-1 [&_ul]:my-1 [&_ul]:pl-4">
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" />
                        ),
                      }}
                    >
                      {m.content || "…"}
                    </ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}

          {streaming && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border bg-background px-3 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about jobs, skills, next steps…"
          disabled={streaming}
          className="flex-1 rounded-full border border-border bg-muted/40 px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-95 disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
};
