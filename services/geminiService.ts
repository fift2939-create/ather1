
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectIdea, ProjectProposal } from "../types.ts";

// محاولة جلب المفتاح من كافة البيئات الممكنة
export const getApiKey = () => {
  const viteKey = (import.meta as any).env?.VITE_API_KEY;
  const processKey = typeof process !== 'undefined' ? (process as any).env?.API_KEY : '';
  return viteKey || processKey || "";
};

const getAIClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Missing API Key");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateProjectIdeas = async (vision: string, country: string, lang: 'ar' | 'en'): Promise<ProjectIdea[]> => {
  const ai = getAIClient();
  const prompt = lang === 'ar' 
    ? `أنت خبير دولي في كتابة مقترحات المشاريع. بناءً على الرؤية: "${vision}" والبلد: "${country}". قم بتوليد 4 أفكار مشاريع مبتكرة وواقعية جداً. الرد JSON حصراً بالعربية.`
    : `You are an international project proposal expert. Based on vision: "${vision}" and country: "${country}". Generate 4 highly innovative and realistic project ideas. Response must be JSON in English only.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ideas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                targetGroup: { type: Type.STRING },
                sector: { type: Type.STRING }
              },
              required: ["name", "description", "targetGroup", "sector"]
            }
          }
        },
        required: ["ideas"]
      }
    }
  });

  const data = JSON.parse(response.text || '{"ideas": []}');
  return data.ideas.map((idea: any, index: number) => ({ ...idea, id: String(index) }));
};

export const generateFullProposal = async (
  selectedIdea: ProjectIdea, 
  country: string, 
  lang: 'ar' | 'en',
  customCategories?: string[]
): Promise<ProjectProposal> => {
  const ai = getAIClient();
  const categories = customCategories && customCategories.length > 0 
    ? customCategories.join(", ")
    : (lang === 'ar' ? "الموظفين، المشتريات، المواصلات، الأنشطة، الإدارة" : "Staff, Procurement, Transport, Activities, Management");

  const prompt = lang === 'ar'
    ? `أنت كبير مستشاري المنظمات الدولية. صغ مقترحاً احترافياً "كاملاً" لفكرة: "${selectedIdea.name}" في "${country}". الرد JSON حصراً بالعربية.`
    : `You are a Senior Consultant for International NGOs. Write a "full" professional proposal for: "${selectedIdea.name}" in "${country}". Response must be JSON in English only.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          executiveSummary: { type: Type.STRING },
          problemAnalysis: { type: Type.STRING },
          theoryOfChange: { type: Type.STRING },
          specificGoals: { type: Type.ARRAY, items: { type: Type.STRING } },
          swot: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
              threats: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                activity: { type: Type.STRING },
                details: { type: Type.STRING },
                output: { type: Type.STRING }
              }
            }
          },
          mePlan: {
            type: Type.OBJECT,
            properties: {
              indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
              tools: { type: Type.ARRAY, items: { type: Type.STRING } },
              mechanism: { type: Type.STRING }
            }
          },
          risks: {
             type: Type.ARRAY,
             items: {
               type: Type.OBJECT,
               properties: {
                 risk: { type: Type.STRING },
                 mitigation: { type: Type.STRING }
               }
             }
          },
          sustainability: { type: Type.STRING },
          budget: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                budgetCode: { type: Type.STRING },
                item: { type: Type.STRING },
                monthlyCost: { type: Type.NUMBER },
                allocation: { type: Type.STRING },
                quantity: { type: Type.STRING },
                unit: { type: Type.STRING },
                frequency: { type: Type.NUMBER },
                frequencyUnit: { type: Type.STRING },
                total: { type: Type.NUMBER },
                description: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ["item", "total", "category", "monthlyCost", "quantity", "frequency"]
            }
          }
        },
        required: ["title", "executiveSummary", "budget", "activities", "mePlan"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as ProjectProposal;
};
