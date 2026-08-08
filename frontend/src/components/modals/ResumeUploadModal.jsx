import React, { useState, useRef } from "react";
import { FileText, X, UploadCloud } from "lucide-react";

export default function ResumeUploadModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file only.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB.");
      return;
    }

    setFile(file);
  };

  const handleAnalyze = () => {
    if (!file) return;
    alert(`Uploading and analyzing: ${file.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      {/* Modal Card */}
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 p-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Text */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">Upload Resume</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Upload your latest resume in PDF format to get matched with career
            paths.
          </p>
        </div>

        {/* Drop Zone Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/50"
              : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />

          {file ? (
            /* State: File Loaded View */
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-800 max-w-xs truncate">
                {file.name}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="text-xs text-red-500 font-semibold hover:underline mt-1"
              >
                Remove File
              </button>
            </div>
          ) : (
            /* State: Empty Dropzone View */
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-base font-semibold text-slate-700">
                Drag and drop your resume
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-4">PDF up to 5MB</p>

              <button
                type="button"
                className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
              >
                Browse Files
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={!file}
            className="bg-[#9fa2fc] hover:bg-[#8387fa] disabled:bg-[#c2c4fd] disabled:cursor-not-allowed text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            Analyze Resume
          </button>
        </div>
      </div>
    </div>
  );
}
