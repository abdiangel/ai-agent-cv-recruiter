import React, { useState } from "react";
import { ChatWindow } from "./components/ChatWindow.js";
import { ChatInput } from "./components/ChatInput.js";
import { FileUpload } from "./components/FileUpload.js";
import { ErrorMessage } from "./components/ErrorMessage.js";
import { useChat } from "./hooks/useChat.js";
import { Upload, MessageSquare, RotateCcw } from "lucide-react";
import { clsx } from "clsx";

function App() {
  const { chatState, fileUploadState, actions } = useChat();
  const [showUpload, setShowUpload] = useState(false);

  const handleSendMessage = async (message: string) => {
    await actions.sendMessage(message);
  };

  const handleFileUpload = async (file: File) => {
    await actions.uploadFile(file);
    setShowUpload(false);
  };

  const handleClearError = () => {
    actions.clearError();
  };

  const handleResetChat = () => {
    if (confirm("Are you sure you want to reset the chat? This will clear all messages.")) {
      actions.resetChat();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <MessageSquare size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Agent Recruiter</h1>
                <p className="text-sm text-gray-500">Session: {chatState.sessionId.split("_")[1]}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowUpload(!showUpload)}
                className={clsx("btn-secondary flex items-center space-x-2", showUpload && "bg-primary-100 text-primary-700")}
              >
                <Upload size={16} />
                <span>Upload CV</span>
              </button>

              <button onClick={handleResetChat} className="btn-secondary flex items-center space-x-2" title="Reset Chat">
                <RotateCcw size={16} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col">
        {/* Error messages */}
        {chatState.error && (
          <div className="p-4">
            <ErrorMessage error={chatState.error} onDismiss={handleClearError} />
          </div>
        )}

        {fileUploadState.error && (
          <div className="p-4">
            <ErrorMessage error={fileUploadState.error} onDismiss={handleClearError} />
          </div>
        )}

        {/* File upload section */}
        {showUpload && (
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload Your CV</h2>
              <p className="text-sm text-gray-600">Upload your CV to get personalized assistance with your job search and career development.</p>
            </div>

            <FileUpload onFileUpload={handleFileUpload} isUploading={fileUploadState.isUploading} error={fileUploadState.error} />
          </div>
        )}

        {/* Chat window */}
        <ChatWindow messages={chatState.messages} isLoading={chatState.isLoading} isTyping={chatState.isTyping} />

        {/* Chat input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSendMessage={handleSendMessage} isLoading={chatState.isLoading} disabled={fileUploadState.isUploading} />

            {/* Status indicators */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Messages: {chatState.messages.length}</span>
                {fileUploadState.uploadedFile && <span className="text-green-600">CV: {fileUploadState.uploadedFile.name}</span>}
              </div>

              <div className="flex items-center space-x-2">
                {chatState.isLoading && <span className="text-primary-600">Processing...</span>}
                {fileUploadState.isUploading && <span className="text-primary-600">Uploading...</span>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
