
export interface ProjectIdea {
  id: string;
  name: string;
  description: string;
  targetGroup: string;
  sector: string;
}

export interface Activity {
  activity: string;
  details: string;
  output: string;
}

export interface Risk {
  risk: string;
  impact?: "High" | "Medium" | "Low";
  mitigation: string;
}

export interface BudgetItem {
  budgetCode?: string;
  item: string;
  monthlyCost: number;
  allocation: string; // e.g. "100%"
  quantity: string;
  unit: string;
  frequency: number;
  frequencyUnit: string;
  total: number;
  description: string; // Acts as Narrative Justification
  category: string;
}

export interface SWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface ProjectProposal {
  title: string;
  executiveSummary: string;
  problemAnalysis?: string;
  justification?: string;
  theoryOfChange?: string;
  generalGoal?: string;
  specificGoals?: string[];
  swot?: SWOT;
  targets?: {
    direct: string;
    indirect: string;
  };
  scope?: string;
  activities: Activity[];
  results?: string[];
  mePlan?: {
    indicators: string[];
    tools: string[];
    mechanism: string;
  };
  risks?: Risk[];
  sustainability?: string;
  assumptions?: string;
  budget: BudgetItem[];
}

export enum Step {
  Input = 1,
  Ideas = 2,
  Proposal = 3
}

export type AIProvider = 'gemini' | 'openai' | 'groq' | 'openrouter';
