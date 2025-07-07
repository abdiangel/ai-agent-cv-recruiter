import React from "react";
import { User, Bot } from "lucide-react";
import { ChatMessageProps } from "../types/chat.js";
import { clsx } from "clsx";

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={clsx("flex items-start space-x-2 mb-4", isUser ? "flex-row-reverse space-x-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={clsx(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-600",
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message bubble */}
      <div className={clsx("chat-message", isUser ? "chat-message-user" : "chat-message-assistant")}>
        <div className="whitespace-pre-wrap">{message.content}</div>

        {/* Timestamp */}
        <div className={clsx("text-xs mt-1 opacity-70", isUser ? "text-right" : "text-left")}>{new Date(message.timestamp).toLocaleTimeString()}</div>
      </div>
    </div>
  );
};
