import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { DiffViewer } from './components/DiffViewer';
import { HistorySidebar, HistoryItem } from './components/HistorySidebar';
import { proofreadText, ProofreadScenario } from './lib/gemini';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [correctedText, setCorrectedText] = useState<string | null>(null);
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

    try {
      const result = await proofreadText(text, scenario);
      setCorrectedText(result);

      const newItem: HistoryItem = {
        id: uuidv4(),
        timestamp: Date.now(),
        original: text,
        corrected: result,
        scenario,
      };

      setHistory(prev => {
        const newHistory = [newItem, ...prev].slice(0, 50);
        localStorage.setItem('grammarwhiz_history', JSON.stringify(newHistory));
        return newHistory;
      });
    } catch (error: any) {
      console.error('Proofreading failed:', error);
      alert(`编校失败: ${error?.message || '未知错误'}\n\n排查建议：\n1. 环境变量未生效：在 Vercel 填入 Key 后，必须点击 "Deploy" 重新部署一次。\n2. 网络连接失败：前端直接调用 API，国内网络需开启全局代理（确保代理规则包含 googleapis.com）。\n3. API Key 无效或受限。`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptAll = (text: string) => {
    setOriginalText(text);
    setCorrectedText(null);
    localStorage.setItem('gw_draft', text);
  };

  const handleRejectAll = () => {
    setCorrectedText(null);
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setOriginalText(item.original);
    setCorrectedText(item.corrected);
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
            基于 Google Gemini 驱动，专为新闻出版、新媒体和公文写作打造的智能编校工具。
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
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 text-center sm:text-left">
            &copy; 2026 GrammarWhiz Powered by Google Gemini.
          </p>
          <p className="text-sm text-gray-500 font-medium text-center sm:text-right">
            创意设计 :老妖
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
