
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectIdea, ProjectProposal } from "../types";

// محاولة جلب المفتاح من كافة البيئات الممكنة
export const getApiKey = () => {
  // في Vite/Cloudflare Pages نستخدم import.meta.env
  const viteKey = (import.meta as any).env?.VITE_API_KEY;
  // في بعض البيئات الأخرى نستخدم process.env
  const processKey = typeof process !== 'undefined' ? process.env?.API_KEY : '';
  
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
    ? `أنت كبير مستشاري المنظمات الدولية. صغ مقترحاً احترافياً "كاملاً" لفكرة: "${selectedIdea.name}" في "${country}".
      يجب أن يكون السرد مقنعاً جداً وشاملاً:
      1. تحليل المشكلة: تفاصيل اجتماعية واقتصادية دقيقة.
      2. نظرية التغيير: شرح عميق لكيفية تحويل المدخلات إلى أثر.
      3. أهداف SMART: أرقام ونسب مئوية وتواريخ.
      4. SWOT: تحليل داخلي وخارجي مفصل.
      5. خطة M&E: مؤشرات أداء (KPIs)، أدوات (استبيانات، مقابلات)، وآلية تتبع.
      6. الميزانية: تفصيل ممل (كمية، كلفة شهرية، تكرار) موزعة على: ${categories}.
      الرد JSON حصراً بالعربية الرصينة.`
    : `You are a Senior Consultant for International NGOs. Write a "full" professional proposal for: "${selectedIdea.name}" in "${country}".
      The narrative must be highly persuasive and exhaustive:
      1. Problem Analysis: Precise socio-economic details.
      2. Theory of Change: Deep explanation of path to impact.
      3. SMART Goals: Hard numbers, percentages, and deadlines.
      4. SWOT: Detailed internal/external analysis.
      5. M&E Plan: KPIs, tools (surveys, KIIs), and tracking mechanisms.
      6. Budget: Extreme detail (qty, monthly cost, freq) distributed across: ${categories}.
      Response must be JSON in English only.`;

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
