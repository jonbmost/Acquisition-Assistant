
import React, { useState, useEffect } from 'react';
import Header from './Header';
import ChatWindow from './ChatWindow';
import StrategyPage from './StrategyPage';
import RequirementDocsPage from './RequirementDocsPage';
import MarketResearchPage from './MarketResearchPage';
import EvalCriteriaPage from './EvalCriteriaPage';
import SopCreationPage from './SopCreationPage';
import StakeholderAnalysisPage from './StakeholderAnalysisPage';
import AuthorityAssessmentPage from './AuthorityAssessmentPage';
import type { KnowledgeDocument } from './types';
import { MAX_DOCUMENT_LENGTH } from './constants';
import { loadRepositoryKnowledgeBase } from './knowledgeBaseLoader';

const KNOWLEDGE_BASE_STORAGE_KEY = 'ait-knowledge-base';

const App: React.FC = () => {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeDocument[]>([]);
  const [isLoadingRepo, setIsLoadingRepo] = useState(true);
  const [route, setRoute] = useState(() => window.location.pathname);

  // Load knowledge base from repository and localStorage on initial render
  useEffect(() => {
    const loadKnowledgeBase = async () => {
      try {
        // Load repository documents first
        const repoDocs = await loadRepositoryKnowledgeBase();
        
        // Load user-uploaded documents from localStorage
        const storedDocs = localStorage.getItem(KNOWLEDGE_BASE_STORAGE_KEY);
        const userDocs = storedDocs ? JSON.parse(storedDocs) : [];
        
        // Combine both, with repo docs first
        setKnowledgeBase([...repoDocs, ...userDocs]);
      } catch (error) {
        console.error("Failed to load knowledge base:", error);
        // Try to at least load localStorage docs
        try {
          const storedDocs = localStorage.getItem(KNOWLEDGE_BASE_STORAGE_KEY);
          if (storedDocs) {
            setKnowledgeBase(JSON.parse(storedDocs));
          }
        } catch (e) {
          localStorage.removeItem(KNOWLEDGE_BASE_STORAGE_KEY);
        }
      } finally {
        setIsLoadingRepo(false);
      }
    };

    loadKnowledgeBase();
  }, []);

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Save only user-uploaded documents to localStorage (not repo docs)
  useEffect(() => {
    if (!isLoadingRepo) {
      try {
        const userDocs = knowledgeBase.filter(doc => !doc.isFromRepo);
        localStorage.setItem(KNOWLEDGE_BASE_STORAGE_KEY, JSON.stringify(userDocs));
      } catch (error) {
        console.error("Failed to save knowledge base to localStorage:", error);
      }
    }
  }, [knowledgeBase, isLoadingRepo]);

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

  const handleNavigate = (path: string) => {
    if (path === route) return;
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  if (route.startsWith('/strategy')) {
    return (
      <StrategyPage currentRoute={route} onNavigate={handleNavigate} />
    );
  }

  if (route.startsWith('/requirement-docs')) {
    return (
      <RequirementDocsPage currentRoute={route} onNavigate={handleNavigate} />
    );
  }

  if (route.startsWith('/market-research')) {
    return (
      <MarketResearchPage currentRoute={route} onNavigate={handleNavigate} />
    );
  }

  if (route.startsWith('/eval-criteria')) {
    return (
      <EvalCriteriaPage currentRoute={route} onNavigate={handleNavigate} />
    );
  }

  if (route.startsWith('/sop-creation')) {
    return (
      <SopCreationPage currentRoute={route} onNavigate={handleNavigate} />
    );
  }

  if (route.startsWith('/stakeholder-analysis')) {
    return (
      <StakeholderAnalysisPage currentRoute={route} onNavigate={handleNavigate} />
    );
  }

  if (route.startsWith('/authority-assessment')) {
    return (
      <AuthorityAssessmentPage currentRoute={route} onNavigate={handleNavigate} />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <Header currentRoute={route} onNavigate={handleNavigate} />
      <main className="flex-1 overflow-hidden">
        <ChatWindow
          knowledgeBase={knowledgeBase}
        />
      </main>
    </div>
  );
};

export default App;
