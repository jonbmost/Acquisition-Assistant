
import React, { useState } from 'react';
import type { Message } from './types';
import { UserIcon, BotIcon, SourceIcon, DownloadIcon } from './icons';
import { jsPDF } from 'jspdf';
import { asBlob } from 'html-docx-js/dist/html-docx';

// Simple markdown-to-JSX parser
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  
  const renderLine = (line: string, index: number) => {
    // Bold text: **text** or *text*
    line = line.replace(/\*\*(.*?)\*\*|\*(.*?)\*/g, '<strong>$1$2</strong>');
    
    // Unordered list items: - or *
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return <li key={index} dangerouslySetInnerHTML={{ __html: line.trim().substring(2) }} />;
    }
    
    return <p key={index} dangerouslySetInnerHTML={{ __html: line }} />;
  };

  const elements = [];
  let currentList: string[] = [];

  lines.forEach((line, index) => {
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      currentList.push(line);
    } else {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${index}`} className="list-disc list-inside space-y-1 my-2">
            {currentList.map(renderLine)}
          </ul>
        );
        currentList = [];
      }
      if (line.trim() !== '') {
        elements.push(renderLine(line, index));
      }
    }
  });

  if (currentList.length > 0) {
    elements.push(
      <ul key="ul-last" className="list-disc list-inside space-y-1 my-2">
        {currentList.map(renderLine)}
      </ul>
    );
  }

  return <>{elements}</>;
};


const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const downloadAsTXT = () => {
    const blob = new Blob([message.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AIT_Response_${message.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const downloadAsPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    
    // Add title
    doc.setFontSize(16);
    doc.text('Acquisition Assistant Response', margin, 20);
    
    // Add content
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(message.text, maxWidth);
    doc.text(lines, margin, 35);
    
    doc.save(`AIT_Response_${message.id}.pdf`);
    setShowDownloadMenu(false);
  };

  const downloadAsDOCX = async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Acquisition Assistant Response</title>
        </head>
        <body>
          <h1>Acquisition Assistant Response</h1>
          <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${message.text}</pre>
        </body>
      </html>
    `;
    
    const converted = await asBlob(htmlContent);
    const url = URL.createObjectURL(converted);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AIT_Response_${message.id}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
          <BotIcon className="h-5 w-5 text-cyan-400" />
        </div>
      )}
      <div className={`max-w-2xl rounded-lg p-4 ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-800'}`}>
        <div className="prose prose-invert prose-sm max-w-none space-y-4">
          <SimpleMarkdown text={message.text} />
        </div>
        {message.fileName && (
          <div className="mt-3 pt-2 border-t border-blue-500 text-xs text-blue-300">
            Attachment: {message.fileName}
          </div>
        )}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-700">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Sources:</h4>
            <ul className="space-y-2">
              {message.sources.map((source, index) => (
                <li key={index}>
                  <a
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-xs text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                  >
                    <SourceIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{source.title || source.uri}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!isUser && message.text && (
            <div className="flex justify-end mt-3 pt-2 border-t border-gray-700/50 relative">
                <button 
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="flex items-center text-xs text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                    aria-label="Download this response"
                >
                    <DownloadIcon className="h-4 w-4 mr-1" />
                    Download
                </button>
                
                {showDownloadMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-10">
                    <button
                      onClick={downloadAsTXT}
                      className="block w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-gray-800 hover:text-cyan-400 transition-colors"
                    >
                      Download as TXT
                    </button>
                    <button
                      onClick={downloadAsPDF}
                      className="block w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-gray-800 hover:text-cyan-400 transition-colors"
                    >
                      Download as PDF
                    </button>
                    <button
                      onClick={downloadAsDOCX}
                      className="block w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-gray-800 hover:text-cyan-400 transition-colors"
                    >
                      Download as DOCX
                    </button>
                  </div>
                )}
            </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
          <UserIcon className="h-5 w-5 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
