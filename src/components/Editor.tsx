import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, Upload, FileText } from 'lucide-react';
import { ProofreadScenario } from '../lib/gemini';
import * as mammoth from 'mammoth';

interface EditorProps {
  onProofread: (text: string, scenario: ProofreadScenario) => void;
  isProcessing: boolean;
  initialText?: string;
}

export function Editor({ onProofread, isProcessing, initialText = '' }: EditorProps) {
  const [text, setText] = useState(initialText);
  const [scenario, setScenario] = useState<ProofreadScenario>('新闻出版 (严谨)');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    } else {
      const savedDraft = localStorage.getItem('gw_draft');
      if (savedDraft) {
        setText(savedDraft);
      }
    }
  }, [initialText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    localStorage.setItem('gw_draft', newText);
  };

  const wordCount = text.trim().length;

  const handleProofread = () => {
    if (text.trim() && !isProcessing) {
      onProofread(text, scenario);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    try {
      if (fileExtension === 'txt') {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const newText = event.target.result as string;
            setText(newText);
            localStorage.setItem('gw_draft', newText);
          }
        };
        reader.readAsText(file);
      } else if (fileExtension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (result.value) {
          setText(result.value);
          localStorage.setItem('gw_draft', result.value);
        }
      } else {
        alert('不支持的文件格式，请上传 .txt 或 .docx 文件。');
      }
    } catch (error) {
      console.error('File parsing error:', error);
      alert("解析失败，请检查文件格式是否正确。");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">应用场景：</span>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value as ProofreadScenario)}
              className="text-sm bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow"
              disabled={isProcessing}
            >
              <option value="新闻出版 (严谨)">新闻出版 (严谨)</option>
              <option value="新媒体 (活泼)">新媒体 (活泼)</option>
              <option value="公文写作 (规范)">公文写作 (规范)</option>
            </select>
          </div>
          
          <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">导入文档 (txt/docx)</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.docx"
            className="hidden"
          />
        </div>
        <div className="text-sm text-gray-500 font-mono flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          {wordCount} 字
        </div>
      </div>
      
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="在此输入需要校对的中文文本，或点击上方导入文档..."
        className="flex-1 w-full p-6 resize-none focus:outline-none text-gray-800 leading-relaxed text-base"
        disabled={isProcessing}
      />
      
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
        <button
          onClick={handleProofread}
          disabled={!text.trim() || isProcessing}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI 正在校对...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>开始智能编校</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
