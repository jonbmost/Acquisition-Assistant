
import React from 'react';
import { AitLogoIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-3 md:p-4 shadow-md z-10">
      <div className="max-w-5xl mx-auto flex items-center">
        <AitLogoIcon className="h-6 w-6 md:h-8 md:w-8 mr-2 md:mr-3 text-cyan-400 flex-shrink-0" />
        <h1 className="text-base md:text-xl font-bold text-gray-100 tracking-wide">
          <span className="hidden sm:inline">Agile Innovation Toolkit </span>
          <span className="sm:hidden">AIT </span>
          <span className="font-light text-cyan-400">AI Assistant</span>
        </h1>
      </div>
    </header>
  );
};

export default Header;
