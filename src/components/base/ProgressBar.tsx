
interface ProgressBarProps {
  progress: number;
  total?: number;
  className?: string;
}

export default function ProgressBar({ progress, total = 100, className = '' }: ProgressBarProps) {
  const percentage = total > 0 ? Math.min((progress / total) * 100, 100) : 0;
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Progresso: {progress} de {total}
        </span>
        <span className="text-sm font-medium text-purple-600">
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
