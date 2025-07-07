import { useState, useCallback } from "react";
import { ChatState, FileUploadState } from "../types/chat.js";
import { ChatMessage, ApiError } from "../types/api.js";
import { ApiService } from "../services/api.js";
import { SessionManager } from "../utils/sessionManager.js";

export const useChat = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    sessionId: SessionManager.getSessionId(),
    userId: SessionManager.getUserId() || undefined,
    isTyping: false,
  });

  const [fileUploadState, setFileUploadState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedFile: null,
  });

  const addMessage = useCallback((message: Omit<ChatMessage, "id">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: SessionManager.generateMessageId(),
    };

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      try {
        setChatState((prev) => ({ ...prev, isLoading: true, error: null, isTyping: true }));

        // Add user message
        addMessage({
          role: "user",
          content,
          timestamp: new Date().toISOString(),
        });

        // Send to API
        const response = await ApiService.sendMessage({
          message: content,
          sessionId: chatState.sessionId,
          userId: chatState.userId,
          metadata: SessionManager.getUserMetadata(),
        });

        // Add assistant response
        addMessage({
          role: "assistant",
          content: response.response,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        const apiError = error as ApiError;
        setChatState((prev) => ({
          ...prev,
          error: apiError.message || "Failed to send message",
        }));
      } finally {
        setChatState((prev) => ({ ...prev, isLoading: false, isTyping: false }));
      }
    },
    [chatState.sessionId, chatState.userId, addMessage],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        setFileUploadState((prev) => ({ ...prev, isUploading: true, error: null }));

        const response = await ApiService.uploadCV(file, chatState.sessionId, chatState.userId);

        setFileUploadState((prev) => ({ ...prev, uploadedFile: file }));

        // Add success message
        addMessage({
          role: "assistant",
          content: `CV uploaded successfully! I've analyzed your resume and found:\n\n${response.extractedText ? response.extractedText.substring(0, 200) + "..." : "Your CV has been processed and is ready for analysis."}`,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        const apiError = error as ApiError;
        setFileUploadState((prev) => ({
          ...prev,
          error: apiError.message || "Failed to upload CV",
        }));
      } finally {
        setFileUploadState((prev) => ({ ...prev, isUploading: false }));
      }
    },
    [chatState.sessionId, chatState.userId, addMessage],
  );

  const clearError = useCallback(() => {
    setChatState((prev) => ({ ...prev, error: null }));
    setFileUploadState((prev) => ({ ...prev, error: null }));
  }, []);

  const resetChat = useCallback(() => {
    SessionManager.clearSession();
    const newSessionId = SessionManager.getSessionId();

    setChatState({
      messages: [],
      isLoading: false,
      error: null,
      sessionId: newSessionId,
      userId: SessionManager.getUserId() || undefined,
      isTyping: false,
    });

    setFileUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedFile: null,
    });
  }, []);

  return {
    chatState,
    fileUploadState,
    actions: {
      sendMessage,
      uploadFile,
      clearError,
      resetChat,
    },
  };
};
