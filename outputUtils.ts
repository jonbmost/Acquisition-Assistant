import { Document, HeadingLevel, Packer, Paragraph, TextRun } from './vendor/docx/index.mjs';
import { saveAs } from 'file-saver';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatInlineSegments = (value: string) => {
  const parts = value.split(/(\*\*[^*]+\*\*)/g);

  return parts
    .map((segment) => {
      const boldMatch = segment.match(/^\*\*(.+)\*\*$/);

      if (boldMatch) {
        return `<strong>${escapeHtml(boldMatch[1])}</strong>`;
      }

      return escapeHtml(segment);
    })
    .join('');
};

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
      blocks.push(`<h${level}>${formatInlineSegments(headingText)}</h${level}>`);
      return;
    }

    if (/^[-*]\s+/.test(current)) {
      const content = current.replace(/^[-*]\s+/, '');
      listItems.push(`<li>${formatInlineSegments(content)}</li>`);
      return;
    }

    flushList();
    blocks.push(`<p>${formatInlineSegments(current)}</p>`);
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

  const gatherRuns = (node: Node, style: { bold?: boolean; italics?: boolean } = {}): TextRun[] => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';

      if (!text) return [];

      return [new TextRun({ text, bold: style.bold, italics: style.italics })];
    }

    if (!(node instanceof Element)) {
      return [];
    }

    if (node.tagName === 'BR') {
      return [new TextRun({ text: '\n', bold: style.bold, italics: style.italics })];
    }

    const nextStyle = {
      bold: style.bold || node.tagName === 'STRONG' || node.tagName === 'B',
      italics: style.italics || node.tagName === 'EM' || node.tagName === 'I'
    };

    return Array.from(node.childNodes).flatMap((child) => gatherRuns(child, nextStyle));
  };

  const processElement = (el: Element) => {
    const tag = el.tagName;

    if (tag === 'UL') {
      Array.from(el.children).forEach((child) => {
        if (child.tagName === 'LI') {
          const runs = gatherRuns(child);
          if (runs.length) {
            paragraphs.push(
              new Paragraph({
                children: runs,
                bullet: { level: 0 },
                spacing: { after: 120 }
              })
            );
          }
        }
      });
      return;
    }

    if (headingMap[tag]) {
      const runs = gatherRuns(el);
      if (runs.length) {
        paragraphs.push(
          new Paragraph({
            children: runs,
            heading: headingMap[tag],
            spacing: { after: 160 }
          })
        );
      }
      return;
    }

    if (tag === 'P') {
      const runs = gatherRuns(el);
      if (runs.length) {
        paragraphs.push(
          new Paragraph({
            children: runs,
            spacing: { after: 160 }
          })
        );
      }
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
