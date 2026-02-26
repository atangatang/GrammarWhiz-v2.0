import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { DiffViewer } from './components/DiffViewer';
import { ExplanationBox } from './components/ExplanationBox';
import { HistorySidebar, HistoryItem } from './components/HistorySidebar';
import { proofreadText, ProofreadScenario } from './lib/gemini';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [correctedText, setCorrectedText] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('grammarwhiz_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const handleProofread = async (text: string, scenario: ProofreadScenario) => {
    setIsProcessing(true);
    setOriginalText(text);
    setCorrectedText(null);
    setExplanations([]);

    try {
      console.log(">>> [Client] Sending request to /api/proofread...");
      const result = await proofreadText(text, scenario);
      console.log(">>> [Client] Proofreading success:", result);
      setCorrectedText(result.corrected);
      setExplanations(result.explanations);

      const newItem: HistoryItem = {
        id: uuidv4(),
        timestamp: Date.now(),
        original: text,
        corrected: result.corrected,
        explanations: result.explanations,
        scenario,
      };

      setHistory(prev => {
        const newHistory = [newItem, ...prev].slice(0, 50);
        localStorage.setItem('grammarwhiz_history', JSON.stringify(newHistory));
        return newHistory;
      });
    } catch (error: any) {
      console.error('>>> [Client] Proofreading failed:', error);
      let friendlyMessage = error?.message || '未知错误';
      
      if (friendlyMessage.includes('Unexpected token') || friendlyMessage.includes('is not valid JSON')) {
        console.error(">>> [Client] JSON Parse Error. The server might have returned an HTML error page.");
        friendlyMessage = "接口调用失败（返回了非 JSON 数据）。这通常是由于 Vercel 路由配置问题或后端服务未启动导致的。";
      } else if (friendlyMessage.includes('429') || friendlyMessage.includes('quota') || friendlyMessage.includes('RESOURCE_EXHAUSTED')) {
        friendlyMessage = "操作太快啦！已达到 Google Gemini API 的免费频率限制。请稍等 1 分钟后再试。";
      }

      alert(`编校失败: ${friendlyMessage}\n\n排查建议：\n1. 频率限制：免费版 API 每分钟请求次数有限，请稍后再试。\n2. 环境变量未生效：在 Vercel 填入 Key 后，必须点击 "Deploy" 重新部署一次。\n3. API Key 无效或受限。`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptAll = (text: string) => {
    setOriginalText(text);
    setCorrectedText(null);
    setExplanations([]);
    localStorage.setItem('gw_draft', text);
  };

  const handleRejectAll = () => {
    setCorrectedText(null);
    setExplanations([]);
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setOriginalText(item.original);
    setCorrectedText(item.corrected);
    setExplanations(item.explanations || []);
    localStorage.setItem('gw_draft', item.original);
  };

  const handleClearHistory = () => {
    if (window.confirm('确定要清空所有历史记录吗？')) {
      setHistory([]);
      localStorage.removeItem('grammarwhiz_history');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header onToggleHistory={() => setIsHistoryOpen(true)} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Hero Section */}
        <div className="text-center mb-8 mt-4 sm:mt-8">
          <h2 className="text-2xl sm:text-3xl text-gray-800 font-medium tracking-tight">
            让你的文字更<span className="text-4xl sm:text-5xl font-bold text-emerald-600 mx-1">专业</span>、更<span className="text-4xl sm:text-5xl font-bold text-emerald-600 mx-1">流畅</span>
          </h2>
          <p className="mt-4 text-gray-500 text-sm sm:text-base">
            基于 Google Gemini 驱动，专为新闻出版、新媒体和公文写作打造的智能编校工具
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          <div className="flex-1 min-h-[500px] lg:min-h-0">
            <Editor
              onProofread={handleProofread}
              isProcessing={isProcessing}
              initialText={originalText}
            />
          </div>
          
          {correctedText && (
            <div className="flex-1 min-h-[500px] lg:min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <DiffViewer
                original={originalText}
                corrected={correctedText}
                onAcceptAll={handleAcceptAll}
                onRejectAll={handleRejectAll}
                onClose={() => setCorrectedText(null)}
              />
            </div>
          )}
        </div>

        {correctedText && explanations.length > 0 && (
          <ExplanationBox explanations={explanations} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 text-center sm:text-left">
            &copy; 2026 GrammarWhiz Powered by Google Gemini.
          </p>
          <p className="text-sm text-gray-500 font-medium text-center sm:text-right">
            制作设计 :老妖
          </p>
        </div>
      </footer>

      {isHistoryOpen && (
        <HistorySidebar
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          onSelect={handleSelectHistory}
          onClear={handleClearHistory}
        />
      )}
    </div>
  );
}
