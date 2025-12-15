import htmlDocx from 'html-docx-js/dist/html-docx';
import { saveAs } from 'file-saver';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const formatTextAsHtml = (text: string, heading?: string): string => {
  const trimmed = text?.trim();

  if (!trimmed) {
    return '<p>No response received.</p>';
  }

  const lines = trimmed.split('\n');
  const blocks: string[] = [];
  const listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push(`<ul>${listItems.join('')}</ul>`);
      listItems.length = 0;
    }
  };

  if (heading?.trim()) {
    blocks.push(`<h2>${escapeHtml(heading.trim())}</h2>`);
  }

  lines.forEach((line) => {
    const current = line.trim();

    if (!current) {
      flushList();
      return;
    }

    const headingMatch = current.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = Math.min(6, headingMatch[1].length);
      const headingText = headingMatch[2];
      blocks.push(`<h${level}>${escapeHtml(headingText)}</h${level}>`);
      return;
    }

    if (/^[-*]\s+/.test(current)) {
      const content = current.replace(/^[-*]\s+/, '');
      listItems.push(`<li>${escapeHtml(content)}</li>`);
      return;
    }

    flushList();
    blocks.push(`<p>${escapeHtml(current)}</p>`);
  });

  flushList();

  return blocks.join('');
};

export const handleDocxDownload = (htmlContent: string, fileName: string) => {
  if (!htmlContent.trim()) return;

  const wrappedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial, sans-serif; line-height:1.6;} h1,h2,h3,h4,h5,h6{margin:0 0 12px;} p,ul{margin:0 0 12px;} ul{padding-left:20px;}</style></head><body>${htmlContent}</body></html>`;
  const blob = htmlDocx.asBlob(wrappedHtml);
  saveAs(blob, fileName);
};
