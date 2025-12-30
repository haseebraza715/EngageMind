import React, { useState, useCallback } from 'react';
import axios from '../../api/axiosChat';
import { FiUpload, FiX, FiFile } from 'react-icons/fi';

export default function DocumentUploader({ onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const API_ENDPOINT = '/api/upload';

  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus(`Selected: ${selectedFile.name}`);
      setError(null);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading...');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(API_ENDPOINT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',

          'Authorization': 'Bearer a37877e87fd73f58bc26ed2e26b53857b1b16bb64dfde43872c4cb1c1b944942',
        },
      });
      setUploadStatus('Upload successful!');
      if (onUploadSuccess) onUploadSuccess(response.data);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.log('Upload error:', err.response); // Log the full error for debugging
      const errorMessage = err.response?.data?.error || 'Upload failed. Please try again.';
      setError(errorMessage);
      setUploadStatus('');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-teal-500" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <FiUpload className="text-primary-500" />
            Upload Document
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* File Input */}
        <div className="mb-6">
          <div className="relative group">
            <input
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${isUploading
                ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 cursor-not-allowed'
                : 'border-neutral-300 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-500 bg-neutral-50/50 dark:bg-white/5 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'
                }`}
            >
              {file ? (
                <div className="flex flex-col items-center gap-3 text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <FiFile size={24} />
                  </div>
                  <span className="text-sm font-medium text-neutral-900 dark:text-white break-all max-w-full px-2">{file.name}</span>
                  <span className="text-xs text-neutral-500">Click to change</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-500 dark:text-neutral-400">
                  <FiUpload size={32} className="opacity-50 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm font-medium">Click to select a file</span>
                  <span className="text-xs opacity-70">PDF, DOCX, TXT</span>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Status and Error Messages */}
        {uploadStatus && !error && (
          <div className="mb-4 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm text-center font-medium border border-primary-100 dark:border-primary-800/30">
            {uploadStatus}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center font-medium border border-red-100 dark:border-red-800/30">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !file}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-primary-500/25 transition-all duration-200 ${isUploading || !file
              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 hover:scale-[1.02]'
              }`}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <FiUpload size={16} />
                <span>Upload</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
