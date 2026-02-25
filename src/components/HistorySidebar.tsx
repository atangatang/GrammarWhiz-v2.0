import { X, Clock, Trash2 } from 'lucide-react';
import { ProofreadScenario } from '../lib/gemini';

export interface HistoryItem {
  id: string;
  timestamp: number;
  original: string;
  corrected: string;
  scenario: ProofreadScenario;
}

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export function HistorySidebar({ isOpen, onClose, history, onSelect, onClear }: HistorySidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            编校历史
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 py-12 text-sm">
              暂无编校记录
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all bg-white group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    {item.scenario}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                  {item.original}
                </p>
              </button>
            ))
          )}
        </div>
        
        {history.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={onClear}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              清空历史记录
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
