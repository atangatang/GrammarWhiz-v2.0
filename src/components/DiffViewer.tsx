import { useState, useMemo } from 'react';
import { Check, X, Copy, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';
import { Diff, computeDiff } from '../lib/diff';

interface DiffViewerProps {
  original: string;
  corrected: string;
  onAcceptAll: (text: string) => void;
  onRejectAll: () => void;
  onClose: () => void;
}

export function DiffViewer({ original, corrected, onAcceptAll, onRejectAll, onClose }: DiffViewerProps) {
  const [copied, setCopied] = useState(false);

  const diffs = useMemo(() => computeDiff(original, corrected), [original, corrected]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(corrected);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderDiff = () => {
    return diffs.map((diff, index) => {
      const [operation, text] = diff;
      if (operation === -1) { // DELETE
        return (
          <del key={index} className="bg-red-100 text-red-800 line-through decoration-red-500/50 px-1 mx-0.5 rounded-sm">
            {text}
          </del>
        );
      }
      if (operation === 1) { // INSERT
        return (
          <ins key={index} className="bg-emerald-100 text-emerald-800 font-bold no-underline px-1 mx-0.5 rounded-sm">
            {text}
          </ins>
        );
      }
      return <span key={index} className="text-gray-800">{text}</span>; // EQUAL
    });
  };

  const hasChanges = diffs.some(([op]) => op !== 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          智能编校结果
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
            title="复制结果"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? '已复制' : '复制'}</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto whitespace-pre-wrap leading-relaxed text-base font-sans">
        {hasChanges ? renderDiff() : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
            <AlertCircle className="w-12 h-12 text-emerald-500/50" />
            <p className="text-lg font-medium text-gray-700">未发现明显的语法、拼写或政治性差错。</p>
            <p className="text-sm">您的文本已经很完美了！</p>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <button
          onClick={onRejectAll}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>拒绝更改</span>
        </button>
        
        <button
          onClick={() => onAcceptAll(corrected)}
          disabled={!hasChanges}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          <Check className="w-4 h-4" />
          <span>一键采纳</span>
        </button>
      </div>
    </div>
  );
}
