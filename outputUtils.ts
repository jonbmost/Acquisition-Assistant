import { Document, HeadingLevel, Packer, Paragraph } from './vendor/docx/index.mjs';
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

const headingMap: Record<string, HeadingLevel> = {
  H1: HeadingLevel.HEADING_1,
  H2: HeadingLevel.HEADING_2,
  H3: HeadingLevel.HEADING_3,
  H4: HeadingLevel.HEADING_4,
  H5: HeadingLevel.HEADING_5,
  H6: HeadingLevel.HEADING_6
};

export const handleDocxDownload = async (htmlContent: string, fileName: string) => {
  if (!htmlContent.trim()) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html');

  const paragraphs: Paragraph[] = [];

  const processElement = (el: Element) => {
    const tag = el.tagName;
    const text = el.textContent?.trim();

    if (tag === 'UL') {
      Array.from(el.children).forEach((child) => {
        if (child.tagName === 'LI') {
          const liText = child.textContent?.trim();
          if (liText) {
            paragraphs.push(
              new Paragraph({
                text: liText,
                bullet: { level: 0 },
                spacing: { after: 120 }
              })
            );
          }
        }
      });
      return;
    }

    if (headingMap[tag] && text) {
      paragraphs.push(
        new Paragraph({
          text,
          heading: headingMap[tag],
          spacing: { after: 160 }
        })
      );
      return;
    }

    if (tag === 'P' && text) {
      paragraphs.push(
        new Paragraph({
          text,
          spacing: { after: 160 }
        })
      );
      return;
    }

    Array.from(el.children).forEach((child) => processElement(child));
  };

  Array.from(doc.body.children).forEach((child) => processElement(child));

  const document = new Document({
    sections: [
      {
        children: paragraphs.length
          ? paragraphs
          : [
              new Paragraph({
                text: 'No content provided.',
                spacing: { after: 160 }
              })
            ]
      }
    ]
  });

  const blob = await Packer.toBlob(document);
  saveAs(blob, fileName);
};
