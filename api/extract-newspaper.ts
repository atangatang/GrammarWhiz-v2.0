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
    
    // Use Gemini 3.1 Pro for complex layout analysis
    const model = "gemini-3.1-pro-preview";

    const prompt = `你是一个顶尖的报纸数字化与版面分析专家。请对这个报纸PDF进行深度视觉分析与文字提取。
    
核心任务：
1. **版面布局分析**：首先识别报纸的物理分栏（Columns）。必须严格按照分栏逻辑提取文字，确保同一篇文章在跨栏时的上下文衔接完全正确，严禁将相邻栏目的不相关文字混淆。
2. **内容过滤**：自动识别并剔除：天气预报、农历、商业广告、中缝杂讯、报头版权声明等非新闻正文内容。
3. **结构化提取**：
   - 提取报纸的【出版日期】和【版次】（如：2026年2月26日 A01版）。
   - 识别每篇独立的新闻文章，提取：【标题】、【作者】（如有）、【正文】。
4. **输出规范**：
   - 顶部先列出日期和版次。
   - 每篇文章之间使用 '---' 作为明确的分割线。
   - 保持正文的段落结构，不要合并段落。

严格输出格式示例：
日期：[日期]
版次：[版次]

标题：[文章标题]
作者：[作者名/本报讯]
正文：[文章正文内容...]

---

标题：[下一篇文章标题]
...`;

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
