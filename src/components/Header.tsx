import { BookOpenCheck, History } from 'lucide-react';

interface HeaderProps {
  onToggleHistory: () => void;
}

export function Header({ onToggleHistory }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            GrammarWhiz v2.0
            <span className="hidden sm:inline-block text-gray-500 font-normal text-sm ml-2 border-l border-gray-300 pl-3">中文智能编校工作台</span>
          </h1>
        </div>
        <button
          onClick={onToggleHistory}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          title="历史记录"
        >
          <History className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
