import React, { useCallback, useMemo, useRef, useState } from 'react';
import Header from './Header';
import { formatTextAsHtml } from './outputUtils';

type Slide = {
  title: string;
  bullets: string[];
};

type SlideRangerPageProps = {
  currentRoute?: string;
  onNavigate?: (path: string) => void;
};

const loadExternalScript = (src: string, globalName: string) => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window is not available'));
  const existing = (window as any)[globalName];
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      const loaded = (window as any)[globalName];
      if (loaded) {
        resolve(loaded);
      } else {
        reject(new Error(`Global ${globalName} not found after loading ${src}`));
      }
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
};

async function readFileContents(file: File): Promise<string> {
  if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
    return file.text();
  }

  if (file.name.toLowerCase().endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await loadExternalScript(
      'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js',
      'mammoth'
    );

    const result = await (mammoth as any).convertToHtml({ arrayBuffer });
    const html = (result?.value as string) || '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  throw new Error('Unsupported file type. Please upload a .txt or .docx file.');
}

const SlideRangerPage: React.FC<SlideRangerPageProps> = ({ currentRoute = '/slide-ranger', onNavigate }) => {
  const [missionNotes, setMissionNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const isSubmitDisabled = useMemo(() => !missionNotes.trim() && !file, [missionNotes, file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = event.target.files?.[0];
    setFile(uploaded ?? null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setInfoMessage('');

    let compiledInput = missionNotes.trim();

    try {
      if (file) {
        const fileText = await readFileContents(file);
        if (fileText.trim()) {
          compiledInput = [compiledInput, fileText.trim()].filter(Boolean).join('\n\n');
        }
      }
    } catch (fileErr) {
      setError(fileErr instanceof Error ? fileErr.message : 'Unable to read the uploaded file.');
      return;
    }

    if (!compiledInput) {
      setError('Please provide mission notes or upload a supported file.');
      return;
    }

    setIsLoading(true);
    setSlides([]);

    try {
      const response = await fetch('/api/slide-ranger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: compiledInput })
      });

      const data = await response.json();

      if (!response.ok) {
        const message = typeof data?.error === 'string' ? data.error : 'Request failed. Please try again.';
        setError(message);
        return;
      }

      if (!Array.isArray(data?.slides)) {
        setError('Unexpected response format. Please try again.');
        return;
      }

      setSlides(
        data.slides.map((slide: any) => ({
          title: typeof slide?.title === 'string' ? slide.title : 'Untitled slide',
          bullets: Array.isArray(slide?.bullets)
            ? slide.bullets.filter((b: any) => typeof b === 'string' && b.trim()).map((b: string) => b.trim())
            : [],
        }))
      );
      setInfoMessage('Slides generated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = useCallback(async () => {
    if (!slides.length || isExporting || !previewRef.current) return;
    setIsExporting(true);
    try {
      const html2pdf = await loadExternalScript(
        'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js',
        'html2pdf'
      );
      await (html2pdf as any)()
        .from(previewRef.current)
        .set({ margin: 10, filename: 'slide-ranger.pdf', html2canvas: { scale: 1.5 } })
        .save();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate PDF.');
    } finally {
      setIsExporting(false);
    }
  }, [slides.length, isExporting]);

  const handleDownloadPpt = useCallback(async () => {
    if (!slides.length || isExporting) return;
    setIsExporting(true);
    try {
      const PptxGenJS = await loadExternalScript(
        'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.min.js',
        'PptxGenJS'
      );
      const pptx = new (PptxGenJS as any)();

      const sanitize = (value: string) => {
        const container = document.createElement('div');
        container.innerHTML = value;
        return (container.textContent || container.innerText || '').trim();
      };

      slides.forEach((slide) => {
        const s = pptx.addSlide();
        s.addText(slide.title || 'Slide', { x: 0.5, y: 0.4, fontSize: 18, bold: true, color: '1b9ed8' });

        if (slide.bullets?.length) {
          const bulletLines = slide.bullets
            .map((b) => sanitize(formatTextAsHtml(b)))
            .filter((text) => text.length > 0);

          if (!bulletLines.length) return;

          s.addText(
            bulletLines.join('\n'),
            { x: 0.7, y: 1.1, fontSize: 14, color: '1f2937', bullet: true, lineSpacingMultiple: 1.2 }
          );
        }
      });

      await pptx.writeFile({ fileName: 'slide-ranger.pptx' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate PowerPoint.');
    } finally {
      setIsExporting(false);
    }
  }, [slides, isExporting]);

  const renderSlideHtml = (slide: Slide, index: number) => {
    return (
      <div key={index} className="bg-gray-900/70 border border-gray-700 rounded-lg p-4 shadow-sm">
        <h2 className="text-xl font-bold text-cyan-300 mb-2">{slide.title || 'Untitled slide'}</h2>
        {slide.bullets && slide.bullets.length > 0 ? (
          <ul className="list-disc list-inside text-gray-100 space-y-1">
            {slide.bullets.map((bullet, i) => (
              <li key={i} className="text-gray-100" dangerouslySetInnerHTML={{ __html: formatTextAsHtml(bullet) }} />
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No bullet points provided.</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header currentRoute={currentRoute} onNavigate={onNavigate} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
            <div>
              <p className="text-sm uppercase tracking-wide text-cyan-400 font-semibold">Slide Ranger</p>
              <h2 className="text-2xl font-bold mt-2">Generate slide-ready content from mission notes</h2>
              <p className="text-gray-300 mt-2 text-sm md:text-base">
                Paste mission notes or upload a .txt/.docx file. The AI will convert them into structured slide outlines.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-gray-200">Mission notes</label>
            <textarea
              className="w-full min-h-[140px] rounded-lg border border-gray-700 bg-gray-900/80 p-4 text-gray-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500 outline-none transition"
              placeholder="Paste mission notes or objectives here..."
              rows={5}
              value={missionNotes}
              onChange={(event) => setMissionNotes(event.target.value)}
            />

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="file"
                accept=".txt,.docx"
                onChange={handleFileChange}
                className="text-sm text-gray-300"
              />
              {file && <p className="text-sm text-gray-400">Selected file: {file.name}</p>}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitDisabled || isLoading}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-500 text-gray-900 font-semibold hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isLoading ? 'Generating slides…' : 'Create slides'}
              </button>
              <p className="text-sm text-gray-400">Input is sent to the Slide Ranger API for structured slide output.</p>
            </div>
          </form>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <h3 className="text-lg font-semibold text-gray-100">Slide previews</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={!slides.length || isExporting}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-cyan-500 text-gray-900 font-semibold hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Download as PDF
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPpt}
                  disabled={!slides.length || isExporting}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-gray-200 text-gray-900 font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Download as PowerPoint
                </button>
              </div>
            </div>
            <div className="min-h-[140px] rounded-lg border border-gray-700 bg-gray-900/60 p-4" ref={previewRef}>
              {error && <p className="text-red-400 whitespace-pre-line">{error}</p>}
              {!error && infoMessage && <p className="text-green-400">{infoMessage}</p>}
              {!error && isLoading && <p className="text-cyan-300 animate-pulse">Building slides…</p>}
              {!error && !isLoading && slides.length === 0 && (
                <p className="text-gray-500">Generated slides will appear here.</p>
              )}
              {!error && !isLoading && slides.length > 0 && (
                <div className="grid gap-4">
                  {slides.map((slide, index) => renderSlideHtml(slide, index))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SlideRangerPage;
