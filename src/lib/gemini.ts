export type ProofreadScenario = '新闻出版 (严谨)' | '新媒体 (活泼)' | '公文写作 (规范)';

export interface ProofreadResult {
  corrected: string;
  explanations: string[];
}

export async function proofreadText(text: string, scenario: ProofreadScenario): Promise<ProofreadResult> {
  const response = await fetch("/api/proofread", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, scenario }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "请求失败");
  }

  return response.json();
}

export async function extractNewspaper(pdfBase64: string): Promise<string> {
  const response = await fetch("/api/extract-newspaper", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pdfBase64 }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "PDF 解析失败");
  }

  const data = await response.json();
  return data.text;
}


