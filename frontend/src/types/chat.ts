import { ChatMessage } from "./api.js";

// Chat state types
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string;
  userId?: string;
  isTyping: boolean;
}

export interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedFile: File | null;
}

export interface ChatInputState {
  message: string;
  isValid: boolean;
  isSending: boolean;
}

// Component props
export interface ChatMessageProps {
  message: ChatMessage;
}

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
  error?: string | null;
  accept?: string;
}

// Utility types
export type MessageRole = "user" | "assistant";

export interface ChatContext {
  state: ChatState;
  actions: {
    sendMessage: (message: string) => Promise<void>;
    uploadFile: (file: File) => Promise<void>;
    clearError: () => void;
    resetChat: () => void;
  };
}
