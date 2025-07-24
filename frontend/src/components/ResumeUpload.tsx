import React from 'react';

interface ResumeUploadProps {
  isLoading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resumeText: string;
  triggerFileUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({
  isLoading,
  onFileChange,
  resumeText,
  triggerFileUpload,
  fileInputRef,
}) => (
  <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
    <label htmlFor="resume-upload" className="block text-gray-700 text-lg font-medium mb-2">
      Upload Your Resume (.txt or .pdf file):
    </label>
    <input
      type="file"
      id="resume-upload"
      ref={fileInputRef}
      accept=".txt, .pdf"
      onChange={onFileChange}
      className="hidden"
    />
    <button
      onClick={triggerFileUpload}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Uploading & Parsing...
        </div>
      ) : (
        'Upload Resume & Find Jobs'
      )}
    </button>
    {resumeText && (
      <p className="mt-2 text-sm text-gray-600">
        File uploaded. Content will be parsed.
      </p>
    )}
  </div>
);

export default ResumeUpload; 