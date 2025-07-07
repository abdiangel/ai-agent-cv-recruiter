import React from "react";
import { AlertCircle, X } from "lucide-react";
import { clsx } from "clsx";

interface ErrorMessageProps {
  error: string;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onDismiss, className }) => {
  return (
    <div className={clsx("bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3", className)}>
      <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />

      <div className="flex-1">
        <p className="text-red-800 text-sm">{error}</p>
      </div>

      {onDismiss && (
        <button onClick={onDismiss} className="text-red-500 hover:text-red-700 flex-shrink-0">
          <X size={16} />
        </button>
      )}
    </div>
  );
};
