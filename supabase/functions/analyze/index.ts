import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  name: string;
  location: string;
  education: string;
  skills: string;
  experience: string;
}

const TAVILY_URL = "https://api.tavily.com/search";
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function tavilyMarketSearch(location: string, skills: string) {
  const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
  if (!TAVILY_API_KEY) return { snippets: "", note: "Tavily not configured" };

  const query = `Labor market jobs and monthly wages in ${location} for workers with skills: ${skills}. Local currency salary ranges 2024 2025 informal and formal economy.`;

  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "basic",
        max_results: 6,
        include_answer: true,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("Tavily error:", res.status, t);
      return { snippets: "", note: `Tavily error ${res.status}` };
    }

    const data = await res.json();
    const snippets = (data.results ?? [])
      .slice(0, 6)
      .map((r: any) => `- ${r.title}: ${r.content?.slice(0, 400)}`)
      .join("\n");

    return {
      snippets,
      answer: data.answer ?? "",
    };
  } catch (e) {
    console.error("Tavily fetch failed", e);
    return { snippets: "", note: "Tavily fetch failed" };
  }
}

const analysisTool = {
  type: "function",
  function: {
    name: "return_skill_analysis",
    description:
      "Return ISCO mapping, automation risk timeline, and 3 real opportunities for the user in their specific country.",
    parameters: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description:
            "The country name extracted from the user's location (e.g. 'Ghana', 'Brazil', 'Vietnam').",
        },
        currency: {
          type: "string",
          description:
            "ISO 4217 currency code for the user's country (e.g. GHS, NGN, KES, BRL, VND, INR, USD, EUR).",
        },
        summary: {
          type: "string",
          description:
            "One warm, encouraging sentence (max 25 words) addressed to the user by name about their economic potential.",
        },
        isco_categories: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: {
            type: "object",
            properties: {
              code: { type: "string", description: "ISCO-08 code, e.g. 5223" },
              title: { type: "string", description: "ISCO occupation title" },
              match_reason: {
                type: "string",
                description: "Why their skills map here, max 20 words.",
              },
            },
            required: ["code", "title", "match_reason"],
            additionalProperties: false,
          },
        },
        automation_risk: {
          type: "object",
          properties: {
            score: {
              type: "number",
              description:
                "0-100. Probability that AI/automation displaces this work by 2030.",
            },
            level: { type: "string", enum: ["low", "medium", "high"] },
            explanation: {
              type: "string",
              description: "Plain-language reason, max 35 words.",
            },
            timeline: {
              type: "object",
              description:
                "Projected automation risk for these skills at three points in time.",
              properties: {
                y2025: { type: "number", description: "Risk % in 2025 (0-100)" },
                y2027: { type: "number", description: "Risk % in 2027 (0-100)" },
                y2030: {
                  type: "number",
                  description:
                    "Risk % in 2030 (0-100) — should match the headline score.",
                },
              },
              required: ["y2025", "y2027", "y2030"],
              additionalProperties: false,
            },
          },
          required: ["score", "level", "explanation", "timeline"],
          additionalProperties: false,
        },
        opportunities: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Concrete job title" },
              why_fit: {
                type: "string",
                description: "Why this fits the user, max 25 words.",
              },
              wage_low: {
                type: "number",
                description: "Low monthly wage estimate in local currency",
              },
              wage_high: {
                type: "number",
                description: "High monthly wage estimate in local currency",
              },
              currency: {
                type: "string",
                description:
                  "ISO 4217 currency code matching the country (e.g. GHS, BRL, INR).",
              },
              next_step: {
                type: "string",
                description:
                  "One concrete action the user can take this week, max 20 words.",
              },
            },
            required: [
              "title",
              "why_fit",
              "wage_low",
              "wage_high",
              "currency",
              "next_step",
            ],
            additionalProperties: false,
          },
        },
        market_note: {
          type: "string",
          description:
            "One sentence citing what the live market data showed about their region.",
        },
      },
      required: [
        "country",
        "currency",
        "summary",
        "isco_categories",
        "automation_risk",
        "opportunities",
        "market_note",
      ],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as AnalyzeRequest;

    for (const f of ["name", "location", "education", "skills", "experience"]) {
      if (!body[f as keyof AnalyzeRequest] || String(body[f as keyof AnalyzeRequest]).trim().length === 0) {
        return new Response(
          JSON.stringify({ error: `Missing field: ${f}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 1. Live market data via Tavily — works for any country
    const market = await tavilyMarketSearch(body.location, body.skills);

    // 2. Lovable AI structured analysis
    const systemPrompt = `You are a global economic-mobility advisor. You map skills to ISCO-08 occupations, assess automation risk by 2030 using OECD/ILO/World Bank frameworks, and propose realistic opportunities with regional wage estimates.

You work for ANY country in the world — not just one region. Always:
- Detect the country from the user's location string and use its real local currency (ISO 4217 code).
- Quote wages as monthly amounts at realistic local market rates (informal & semi-formal where relevant), not Western salaries.
- Provide a 3-point automation-risk timeline (2025, 2027, 2030) that reflects how exposure to AI/automation grows over time for THIS specific skill mix in THIS country.
- Be honest, warm, and practical.`;

    const userPrompt = `User profile:
- Name: ${body.name}
- Location: ${body.location}
- Education: ${body.education}
- Skills: ${body.skills}
- Experience: ${body.experience}

Live labor-market context (from web search for this exact location):
${market.answer ? `Summary: ${market.answer}\n` : ""}${market.snippets || "(no live data available — use your best regional knowledge for this country)"}

Now call return_skill_analysis. Detect the country from the location, use its local currency, and ground wages and opportunities in this country's real labor market. The automation_risk.timeline should show the trajectory: typically lower in 2025, rising by 2027, peaking by 2030, with the 2030 value matching the headline score.`;

    const aiRes = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [analysisTool],
        tool_choice: {
          type: "function",
          function: { name: "return_skill_analysis" },
        },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(
        JSON.stringify({ error: "Too many requests — please try again in a minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiRes.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable Cloud settings." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call returned", JSON.stringify(aiJson).slice(0, 600));
      return new Response(
        JSON.stringify({ error: "Model did not return structured analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ analysis, market_used: !!market.snippets }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
