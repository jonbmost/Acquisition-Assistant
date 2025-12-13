import React, { useMemo, useState } from 'react';
import Header from './Header';

type StrategyPageProps = {
  currentRoute?: string;
  onNavigate?: (path: string) => void;
};

function extractResponseText(data: any): string {
  if (Array.isArray(data?.content)) {
    const joined = data.content
      .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n\n');

    if (joined.trim().length > 0) {
      return joined.trim();
    }
  }

  if (typeof data?.error === 'string' && data.error.trim().length > 0) {
    return data.error.trim();
  }

  return 'No response received.';
}

const StrategyPage: React.FC<StrategyPageProps> = ({ currentRoute = '/strategy', onNavigate }) => {
  const [description, setDescription] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isSubmitDisabled = useMemo(() => !description.trim() || isLoading, [description, isLoading]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = description.trim();

    if (!trimmed) {
      setError('Please describe your acquisition need before submitting.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: trimmed }
          ],
          system: 'You are a federal acquisition strategy assistant. Provide actionable guidance tailored to the user request.'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const message = (data?.error && typeof data.error === 'string')
          ? data.error
          : 'Request failed. Please try again.';
        setError(message);
        return;
      }

      setResult(extractResponseText(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header currentRoute={currentRoute} onNavigate={onNavigate} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <p className="text-sm uppercase tracking-wide text-cyan-400 font-semibold">Strategy Workspace</p>
              <h2 className="text-2xl font-bold mt-2">Request an acquisition strategy outline</h2>
              <p className="text-gray-300 mt-2 text-sm md:text-base">
                Describe your acquisition need in plain language. The assistant will draft a tailored strategy you can refine.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-gray-200">Acquisition need</label>
            <textarea
              className="w-full min-h-[180px] rounded-lg border border-gray-700 bg-gray-900/80 p-4 text-gray-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500 outline-none transition"
              placeholder="Example: We need to procure cloud hosting and managed services for a multi-tenant web application with FedRAMP Moderate compliance."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-500 text-gray-900 font-semibold hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isLoading ? 'Requesting strategy…' : 'Generate strategy'}
              </button>
              <p className="text-sm text-gray-400">The request is sent to the MCP-enabled strategy endpoint.</p>
            </div>
          </form>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Strategy response</h3>
            <div className="min-h-[120px] rounded-lg border border-gray-700 bg-gray-900/60 p-4">
              {error && (
                <p className="text-red-400 whitespace-pre-line">{error}</p>
              )}
              {!error && result && (
                <pre className="whitespace-pre-wrap text-gray-100 font-sans leading-relaxed">{result}</pre>
              )}
              {!error && !result && !isLoading && (
                <p className="text-gray-500">Your generated strategy will appear here.</p>
              )}
              {isLoading && !error && (
                <p className="text-cyan-300 animate-pulse">Generating strategy…</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StrategyPage;
