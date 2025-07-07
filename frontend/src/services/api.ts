import axios, { AxiosInstance, AxiosError } from "axios";
import { ApiResponse, ChatMessageRequest, ChatMessageResponse, UploadCVResponse, UserSession, ApiError } from "../types/api.js";

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add request ID and timestamp
api.interceptors.request.use(
  (config) => {
    config.headers["X-Request-ID"] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    config.headers["X-Timestamp"] = new Date().toISOString();
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error("API Error:", error);

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const apiError: ApiError = {
        message: (error.response.data as any)?.error || error.message,
        code: error.response.status.toString(),
        details: error.response.data,
      };
      return Promise.reject(apiError);
    } else if (error.request) {
      // Network error
      const apiError: ApiError = {
        message: "Network error. Please check your connection.",
        code: "NETWORK_ERROR",
        details: error.request,
      };
      return Promise.reject(apiError);
    } else {
      // Other error
      const apiError: ApiError = {
        message: error.message || "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
        details: error,
      };
      return Promise.reject(apiError);
    }
  },
);

// API service class
export class ApiService {
  /**
   * Send a chat message
   */
  static async sendMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    try {
      const response = await api.post<ApiResponse<ChatMessageResponse>>("/chat/message", request);

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to send message");
      }

      return response.data.data!;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Upload a CV file
   */
  static async uploadCV(file: File, sessionId: string, userId?: string): Promise<UploadCVResponse> {
    try {
      const formData = new FormData();
      formData.append("cv", file);
      formData.append("sessionId", sessionId);
      if (userId) {
        formData.append("userId", userId);
      }

      const response = await api.post<ApiResponse<UploadCVResponse>>("/chat/upload-cv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to upload CV");
      }

      return response.data.data!;
    } catch (error) {
      console.error("Error uploading CV:", error);
      throw error;
    }
  }

  /**
   * Get session details
   */
  static async getSession(sessionId: string): Promise<UserSession> {
    try {
      const response = await api.get<ApiResponse<UserSession>>(`/chat/session/${sessionId}`);

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to get session");
      }

      return response.data.data!;
    } catch (error) {
      console.error("Error getting session:", error);
      throw error;
    }
  }

  /**
   * End a session
   */
  static async endSession(sessionId: string, reason?: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse>("/chat/end-session", {
        sessionId,
        reason,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to end session");
      }
    } catch (error) {
      console.error("Error ending session:", error);
      throw error;
    }
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await api.get("/system/health");
      return response.status === 200;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }
}

export default ApiService;
