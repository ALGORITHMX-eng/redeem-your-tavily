import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function tavilyJobSearch(query: string, location: string) {
  const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
  if (!TAVILY_API_KEY) return { results: [], note: "no_key" };

  try {
    const resp = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `${query} jobs in ${location}`,
        search_depth: "basic",
        max_results: 5,
        include_domains: [
          "linkedin.com",
          "indeed.com",
          "jobberman.com",
          "brightermonday.com",
          "myjobmag.com",
          "fuzu.com",
          "ngcareers.com",
          "glassdoor.com",
          "workable.com",
        ],
      }),
    });
    if (!resp.ok) return { results: [], note: "tavily_error" };
    const data = await resp.json();
    const results = (data.results || []).slice(0, 5).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: (r.content || "").slice(0, 220),
    }));
    return { results, note: "ok" };
  } catch {
    return { results: [], note: "exception" };
  }
}

const tools = [
  {
    type: "function",
    function: {
      name: "search_job_listings",
      description:
        "Search the live web for real job listing URLs that match the user's skills and location. Use whenever the user asks about jobs, openings, vacancies, or where to apply.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Specific job role or skill keywords, e.g. 'junior bookkeeper' or 'hair braider salon'",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!Array.isArray(messages)) throw new Error("messages must be an array");

    const systemPrompt = `You are UNMAPPED's Career Guide — a warm, honest mentor for young Africans navigating work.

USER PROFILE
Name: ${profile?.name ?? "the user"}
Location: ${profile?.location ?? "unknown"}
Education: ${profile?.education ?? "unspecified"}
Skills: ${profile?.skills ?? "unspecified"}
Experience: ${profile?.experience ?? "unspecified"}

THEIR ANALYSIS
Summary: ${profile?.analysis?.summary ?? ""}
Top fits: ${(profile?.analysis?.isco_categories ?? []).map((c: any) => c.title).join(", ")}
Automation risk: ${profile?.analysis?.automation_risk?.score ?? "?"}% (${profile?.analysis?.automation_risk?.level ?? "?"})
Suggested opportunities: ${(profile?.analysis?.opportunities ?? []).map((o: any) => o.title).join(", ")}

HOW TO RESPOND
- Keep replies SHORT: 2–4 sentences or a tight 3–5 bullet list. Mobile screen, low bandwidth.
- Be honest, practical, encouraging. No fluff, no hype, no emojis.
- Ground advice in THEIR skills, location, and currency. Reference local realities.
- When the user asks about jobs, openings, where to apply, or finding work → CALL the search_job_listings tool with a focused query, then present the top 2–4 results as markdown links with a one-line "why it fits".
- For "how do I become X" questions: give 3 concrete steps they can start THIS WEEK with what they already have. Free or low-cost only.
- Never invent URLs. Only share links returned by the tool.
- Address them by first name occasionally, naturally.`;

    let conversation = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Tool-call loop (max 2 rounds), then stream the final answer.
    for (let round = 0; round < 2; round++) {
      const r = await fetch(LOVABLE_AI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: conversation,
          tools,
          stream: false,
        }),
      });

      if (r.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (r.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (!r.ok) {
        const t = await r.text();
        console.error("AI error", r.status, t);
        throw new Error("AI gateway error");
      }

      const data = await r.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) throw new Error("Empty AI response");

      const toolCalls = msg.tool_calls || [];
      if (toolCalls.length === 0) {
        // No more tool calls — stream this final answer back as SSE.
        const finalText: string = msg.content ?? "";
        const stream = new ReadableStream({
          async start(controller) {
            const enc = new TextEncoder();
            // Chunk by ~12 chars to feel like streaming on the client.
            const size = 14;
            for (let i = 0; i < finalText.length; i += size) {
              const piece = finalText.slice(i, i + size);
              const payload = {
                choices: [{ delta: { content: piece } }],
              };
              controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
              await new Promise((res) => setTimeout(res, 12));
            }
            controller.enqueue(enc.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });
        return new Response(stream, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // Append assistant message with tool_calls, then resolve each.
      conversation.push(msg);
      for (const call of toolCalls) {
        let result: unknown = { error: "unknown tool" };
        if (call.function?.name === "search_job_listings") {
          let args: any = {};
          try { args = JSON.parse(call.function.arguments || "{}"); } catch {}
          const query = String(args.query || "").trim() || "entry level";
          result = await tavilyJobSearch(query, profile?.location ?? "");
        }
        conversation.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    return new Response(
      JSON.stringify({ error: "Could not generate a response. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("career-chat error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
