export type IscoCategory = {
  code: string;
  title: string;
  match_reason: string;
};

export type Opportunity = {
  title: string;
  why_fit: string;
  wage_low: number;
  wage_high: number;
  currency: string;
  next_step: string;
};

export type RiskTimeline = {
  y2025: number;
  y2027: number;
  y2030: number;
};

export type Analysis = {
  country?: string;
  currency?: string;
  summary: string;
  isco_categories: IscoCategory[];
  automation_risk: {
    score: number;
    level: "low" | "medium" | "high";
    explanation: string;
    timeline?: RiskTimeline;
  };
  opportunities: Opportunity[];
  market_note: string;
};

export type IntakeForm = {
  name: string;
  location: string;
  education: string;
  skills: string;
  experience: string;
};

export type SavedProfile = {
  id: string;
  createdAt: number;
  form: IntakeForm;
  analysis: Analysis;
  marketUsed: boolean;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };
