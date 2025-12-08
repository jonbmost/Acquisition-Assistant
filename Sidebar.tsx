
import React, { useRef } from 'react';
import type { KnowledgeDocument } from './types';
import { DocumentIcon, PlusIcon, TrashIcon } from './icons';

interface SidebarProps {
  documents: KnowledgeDocument[];
  onAddDocument: (file: File) => void;
  onRemoveDocument: (docId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ documents, onAddDocument, onRemoveDocument }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        onAddDocument(file);
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <aside className="w-64 bg-gray-800/50 border-r border-gray-700 flex flex-col p-4 shrink-0">
      <h2 className="text-lg font-semibold text-gray-200 mb-4">Knowledge Base</h2>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.md,.docx,.pdf"
        multiple
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 bg-cyan-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors duration-200 mb-4"
        aria-label="Add document to knowledge base"
      >
        <PlusIcon className="h-5 w-5" />
        Add Documents
      </button>
      <div className="flex-1 overflow-y-auto space-y-2 -mr-2 pr-2">
        {documents.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-4">
            Upload documents to provide context to the assistant.
          </p>
        )}
        {documents.map(doc => (
          <div key={doc.id} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between group">
            <div className="flex items-center gap-3 overflow-hidden">
              <DocumentIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-300 truncate" title={doc.name}>{doc.name}</span>
            </div>
            <button 
              onClick={() => onRemoveDocument(doc.id)}
              className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              aria-label={`Remove ${doc.name}`}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
