import { Lightbulb } from 'lucide-react';

interface ExplanationBoxProps {
  explanations: string[];
}

export function ExplanationBox({ explanations }: ExplanationBoxProps) {
  if (!explanations || explanations.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-amber-50/30">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-gray-900">修改意见与注解</h2>
      </div>
      <div className="p-6">
        <ul className="space-y-3">
          {explanations.map((explanation, index) => (
            <li key={index} className="flex gap-3 text-gray-700 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold mt-0.5">
                {index + 1}
              </span>
              <p className="text-base">{explanation}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
