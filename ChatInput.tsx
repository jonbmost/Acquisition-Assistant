
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, UploadIcon, PaperclipIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (text: string, file: File | null) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptTemplates = [
    {
      id: 'soo',
      title: 'Create a SOO',
      prompt: 'Create a Statement of Objectives.',
      followUp: [
        'What is the project or service about?',
        'What outcomes are you trying to achieve?',
        "What’s the period of performance?",
        'Are there any constraints, budget limits, or mandatory tech requirements?',
        'What’s the acquisition type (FAR Part 12, 13, OTA, etc.)?'
      ]
    },
    {
      id: 'pws',
      title: 'Create a PWS',
      prompt: 'Generate a Performance Work Statement.',
      followUp: [
        'What’s the technical or service requirement?',
        'What’s the intended outcome or business objective?',
        'What tasks or deliverables are expected?',
        'What are the performance standards or metrics?',
        'Where and when will the work be performed?',
        'Are there any security, clearance, or data handling requirements?'
      ]
    },
    {
      id: 'sbir-phase1',
      title: 'Phase I SBIR Proposal',
      prompt: 'Draft a Phase I SBIR proposal.',
      followUp: [
        'What agency or topic are you responding to?',
        'What is your technical concept or innovation?',
        'Who is the intended user or mission sponsor?',
        'What is your research or development plan?',
        'How do you envision transitioning or commercializing the tech?'
      ]
    },
    {
      id: 'commercialization-plan',
      title: 'Commercialization Plan',
      prompt: 'Write a commercialization plan for an SBIR or R&D project.',
      followUp: [
        'What product or technology are you commercializing?',
        'Who are the target customers (government, commercial, both)?',
        'What is your go-to-market strategy?',
        'What’s your current traction or partnerships?',
        'Are you pursuing Phase III, licensing, direct sales, etc.?'
      ]
    },
    {
      id: 'acquisition-strategy',
      title: 'Acquisition Strategy',
      prompt: 'Build an acquisition strategy.',
      followUp: [
        'What is being procured and why?',
        'What’s the estimated value and period of performance?',
        'What type of contract will be used (T&M, FFP, etc.)?',
        'What competition method or vehicle will you use (open market, GSA, 8(a), etc.)?',
        'Any specific risks, stakeholders, or regulatory considerations?'
      ]
    },
    {
      id: 'justification-memo',
      title: 'Justification Memo',
      prompt: 'Write a justification memo.',
      followUp: [
        'What type of justification is this (sole source, OTA use, Phase III, etc.)?',
        'What is the statutory or regulatory basis?',
        'Who is the vendor or contractor?',
        'What’s the rationale (urgency, uniqueness, continuity, etc.)?',
        'What market research was conducted?'
      ]
    },
    {
      id: 'linkedin-post',
      title: 'LinkedIn Post',
      prompt: 'Help me write a LinkedIn post.',
      followUp: [
        'What’s the topic or announcement?',
        'What is your takeaway or opinion on it?',
        'Who is your target audience (Gov, industry, both)?',
        'What tone should the post take (practical, reflective, policy-focused)?',
        'Any hashtags or tags to include?'
      ]
    },
    {
      id: 'meeting-talking-points',
      title: 'Meeting Talking Points',
      prompt: 'I need talking points for a meeting or briefing.',
      followUp: [
        'Who are you meeting with?',
        'What’s the topic or decision at hand?',
        'What outcome do you want from the conversation?',
        'Any sensitivities or constraints to avoid?'
      ]
    }
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleTemplateClick = (prompt: string, followUp: string[]) => {
    const followUpBlock = followUp.length
      ? `\n\nInclude these details if relevant:\n- ${followUp.join('\n- ')}`
      : '';
    setText(`${prompt}${followUpBlock}`);
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    if ((text.trim() || file) && !isLoading) {
      onSendMessage(text.trim(), file);
      setText('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {promptTemplates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => handleTemplateClick(tpl.prompt, tpl.followUp)}
            className="text-xs md:text-sm px-3 py-1.5 rounded-md bg-gray-700 text-gray-100 hover:bg-cyan-600 hover:text-white transition-colors"
            aria-label={`Use template: ${tpl.title}`}
          >
            {tpl.title}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".txt,.md,.docx,.pdf"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 md:p-2 text-gray-400 hover:text-cyan-400 rounded-md transition-colors duration-200 flex-shrink-0"
          aria-label="Attach file"
        >
          <UploadIcon className="h-5 w-5 md:h-6 md:w-6" />
        </button>
        <div className="flex-1 flex flex-col">
          {file && (
            <div className="bg-gray-700 px-2 md:px-3 py-1.5 rounded-md mb-2 text-xs md:text-sm flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-300">
                <PaperclipIcon className="h-3 w-3 md:h-4 md:w-4" />
                <span className="truncate">{file.name}</span>
              </div>
              <button onClick={removeFile} className="text-gray-400 hover:text-white text-lg">&times;</button>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Draft a SOO for a SaaS prototype..."
            className="w-full bg-transparent text-sm md:text-base text-gray-100 placeholder-gray-500 focus:outline-none resize-none max-h-32 md:max-h-48"
            rows={1}
            disabled={isLoading}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={isLoading || (!text.trim() && !file)}
          className="p-1.5 md:p-2 bg-cyan-500 text-white rounded-md transition-colors duration-200 flex-shrink-0 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-cyan-600"
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <SendIcon className="h-5 w-5 md:h-6 md:w-6" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
