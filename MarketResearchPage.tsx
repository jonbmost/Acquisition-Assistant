import React, { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { handleDocxDownload, formatTextAsHtml } from './outputUtils';
import Header from './Header';

interface MarketResearchPageProps {
  currentRoute?: string;
  onNavigate?: (path: string) => void;
}

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

const MarketResearchPage: React.FC<MarketResearchPageProps> = ({ currentRoute = '/market-research', onNavigate }) => {
  const [description, setDescription] = useState('');
  const [result, setResult] = useState('');
  const [resultHtml, setResultHtml] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const isSubmitDisabled = useMemo(() => !description.trim() || isLoading, [description, isLoading]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = description.trim();

    if (!trimmed) {
      setError('Please describe what you want to research before submitting.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');
    setResultHtml('');

    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Generate a market research summary for: ${trimmed}`,
            },
          ],
          system: 'You are a federal acquisition assistant who produces concise, actionable market research summaries.',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = typeof data?.error === 'string' && data.error.trim().length > 0
          ? data.error.trim()
          : 'Request failed. Please try again.';
        setError(message);
        return;
      }

      const text = extractResponseText(data);
      setResult(text);
      setResultHtml(formatTextAsHtml(text, 'Market Research Summary'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!result.trim() || isExporting) return;

    setIsExporting(true);

    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      const lineHeight = 16;

      const lines = doc.splitTextToSize(result, contentWidth);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);

      let y = margin;
      lines.forEach((line: string) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      doc.save('market-research-summary.pdf');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadDoc = () => {
    if (!resultHtml.trim() || isExporting) return;

    setIsExporting(true);
    handleDocxDownload(resultHtml, 'market-research-summary.docx');
    setIsExporting(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header currentRoute={currentRoute} onNavigate={onNavigate} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <p className="text-sm uppercase tracking-wide text-cyan-400 font-semibold">Market research workspace</p>
              <h2 className="text-2xl font-bold mt-2">Generate a market research summary</h2>
              <p className="text-gray-300 mt-2 text-sm md:text-base">
                Describe the commercial solutions, vendors, or capabilities you want to research. The assistant will draft a focused market research summary.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-gray-200">Research focus</label>
            <textarea
              className="w-full min-h-[180px] rounded-lg border border-gray-700 bg-gray-900/80 p-4 text-gray-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500 outline-none transition"
              placeholder="Example: Identify commercial SaaS platforms that support government-ready vendor onboarding and performance analytics."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-500 text-gray-900 font-semibold hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isLoading ? 'Requesting summary…' : 'Generate market research'}
              </button>
              <p className="text-sm text-gray-400">Submits to the MCP-enabled market research endpoint.</p>
            </div>
          </form>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Generated summary</h3>
            <div className="min-h-[120px] rounded-lg border border-gray-700 bg-gray-900/60 p-4">
              {error && <p className="text-red-400 whitespace-pre-line">{error}</p>}
              {!error && resultHtml && (
                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: resultHtml }} />
              )}
              {!error && !result && !isLoading && (
                <p className="text-gray-500">Your market research summary will appear here.</p>
              )}
              {isLoading && !error && (
                <p className="text-cyan-300 animate-pulse">Generating market research summary…</p>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={!result.trim() || isExporting}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-500 text-gray-900 font-semibold hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Download PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadDoc}
                disabled={!result.trim() || isExporting}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-200 text-gray-900 font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Download DOCX
              </button>
              <p className="text-sm text-gray-400">Available after a market research summary is generated.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketResearchPage;
