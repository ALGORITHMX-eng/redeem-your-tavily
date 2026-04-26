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

export type Analysis = {
  summary: string;
  isco_categories: IscoCategory[];
  automation_risk: {
    score: number;
    level: "low" | "medium" | "high";
    explanation: string;
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
