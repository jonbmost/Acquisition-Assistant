
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, UploadIcon, PaperclipIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (text: string, file: File | null) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSend = () => {
    if ((text.trim() || file) && !isLoading) {
      onSendMessage(text.trim(), file);
      setText('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 flex items-end gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.md,.docx,.pdf"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-1.5 md:p-2 text-gray-400 hover:text-cyan-400 rounded-md transition-colors duration-200 flex-shrink-0"
        aria-label="Attach file"
      >
        <UploadIcon className="h-5 w-5 md:h-6 md:w-6" />
      </button>
      <div className="flex-1 flex flex-col">
        {file && (
          <div className="bg-gray-700 px-2 md:px-3 py-1.5 rounded-md mb-2 text-xs md:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-300">
              <PaperclipIcon className="h-3 w-3 md:h-4 md:w-4" />
              <span className="truncate">{file.name}</span>
            </div>
            <button onClick={removeFile} className="text-gray-400 hover:text-white text-lg">&times;</button>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Draft a SOO for a SaaS prototype..."
          className="w-full bg-transparent text-sm md:text-base text-gray-100 placeholder-gray-500 focus:outline-none resize-none max-h-32 md:max-h-48"
          rows={1}
          disabled={isLoading}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={isLoading || (!text.trim() && !file)}
        className="p-1.5 md:p-2 bg-cyan-500 text-white rounded-md transition-colors duration-200 flex-shrink-0 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-cyan-600"
        aria-label="Send message"
      >
        {isLoading ? (
          <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <SendIcon className="h-5 w-5 md:h-6 md:w-6" />
        )}
      </button>
    </div>
  );
};

export default ChatInput;
