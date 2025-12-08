
import React from 'react';
import type { Message } from './types';
import { UserIcon, BotIcon, SourceIcon, DownloadIcon } from './icons';

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

  const downloadContent = () => {
    const blob = new Blob([message.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AIT_Response_${message.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <div className="flex justify-end mt-3 pt-2 border-t border-gray-700/50">
                <button 
                    onClick={downloadContent}
                    className="flex items-center text-xs text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                    aria-label="Download this response"
                >
                    <DownloadIcon className="h-4 w-4 mr-1" />
                    Download
                </button>
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
