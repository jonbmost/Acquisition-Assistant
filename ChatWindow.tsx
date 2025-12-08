
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { SYSTEM_INSTRUCTION, MAX_DOCUMENT_LENGTH, AI_MODELS, type AIModel } from './constants';
import type { Message, GroundingChunk, KnowledgeDocument } from './types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { DownloadIcon } from './icons';

interface ChatWindowProps {
  knowledgeBase: KnowledgeDocument[];
}

const CHAT_HISTORY_STORAGE_KEY = 'ait-chat-history';
const MODEL_SELECTION_STORAGE_KEY = 'ait-selected-model';

const ChatWindow: React.FC<ChatWindowProps> = ({ knowledgeBase }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<any | null>(null);
  const [openai, setOpenai] = useState<OpenAI | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini');
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

    // Load selected model
    try {
      const storedModel = localStorage.getItem(MODEL_SELECTION_STORAGE_KEY);
      if (storedModel && (storedModel === 'gemini' || storedModel === 'openai')) {
        setSelectedModel(storedModel);
      }
    } catch (e) {
      console.error("Failed to load model selection:", e);
    }

    if (loadedMessages.length === 0) {
      loadedMessages.push({
        id: 'initial-message',
        role: 'model',
        text: 'Hello! I am your intelligent procurement assistant. How can I help you plan your agile acquisition today? You can ask me to draft a document, provide guidance on FAR, or help with evaluation strategies.',
      });
    }
    setMessages(loadedMessages);
  }, []);

  // Initialize AI models when selection changes
  useEffect(() => {
    try {
      if (selectedModel === 'gemini') {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        if (!apiKey) {
          console.warn('No Gemini API key found. Please set VITE_GEMINI_API_KEY environment variable.');
          setError('Gemini API key not configured. Please add it to your .env file.');
          return;
        }
        const ai = new GoogleGenerativeAI(apiKey);
        
        const chatInstance = ai.getGenerativeModel({
          model: AI_MODELS.gemini.model,
          systemInstruction: SYSTEM_INSTRUCTION,
        });

        setChat(chatInstance.startChat({
          history: messages
            .filter(msg => msg.id !== 'initial-message')
            .map(msg => ({
              role: msg.role === 'model' ? 'model' : 'user',
              parts: [{ text: msg.text }],
            })),
        }));
        setOpenai(null);
        setError(null);
      } else if (selectedModel === 'openai') {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
        if (!apiKey) {
          console.warn('No OpenAI API key found. Please set VITE_OPENAI_API_KEY environment variable.');
          setError('OpenAI API key not configured. Please add it to your .env file.');
          return;
        }
        const openaiInstance = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true,
        });
        setOpenai(openaiInstance);
        setChat(null);
        setError(null);
      }

      // Save model selection
      localStorage.setItem(MODEL_SELECTION_STORAGE_KEY, selectedModel);
    } catch (e) {
      console.error(e);
      setError(`Failed to initialize ${AI_MODELS[selectedModel].name}. Please check the API key and configuration.`);
    }
  }, [selectedModel, messages]);

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
    if ((!chat && !openai) || isLoading) return;

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

      if (selectedModel === 'gemini' && chat) {
        const result = await chat.sendMessageStream(finalPrompt);
        let fullResponseText = '';

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponseText += chunkText;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === modelMessageId ? { ...msg, text: fullResponseText } : msg
            )
          );
        }
      } else if (selectedModel === 'openai' && openai) {
        const openaiMessages = [
          { role: 'system' as const, content: SYSTEM_INSTRUCTION },
          ...messages
            .filter(msg => msg.id !== 'initial-message')
            .map(msg => ({
              role: (msg.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user',
              content: msg.text,
            })),
          { role: 'user' as const, content: finalPrompt },
        ];

        const stream = await openai.chat.completions.create({
          model: AI_MODELS.openai.model,
          messages: openaiMessages,
          stream: true,
        });

        let fullResponseText = '';
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          fullResponseText += content;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === modelMessageId ? { ...msg, text: fullResponseText } : msg
            )
          );
        }
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
  }, [chat, openai, selectedModel, isLoading, knowledgeBase, messages]);

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
      {/* Model Selector */}
      <div className="p-3 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <label htmlFor="model-select" className="text-sm text-gray-400">AI Model:</label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as AIModel)}
            className="bg-gray-700 text-gray-100 text-sm rounded px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isLoading}
          >
            <option value="gemini">{AI_MODELS.gemini.name}</option>
            <option value="openai">{AI_MODELS.openai.name}</option>
          </select>
        </div>
        <span className="text-xs text-gray-500">Using: {AI_MODELS[selectedModel].model}</span>
      </div>

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
