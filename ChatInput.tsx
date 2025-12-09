
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, UploadIcon, PaperclipIcon } from './icons';
import type { KnowledgeDocument } from './types';

interface ChatInputProps {
  onSendMessage: (text: string, file: File | null) => void;
  isLoading: boolean;
  knowledgeBase: KnowledgeDocument[];
  onAddDocument: (file: File) => Promise<void>;
  onRemoveDocument: (docId: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, knowledgeBase, onAddDocument, onRemoveDocument }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kbFileInputRef = useRef<HTMLInputElement>(null);
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

  const handleKBFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onAddDocument(e.target.files[0]);
      if (kbFileInputRef.current) {
        kbFileInputRef.current.value = '';
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const userDocuments = knowledgeBase.filter(doc => !doc.isFromRepo);

  return (
    <div className="flex flex-col gap-2">
      {/* Knowledge Base Management */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
        <button
          onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
          className="w-full flex items-center justify-between text-sm text-gray-300 hover:text-cyan-400 transition-colors"
        >
          <span className="font-semibold">Knowledge Base ({userDocuments.length} documents)</span>
          <span className="text-xl">{showKnowledgeBase ? '−' : '+'}</span>
        </button>
        
        {showKnowledgeBase && (
          <div className="mt-3 space-y-2">
            <input
              type="file"
              ref={kbFileInputRef}
              onChange={handleKBFileChange}
              className="hidden"
              accept=".txt,.md,.docx,.pdf"
            />
            <button
              onClick={() => kbFileInputRef.current?.click()}
              className="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-sm transition-colors flex items-center justify-center gap-2"
            >
              <UploadIcon className="h-4 w-4" />
              Upload Document
            </button>
            
            {userDocuments.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {userDocuments.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded text-xs">
                    <span className="truncate text-gray-300">{doc.name}</span>
                    <button
                      onClick={() => onRemoveDocument(doc.id)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Input */}
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
        className="p-2 text-gray-400 hover:text-cyan-400 rounded-md transition-colors duration-200 flex-shrink-0"
        aria-label="Attach file"
      >
        <UploadIcon className="h-6 w-6" />
      </button>
      <div className="flex-1 flex flex-col">
        {file && (
          <div className="bg-gray-700 px-3 py-1.5 rounded-md mb-2 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-300">
              <PaperclipIcon className="h-4 w-4" />
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
          className="w-full bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none resize-none max-h-48"
          rows={1}
          disabled={isLoading}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={isLoading || (!text.trim() && !file)}
        className="p-2 bg-cyan-500 text-white rounded-md transition-colors duration-200 flex-shrink-0 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-cyan-600"
        aria-label="Send message"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <SendIcon className="h-6 w-6" />
        )}
      </button>
    </div>
    </div>
  );
};

export default ChatInput;
