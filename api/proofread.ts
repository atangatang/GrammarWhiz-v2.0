import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  console.log(">>> [API] Request received:", req.method, req.url);
  
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    console.warn(">>> [API] Method not allowed:", req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, scenario } = req.body;
  console.log(">>> [API] Scenario:", scenario);
  console.log(">>> [API] Text length:", text?.length);

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error(">>> [API] Missing API Key in environment variables");
    return res.status(500).json({ error: "服务器配置错误：缺少 API Key。请在 Vercel 环境变量中设置 VITE_GEMINI_API_KEY。" });
  }

  console.log(">>> [API] API Key found (starts with):", apiKey.substring(0, 4) + "...");

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    
    const scenarioPrompts = {
      '新闻出版 (严谨)': "你是一个资深的报社主编。请对以下中文文本进行极其严谨的校对。重点检查：1. 错别字、标点符号错误。2. 政治性差错审查（如领导人姓名、职务、地名、重大事件表述是否准确）。3. 语法错误和语病。4. 智能排版（段落缩进、全半角符号规范）。",
      '新媒体 (活泼)': "你是一个资深的新媒体编辑。请对以下中文文本进行校对和润色。重点检查：1. 错别字、标点符号错误。2. 优化句式，使其更符合网络阅读习惯，语言活泼、有网感。3. 适当增加分段，提升阅读体验。4. 智能排版。",
      '公文写作 (规范)': "你是一个资深的政府机关笔杆子。请对以下中文文本进行公文规范校对。重点检查：1. 错别字、标点符号错误。2. 政治性差错审查。3. 确保用词准确、庄重、严谨，符合党政机关公文格式规范。4. 逻辑结构清晰。"
    };

    const today = new Date().toISOString().split('T')[0];
    const systemInstruction = `${scenarioPrompts[scenario as keyof typeof scenarioPrompts]}\n\n今日日期是：${today}。请以此作为时间基准，不要误判正确的日期表述。请以 JSON 格式返回结果，包含 'corrected' (修改后的全文) 和 'explanations' (修改意见说明列表，解释为什么要这么改)。`;

    console.log(">>> [API] Calling Gemini API...");
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

    console.log(">>> [API] Gemini API response received");
    const result = JSON.parse(response.text || '{}');
    console.log(">>> [API] Response parsed successfully");
    return res.status(200).json(result);
  } catch (error: any) {
    console.error(">>> [API] Gemini API Error:", error);
    return res.status(500).json({ error: error.message || "内部服务器错误" });
  }
}
