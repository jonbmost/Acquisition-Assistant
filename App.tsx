
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import type { KnowledgeDocument } from './types';
import { MAX_DOCUMENT_LENGTH } from './constants';

const KNOWLEDGE_BASE_STORAGE_KEY = 'ait-knowledge-base';

const App: React.FC = () => {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeDocument[]>([]);

  // Load knowledge base from localStorage on initial render
  useEffect(() => {
    try {
      const storedDocs = localStorage.getItem(KNOWLEDGE_BASE_STORAGE_KEY);
      if (storedDocs) {
        setKnowledgeBase(JSON.parse(storedDocs));
      }
    } catch (error) {
      console.error("Failed to load knowledge base from localStorage:", error);
      // If parsing fails, clear the corrupted data
      localStorage.removeItem(KNOWLEDGE_BASE_STORAGE_KEY);
    }
  }, []);

  // Save knowledge base to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(KNOWLEDGE_BASE_STORAGE_KEY, JSON.stringify(knowledgeBase));
    } catch (error) {
      console.error("Failed to save knowledge base to localStorage:", error);
    }
  }, [knowledgeBase]);

  const handleAddDocument = async (file: File) => {
    try {
      // Note: This will only read text-based content correctly.
      // For .docx and .pdf, it would require client-side parsing libraries.
      const content = await file.text();
      let processedContent = content;

      if (content.length > MAX_DOCUMENT_LENGTH) {
        processedContent = content.substring(0, MAX_DOCUMENT_LENGTH) + "\n\n... [Content truncated for brevity] ...";
        console.warn(`Knowledge base document "${file.name}" was truncated to ${MAX_DOCUMENT_LENGTH} characters.`);
      }

      const newDoc: KnowledgeDocument = {
        id: `doc-${Date.now()}-${Math.random()}`,
        name: file.name,
        content: processedContent,
      };
      setKnowledgeBase(prev => [...prev, newDoc]);
    } catch (error) {
      console.error("Error reading file:", error);
      alert(`Error reading file: ${file.name}. Please ensure it's a text-based file.`);
    }
  };

  const handleRemoveDocument = (docId: string) => {
    setKnowledgeBase(prev => prev.filter(doc => doc.id !== docId));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          documents={knowledgeBase} 
          onAddDocument={handleAddDocument}
          onRemoveDocument={handleRemoveDocument}
        />
        <main className="flex-1 overflow-hidden">
          <ChatWindow knowledgeBase={knowledgeBase} />
        </main>
      </div>
    </div>
  );
};

export default App;
