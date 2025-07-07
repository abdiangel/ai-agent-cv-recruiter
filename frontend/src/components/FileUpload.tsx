import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { FileUploadProps } from "../types/chat.js";
import { clsx } from "clsx";

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isUploading, error }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0]);
      }
    },
    [onFileUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={clsx(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-gray-400",
          isUploading && "opacity-50 cursor-not-allowed",
          error && "border-red-300 bg-red-50",
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-2">
          {isUploading ? (
            <Loader2 size={48} className="text-primary-500 animate-spin" />
          ) : error ? (
            <AlertCircle size={48} className="text-red-500" />
          ) : (
            <FileText size={48} className="text-gray-400" />
          )}

          <div className="text-sm text-gray-600">
            {isUploading ? (
              <p>Uploading your CV...</p>
            ) : isDragActive ? (
              <p>Drop your CV here...</p>
            ) : (
              <div>
                <p>
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, or TXT files up to 10MB</p>
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </div>

      {/* Upload button alternative */}
      <div className="mt-3 flex justify-center">
        <button
          onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
          disabled={isUploading}
          className="btn-secondary text-sm flex items-center space-x-2"
        >
          <Upload size={16} />
          <span>Choose File</span>
        </button>
      </div>
    </div>
  );
};
