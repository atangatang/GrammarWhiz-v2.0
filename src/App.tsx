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
    } catch (error) {
      console.error('Proofreading failed:', error);
      alert('编校失败，请稍后重试。');
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
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
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
      </main>

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
