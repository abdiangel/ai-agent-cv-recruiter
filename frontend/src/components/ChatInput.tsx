import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { ChatInputProps } from "../types/chat.js";
import { clsx } from "clsx";

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, disabled = false }) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-2">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          className={clsx("chat-input resize-none min-h-[2.5rem] max-h-32 pr-12", disabled && "opacity-50 cursor-not-allowed")}
          disabled={disabled || isLoading}
          rows={1}
        />

        {/* Character count */}
        {message.length > 0 && <div className="absolute bottom-2 right-2 text-xs text-gray-500">{message.length}/5000</div>}
      </div>

      <button
        type="submit"
        disabled={!message.trim() || isLoading || disabled}
        className={clsx("btn-primary flex items-center justify-center min-w-[2.5rem] h-10", "transition-all duration-200")}
      >
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
      </button>
    </form>
  );
};
