import { GoogleGenAI } from "@google/genai";

export type ProofreadScenario = '新闻出版 (严谨)' | '新媒体 (活泼)' | '公文写作 (规范)';

const getAIClient = () => {
  // 兼容 Vercel 中设置的 VITE_GEMINI_API_KEY 或默认的 GEMINI_API_KEY
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const apiKey = rawKey ? rawKey.trim() : '';
  
  if (!apiKey) {
    throw new Error("未找到 Gemini API Key，请在环境变量中配置 VITE_GEMINI_API_KEY 或 GEMINI_API_KEY");
  }
  
  return new GoogleGenAI({ apiKey });
};

export async function proofreadText(text: string, scenario: ProofreadScenario): Promise<string> {
  const ai = getAIClient();
  
  const scenarioPrompts = {
    '新闻出版 (严谨)': "你是一个资深的报社主编。请对以下中文文本进行极其严谨的校对。重点检查：1. 错别字、标点符号错误。2. 政治性差错审查（如领导人姓名、职务、地名、重大事件表述是否准确）。3. 语法错误和语病。4. 智能排版（段落缩进、全半角符号规范）。请直接输出修改后的文本，保持原文整体结构不变，只做必要的修正。",
    '新媒体 (活泼)': "你是一个资深的新媒体编辑。请对以下中文文本进行校对和润色。重点检查：1. 错别字、标点符号错误。2. 优化句式，使其更符合网络阅读习惯，语言活泼、有网感。3. 适当增加分段，提升阅读体验。4. 智能排版。请直接输出修改后的文本，保持原文核心意思不变。",
    '公文写作 (规范)': "你是一个资深的政府机关笔杆子。请对以下中文文本进行公文规范校对。重点检查：1. 错别字、标点符号错误。2. 政治性差错审查。3. 确保用词准确、庄重、严谨，符合党政机关公文格式规范。4. 逻辑结构清晰。请直接输出修改后的文本，保持原文整体结构不变。"
  };

  const systemInstruction = scenarioPrompts[scenario];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: text,
    config: {
      systemInstruction,
      temperature: 0.1, // Lower temperature for more deterministic proofreading
    },
  });

  return response.text || text;
}

