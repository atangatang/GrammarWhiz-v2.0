import { GoogleGenAI } from "@google/genai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { pdfBase64 } = req.body;
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "服务器配置错误：缺少 API Key。" });
  }

  if (!pdfBase64) {
    return res.status(400).json({ error: "缺少 PDF 数据" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    
    // Use Gemini 1.5 Pro or Flash which supports PDF
    // gemini-3-flash-preview also supports multimodal
    const model = "gemini-3-flash-preview";

    const prompt = `你是一个专业的报纸数字化专家。请分析这个报纸PDF文件。
要求：
1. 识别并提取所有新闻文章。
2. 必须正确处理分栏逻辑，确保文章正文上下文衔接自然，不要跨栏混淆。
3. 提取每篇文章的：标题、作者（如果有）、正文。
4. 提取报纸的：出版日期、版次（如 A01, 01版）。
5. 剔除所有无关信息：天气预报、农历、广告、报头无关杂讯。
6. 每篇文章之间用 '---' 分割线。
7. 严格按照以下格式输出：

日期：[日期]
版次：[版次]

标题：[文章1标题]
作者：[文章1作者]
正文：[文章1正文]

---

标题：[文章2标题]
作者：[文章2作者]
正文：[文章2正文]

...以此类推。`;

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: pdfBase64,
                mimeType: "application/pdf"
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        temperature: 0.1,
      },
    });

    const text = response.text;
    return res.status(200).json({ text });
  } catch (error: any) {
    console.error("Gemini PDF Extraction Error:", error);
    return res.status(500).json({ error: error.message || "PDF 解析失败" });
  }
}
