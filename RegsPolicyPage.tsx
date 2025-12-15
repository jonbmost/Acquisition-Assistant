import React, { useMemo, useState } from 'react';
import Header from './Header';

interface RegsPolicyPageProps {
  currentRoute?: string;
  onNavigate?: (path: string) => void;
}

const RECOMMENDED_RESOURCES = [
  {
    label: 'FAR Part 12',
    url: 'https://acquisition.gov/far/part-12',
  },
  {
    label: 'DFARS 212.102',
    url: 'https://www.acquisition.gov/dfars/part-212-acquisition-commercial-products-and-commercial-services#DFARS-212.102',
  },
  {
    label: "Leading Agile Acquisition (User’s Book)",
    url: 'https://joinmost.org/agile-book',
  },
];

function sanitizeAnswerText(text: string): string {
  if (typeof text !== 'string') return '';

  const stripped = text.replace(/<invoke name="mcp">[\s\S]*?<\/invoke>/gi, '').trim();

  return stripped.length > 0 ? stripped : '';
}

function extractAnswer(data: any): string {
  if (Array.isArray(data?.content)) {
    const combined = data.content
      .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n\n');

    if (combined.trim().length > 0) {
      const sanitized = sanitizeAnswerText(combined);
      if (sanitized.length > 0) {
        return sanitized;
      }
    }
  }

  if (typeof data?.answer === 'string' && data.answer.trim().length > 0) {
    const sanitized = sanitizeAnswerText(data.answer);
    if (sanitized.length > 0) {
      return sanitized;
    }
  }

  if (typeof data?.error === 'string' && data.error.trim().length > 0) {
    return data.error.trim();
  }

  return 'No answer returned. Please try again with a different question or URL.';
}

const RegsPolicyPage: React.FC<RegsPolicyPageProps> = ({ currentRoute = '/url-query', onNavigate }) => {
  const [urlValue, setUrlValue] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isSubmitDisabled = useMemo(() => {
    return isLoading || !urlValue.trim() || !question.trim();
  }, [isLoading, urlValue, question]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedUrl = urlValue.trim();
    const trimmedQuestion = question.trim();

    if (!trimmedUrl || !trimmedQuestion) {
      setError('Please provide both a URL and a question before submitting.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnswer('');

    try {
      const response = await fetch('/api/url-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mcpUrl: `https://tomcp.org/${trimmedUrl}`,
          question: trimmedQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = typeof data?.error === 'string' && data.error.trim().length > 0
          ? data.error.trim()
          : 'Request failed. Please verify the URL and try again.';
        setError(message);
        return;
      }

      const parsedAnswer = extractAnswer(data);
      setAnswer(parsedAnswer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error while requesting the answer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResourceSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUrl = event.target.value;
    if (selectedUrl) {
      setUrlValue(selectedUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header currentRoute={currentRoute} onNavigate={onNavigate} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl shadow-lg p-6 md:p-8 space-y-6">
          <header className="space-y-2">
            <p className="text-sm uppercase tracking-wide text-cyan-400 font-semibold">Regs &amp; Policy</p>
            <h2 className="text-2xl font-bold">Ask questions about acquisition regulations or policy pages</h2>
            <p className="text-gray-300 text-sm md:text-base">
              Paste a public website URL or pick a recommended resource, ask your question, and the assistant will ground its
              answer in that page.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-200" htmlFor="url-input">
                Website URL
              </label>
              <input
                id="url-input"
                type="url"
                className="w-full rounded-lg border border-gray-700 bg-gray-900/80 p-3 text-gray-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                placeholder="Example: acquisition.gov"
                value={urlValue}
                onChange={(event) => setUrlValue(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-200" htmlFor="question-input">
                Your Question
              </label>
              <textarea
                id="question-input"
                rows={5}
                className="w-full rounded-lg border border-gray-700 bg-gray-900/80 p-3 text-gray-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500 outline-none transition min-h-[140px]"
                placeholder="Example: Summarize the commercial item determination guidance on this page."
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-200" htmlFor="recommended">
                Or pick a recommended resource:
              </label>
              <select
                id="recommended"
                className="w-full rounded-lg border border-gray-700 bg-gray-900/80 p-3 text-gray-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                defaultValue=""
                onChange={handleResourceSelect}
              >
                <option value="" disabled>
                  Choose a resource
                </option>
                {RECOMMENDED_RESOURCES.map((resource) => (
                  <option key={resource.url} value={resource.url}>
                    {resource.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-cyan-500 text-gray-900 font-semibold hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isLoading ? 'Submitting…' : 'Ask Question'}
              </button>
              <p className="text-sm text-gray-400">Submits the URL and question to the grounded MCP query endpoint.</p>
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
                <p className="text-cyan-300 animate-pulse">Fetching answer…</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegsPolicyPage;
