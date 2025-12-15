import React, { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { handleDocxDownload, formatTextAsHtml } from './outputUtils';
import Header from './Header';

interface AuthorityAssessmentPageProps {
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

const AuthorityAssessmentPage: React.FC<AuthorityAssessmentPageProps> = ({ currentRoute = '/authority-assessment', onNavigate }) => {
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
      setError('Please describe the acquisition approach or technology before submitting.');
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
              content: `What legal or regulatory authority would be needed for: ${trimmed}`,
            },
          ],
          system: 'You are a federal acquisition assistant who identifies the appropriate legal or regulatory authority for a given approach.',
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
      setResultHtml(formatTextAsHtml(text, 'Authority Needs Assessment'));
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

      doc.save('authority-assessment.pdf');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadDoc = () => {
    if (!resultHtml.trim() || isExporting) return;

    setIsExporting(true);
    handleDocxDownload(resultHtml, 'authority-assessment.docx');
    setIsExporting(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header currentRoute={currentRoute} onNavigate={onNavigate} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <p className="text-sm uppercase tracking-wide text-cyan-400 font-semibold">Authority Needs Assessment</p>
              <h2 className="text-2xl font-bold mt-2">Identify required legal or regulatory authority</h2>
              <p className="text-gray-300 mt-2 text-sm md:text-base">
                Describe the acquisition approach or technology you plan to use. The assistant will outline the legal or regulatory authority needed.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-gray-200">Acquisition approach or technology</label>
            <textarea
              className="w-full min-h-[180px] rounded-lg border border-gray-700 bg-gray-900/80 p-4 text-gray-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500 outline-none transition"
              placeholder="Example: Using other transaction authority (OTA) to prototype a new analytics platform."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-500 text-gray-900 font-semibold hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isLoading ? 'Requesting assessment…' : 'Generate authority assessment'}
              </button>
              <p className="text-sm text-gray-400">Sends your description to the MCP-enabled authority assessment endpoint.</p>
            </div>
          </form>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Generated assessment</h3>
            <div className="min-h-[120px] rounded-lg border border-gray-700 bg-gray-900/60 p-4">
              {error && <p className="text-red-400 whitespace-pre-line">{error}</p>}
              {!error && resultHtml && (
                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: resultHtml }} />
              )}
              {!error && !result && !isLoading && (
                <p className="text-gray-400">Provide a description and submit to generate an assessment.</p>
              )}
              {isLoading && <p className="text-cyan-300">Generating assessment…</p>}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!result.trim() || isExporting}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-semibold hover:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={handleDownloadDoc}
              disabled={!result.trim() || isExporting}
              className="px-4 py-2 rounded-lg bg-white/90 text-gray-900 font-semibold hover:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Download DOCX
            </button>
            {isExporting && <span className="text-sm text-gray-300">Preparing download…</span>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthorityAssessmentPage;
