import { GoogleGenAI, Type } from "@google/genai";

export type ProofreadScenario = '新闻出版 (严谨)' | '新媒体 (活泼)' | '公文写作 (规范)';

export interface ProofreadResult {
  corrected: string;
  explanations: string[];
}

const getAIClient = () => {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const apiKey = rawKey ? rawKey.trim() : '';
  
  if (!apiKey) {
    throw new Error("未找到 Gemini API Key，请在环境变量中配置 VITE_GEMINI_API_KEY 或 GEMINI_API_KEY");
  }
  
  return new GoogleGenAI({ apiKey });
};

export async function proofreadText(text: string, scenario: ProofreadScenario): Promise<ProofreadResult> {
  const ai = getAIClient();
  
  const scenarioPrompts = {
    '新闻出版 (严谨)': "你是一个资深的报社主编。请对以下中文文本进行极其严谨的校对。重点检查：1. 错别字、标点符号错误。2. 政治性差错审查（如领导人姓名、职务、地名、重大事件表述是否准确）。3. 语法错误和语病。4. 智能排版（段落缩进、全半角符号规范）。",
    '新媒体 (活泼)': "你是一个资深的新媒体编辑。请对以下中文文本进行校对和润色。重点检查：1. 错别字、标点符号错误。2. 优化句式，使其更符合网络阅读习惯，语言活泼、有网感。3. 适当增加分段，提升阅读体验。4. 智能排版。",
    '公文写作 (规范)': "你是一个资深的政府机关笔杆子。请对以下中文文本进行公文规范校对。重点检查：1. 错别字、标点符号错误。2. 政治性差错审查。3. 确保用词准确、庄重、严谨，符合党政机关公文格式规范。4. 逻辑结构清晰。"
  };

  const systemInstruction = `${scenarioPrompts[scenario]}\n\n请以 JSON 格式返回结果，包含 'corrected' (修改后的全文) 和 'explanations' (修改意见说明列表，解释为什么要这么改)。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: text,
    config: {
      systemInstruction,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          corrected: { type: Type.STRING },
          explanations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["corrected", "explanations"]
      }
    },
  });

  try {
    return JSON.parse(response.text || '{}') as ProofreadResult;
  } catch (e) {
    return {
      corrected: response.text || text,
      explanations: ["无法解析详细修改建议"]
    };
  }
}

