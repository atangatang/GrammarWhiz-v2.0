import React, { useState, useRef } from 'react';
import { FileText, Upload, Loader2, AlertCircle } from 'lucide-react';
import { extractNewspaper } from '../lib/gemini';

interface NewspaperImporterProps {
  onImport: (text: string) => void;
}

export function NewspaperImporter({ onImport }: NewspaperImporterProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('请上传 PDF 格式的报纸文件');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const extractedText = await extractNewspaper(base64);
          onImport(extractedText);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
          setError(err.message || '解析失败，请重试');
        } finally {
          setIsExtracting(false);
        }
      };
      reader.onerror = () => {
        setError('文件读取失败');
        setIsExtracting(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('处理文件时出错');
      setIsExtracting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isExtracting}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-sm border ${
          isExtracting 
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
            : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 active:scale-95'
        }`}
      >
        {isExtracting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span>{isExtracting ? '正在智能解析报纸...' : '导入报纸 PDF'}</span>
      </button>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
