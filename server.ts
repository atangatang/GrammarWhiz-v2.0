import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Proxy Route
  app.post("/api/proofread", async (req, res) => {
    const { text, scenario } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Server configuration error: Missing API Key" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      
      const scenarioPrompts = {
        '新闻出版 (严谨)': "你是一个资深的报社主编。请对以下中文文本进行极其严谨的校对。重点检查：1. 错别字、标点符号错误。2. 政治性差错审查（如领导人姓名、职务、地名、重大事件表述是否准确）。3. 语法错误和语病。4. 智能排版（段落缩进、全半角符号规范）。",
        '新媒体 (活泼)': "你是一个资深的新媒体编辑。请对以下中文文本进行校对和润色。重点检查：1. 错别字、标点符号错误。2. 优化句式，使其更符合网络阅读习惯，语言活泼、有网感。3. 适当增加分段，提升阅读体验。4. 智能排版。",
        '公文写作 (规范)': "你是一个资深的政府机关笔杆子。请对以下中文文本进行公文规范校对。重点检查：1. 错别字、标点符号错误。2. 政治性差错审查。3. 确保用词准确、庄重、严谨，符合党政机关公文格式规范。4. 逻辑结构清晰。"
      };

      const today = new Date().toISOString().split('T')[0];
      const systemInstruction = `${scenarioPrompts[scenario as keyof typeof scenarioPrompts]}\n\n今日日期是：${today}。请以此作为时间基准，不要误判正确的日期表述。请以 JSON 格式返回结果，包含 'corrected' (修改后的全文) 和 'explanations' (修改意见说明列表，解释为什么要这么改)。`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash-latest",
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

      res.json(JSON.parse(response.text || '{}'));
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
