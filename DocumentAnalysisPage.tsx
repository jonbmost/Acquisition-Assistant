import React, { useMemo, useState } from 'react';
import Header from './Header';
import { MAX_DOCUMENT_LENGTH } from './constants';

interface DocumentAnalysisPageProps {
  currentRoute?: string;
  onNavigate?: (path: string) => void;
}

const truncateContent = (content: string) => {
  if (content.length <= MAX_DOCUMENT_LENGTH) {
    return { text: content, truncated: false };
  }

  return {
    text: `${content.slice(0, MAX_DOCUMENT_LENGTH)}\n\n... [Content truncated for brevity] ...`,
    truncated: true,
  };
};

const DocumentAnalysisPage: React.FC<DocumentAnalysisPageProps> = ({ currentRoute = '/document-analysis', onNavigate }) => {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wasTruncated, setWasTruncated] = useState(false);

  const isSubmitDisabled = useMemo(() => {
    return isLoading || !file || !question.trim();
  }, [file, isLoading, question]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setError('');
    setAnswer('');
    setWasTruncated(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setError('Please upload a document before submitting.');
      return;
    }

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError('Please enter a question about the document.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnswer('');

    try {
      const rawContent = await file.text();
      const { text, truncated } = truncateContent(rawContent);
      setWasTruncated(truncated);

      const response = await fetch('/api/document-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          question: trimmedQuestion,
          content: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          typeof data?.error === 'string' && data.error.trim().length > 0
            ? data.error.trim()
            : 'Request failed. Please try again with a different document or question.';
        setError(message);
        return;
      }

      const extractedAnswer =
        typeof data?.answer === 'string' && data.answer.trim().length > 0
          ? data.answer.trim()
          : 'No answer returned. Please try again with a different question or document.';

      setAnswer(extractedAnswer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error while requesting the answer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header currentRoute={currentRoute} onNavigate={onNavigate} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl shadow-lg p-6 md:p-8 space-y-6">
          <header className="space-y-2">
            <p className="text-sm uppercase tracking-wide text-cyan-400 font-semibold">Document Analysis</p>
            <h2 className="text-2xl font-bold">Upload a document and ask targeted questions</h2>
            <p className="text-gray-300 text-sm md:text-base">
              Provide a file and a specific question. The assistant will analyze the document content and return a grounded
              answer.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-200" htmlFor="file-upload">
                Upload Document
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".txt,.md,.doc,.docx,.pdf,.rtf,.html,.htm,.json,.csv"
                className="w-full text-gray-100"
                onChange={handleFileChange}
              />
              {file && (
                <p className="text-sm text-gray-400">Selected: {file.name}</p>
              )}
              {wasTruncated && (
                <p className="text-sm text-amber-300">Document content was truncated to {MAX_DOCUMENT_LENGTH.toLocaleString()} characters.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-200" htmlFor="question-input">
                Your Question
              </label>
              <textarea
                id="question-input"
                rows={5}
                className="w-full rounded-lg border border-gray-700 bg-gray-900/80 p-3 text-gray-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500 outline-none transition min-h-[140px]"
                placeholder="Example: What are the key risks and mitigation strategies described in this document?"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-cyan-500 text-gray-900 font-semibold hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isLoading ? 'Submitting…' : 'Ask Question'}
              </button>
              <p className="text-sm text-gray-400">Submits your uploaded file and question to the document analysis endpoint.</p>
            </div>
          </form>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-100">Answer</h3>
            <div className="min-h-[140px] rounded-lg border border-gray-700 bg-gray-900/60 p-4">
              {error && <p className="text-red-400 whitespace-pre-line">{error}</p>}
              {!error && answer && <p className="text-gray-100 whitespace-pre-line">{answer}</p>}
              {!error && !answer && !isLoading && (
                <p className="text-gray-500">Your grounded answer will appear here.</p>
              )}
              {isLoading && !error && (
                <p className="text-cyan-300 animate-pulse">Analyzing document…</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentAnalysisPage;
