export type ProofreadScenario = '新闻出版 (严谨)' | '新媒体 (活泼)' | '公文写作 (规范)';

export interface ProofreadResult {
  corrected: string;
  explanations: string[];
}

async function fetchWithRetry(url: string, options: any, maxRetries = 3): Promise<any> {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return await response.json();
      }
      
      const errorData = await response.json();
      lastError = new Error(errorData.error || `请求失败 (${response.status})`);
      
      // 如果是 429 错误，执行等待重试
      if (response.status === 429 && i < maxRetries) {
        const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000; // 指数退避: 2s, 4s, 8s...
        console.warn(`>>> [Retry] 触发频率限制，将在 ${Math.round(waitTime/1000)}秒后进行第 ${i + 1} 次重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      throw lastError;
    } catch (err: any) {
      lastError = err;
      if (i === maxRetries) throw lastError;
      
      // 网络错误也尝试重试
      const waitTime = 2000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw lastError;
}

export async function proofreadText(text: string, scenario: ProofreadScenario): Promise<ProofreadResult> {
  return fetchWithRetry("/api/proofread", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, scenario }),
  });
}

export async function extractNewspaper(pdfBase64: string): Promise<string> {
  const data = await fetchWithRetry("/api/extract-newspaper", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pdfBase64 }),
  });
  
  return data.text;
}


