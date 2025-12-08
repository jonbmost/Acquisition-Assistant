
import React from 'react';
import { AitLogoIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 shadow-md z-10">
      <div className="max-w-5xl mx-auto flex items-center">
        <AitLogoIcon className="h-8 w-8 mr-3 text-cyan-400" />
        <h1 className="text-xl font-bold text-gray-100 tracking-wide">
          Agile Innovation Toolkit <span className="font-light text-cyan-400">AI Assistant</span>
        </h1>
      </div>
    </header>
  );
};

export default Header;
