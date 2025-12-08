
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { SYSTEM_INSTRUCTION, MAX_DOCUMENT_LENGTH } from '../constants';
import type { Message, GroundingChunk, KnowledgeDocument } from '../types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { DownloadIcon } from './icons';

interface ChatWindowProps {
  knowledgeBase: KnowledgeDocument[];
}

const CHAT_HISTORY_STORAGE_KEY = 'ait-chat-history';

const ChatWindow: React.FC<ChatWindowProps> = ({ knowledgeBase }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage and initialize chat on startup
  useEffect(() => {
    let loadedMessages: Message[] = [];
    try {
      const storedHistory = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (storedHistory) {
        loadedMessages = JSON.parse(storedHistory);
      }
    } catch (e) {
      console.error("Failed to parse chat history from localStorage:", e);
      localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
    }

    if (loadedMessages.length === 0) {
      loadedMessages.push({
        id: 'initial-message',
        role: 'model',
        text: 'Hello! I am your intelligent procurement assistant. How can I help you plan your agile acquisition today? You can ask me to draft a document, provide guidance on FAR, or help with evaluation strategies.',
      });
    }
    setMessages(loadedMessages);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY!, vertexai: true });
      
      // Rebuild AI history from our saved messages
      const chatHistoryForAI = loadedMessages
        .filter(msg => msg.id !== 'initial-message') // Don't include the welcome message in history
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        }));

      const chatInstance = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: chatHistoryForAI,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
        },
      });
      setChat(chatInstance);
    } catch (e) {
      console.error(e);
      setError('Failed to initialize the AI assistant. Please check the API key and configuration.');
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {
        console.error("Failed to save chat history to localStorage:", e);
      }
    }
  }, [messages]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (inputText: string, file: File | null) => {
    if (!chat || isLoading) return;

    setIsLoading(true);
    setError(null);

    const userMessageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      text: inputText,
      fileName: file?.name,
    };
    setMessages(prev => [...prev, userMessage]);

    const modelMessageId = `model-${Date.now()}`;
    setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '' }]);

    try {
      let knowledgeBasePrompt = '';
      if (knowledgeBase.length > 0) {
        const kbContent = knowledgeBase.map(doc => 
          `--- DOCUMENT: ${doc.name} ---\n${doc.content}\n--- END DOCUMENT ---`
        ).join('\n\n');
        knowledgeBasePrompt = `You have access to the following documents in your knowledge base. Use them as primary context for your response:\n\n${kbContent}\n\n`;
      }

      let filePrompt = '';
      if (file) {
        let fileContent = await file.text();
        if (fileContent.length > MAX_DOCUMENT_LENGTH) {
            fileContent = fileContent.substring(0, MAX_DOCUMENT_LENGTH) + "\n\n... [Content truncated for brevity] ...";
            console.warn(`Attached file "${file.name}" was truncated to ${MAX_DOCUMENT_LENGTH} characters.`);
        }
        filePrompt = `The user has also attached the following document for this specific request (${file.name}). Use it as additional, immediate context:\n\n--- ATTACHED DOCUMENT ---\n${fileContent}\n--- END ATTACHED DOCUMENT ---\n\n`;
      }

      const finalPrompt = `${knowledgeBasePrompt}${filePrompt}User Request: ${inputText}`;

      const stream = await chat.sendMessageStream({ message: finalPrompt });
      let fullResponseText = '';
      let finalResponse: any = null;

      for await (const chunk of stream) {
        fullResponseText += chunk.text;
        finalResponse = chunk;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === modelMessageId ? { ...msg, text: fullResponseText } : msg
          )
        );
      }
      
      const groundingMetadata = finalResponse?.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks?.length > 0) {
        const sources = groundingMetadata.groundingChunks
          .filter((chunk: GroundingChunk) => chunk.web?.uri)
          .map((chunk: GroundingChunk) => ({
            uri: chunk.web.uri,
            title: chunk.web.title,
          }));
        
        setMessages(prev =>
          prev.map(msg =>
            msg.id === modelMessageId ? { ...msg, sources } : msg
          )
        );
      }

    } catch (e: any) {
      console.error(e);
      const errorMessage = `An error occurred: ${e.message || 'Please try again.'}`;
      setError(errorMessage);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === modelMessageId ? { ...msg, text: `Sorry, I encountered an error. ${errorMessage}` } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [chat, isLoading, knowledgeBase]);

  const downloadChatHistory = () => {
    const historyText = messages.map(msg => {
      let header = `[${msg.role.toUpperCase()}] - ${new Date().toLocaleString()}\n`;
      if (msg.fileName) {
        header += `Attachment: ${msg.fileName}\n`;
      }
      let content = msg.text;
      if (msg.sources && msg.sources.length > 0) {
        content += '\n\nSources:\n' + msg.sources.map(s => `- ${s.title}: ${s.uri}`).join('\n');
      }
      return `${header}\n${content}\n\n----------------------------------------\n`;
    }).join('');

    const blob = new Blob([historyText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AIT_Chat_History_${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
           <div className="flex items-center space-x-3 animate-pulse ml-12">
              <div className="h-2.5 bg-gray-600 rounded-full w-32"></div>
              <div className="h-2.5 bg-gray-600 rounded-full w-24"></div>
              <div className="h-2.5 bg-gray-600 rounded-full w-48"></div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 md:p-6 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700">
        {error && <div className="text-red-400 text-sm mb-2 text-center">{error}</div>}
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-500 text-center">
                AIT is an AI assistant. Responses may be inaccurate. Please verify important information.
            </p>
            <button
                onClick={downloadChatHistory}
                className="flex items-center text-xs text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                aria-label="Download chat history"
            >
                <DownloadIcon className="h-4 w-4 mr-1" />
                Download Chat
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
