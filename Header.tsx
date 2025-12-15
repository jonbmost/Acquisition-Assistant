
import React, { useState } from 'react';
import { AitLogoIcon, ChevronDownIcon } from './icons';

type HeaderProps = {
  currentRoute?: string;
  onNavigate?: (path: string) => void;
};

const Header: React.FC<HeaderProps> = ({ currentRoute = '/', onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNav = (path: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (onNavigate) {
      event.preventDefault();
      onNavigate(path);
    }
    setIsMenuOpen(false);
  };

  const linkBase =
    'text-sm md:text-base font-semibold px-3 py-1.5 rounded-lg transition border border-transparent';

  const inactive = 'text-gray-300 hover:text-cyan-300 hover:border-cyan-400/40';
  const active = 'text-cyan-100 bg-cyan-500/10 border-cyan-500/60 shadow-sm';

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-3 md:p-4 shadow-md z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center">
          <AitLogoIcon className="h-6 w-6 md:h-8 md:w-8 mr-2 md:mr-3 text-cyan-400 flex-shrink-0" />
          <h1 className="text-base md:text-xl font-bold text-gray-100 tracking-wide">
            <span className="hidden sm:inline">Agile Innovation Toolkit </span>
            <span className="sm:hidden">AIT </span>
            <span className="font-light text-cyan-400">AI Assistant</span>
          </h1>
        </div>

        <nav className="flex items-center gap-3 text-sm relative">
          <a
            href="/"
            onClick={handleNav('/')}
            className={`${linkBase} ${currentRoute === '/' ? active : inactive}`}
          >
            Chat
          </a>
          <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                className={`${linkBase} inline-flex items-center gap-2 ${isMenuOpen ? active : inactive}`}
                aria-expanded={isMenuOpen}
              aria-label="Open workspaces menu"
            >
              Workspaces
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-180' : 'rotate-0'}`}
              />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 z-20">
                <a
                  href="/strategy"
                  onClick={handleNav('/strategy')}
                  className={`block px-4 py-2 text-sm ${currentRoute.startsWith('/strategy') ? 'text-cyan-100 bg-cyan-500/10' : 'text-gray-200 hover:bg-gray-700/70'}`}
                >
                  Strategy
                </a>
                <a
                  href="/requirement-docs"
                  onClick={handleNav('/requirement-docs')}
                  className={`block px-4 py-2 text-sm ${currentRoute.startsWith('/requirement-docs') ? 'text-cyan-100 bg-cyan-500/10' : 'text-gray-200 hover:bg-gray-700/70'}`}
                >
                  Requirement Docs
                </a>
                <a
                  href="/market-research"
                  onClick={handleNav('/market-research')}
                  className={`block px-4 py-2 text-sm ${currentRoute.startsWith('/market-research') ? 'text-cyan-100 bg-cyan-500/10' : 'text-gray-200 hover:bg-gray-700/70'}`}
                >
                  Market Research
                </a>
                <a
                  href="/eval-criteria"
                  onClick={handleNav('/eval-criteria')}
                  className={`block px-4 py-2 text-sm ${currentRoute.startsWith('/eval-criteria') ? 'text-cyan-100 bg-cyan-500/10' : 'text-gray-200 hover:bg-gray-700/70'}`}
                >
                  Eval Criteria
                </a>
                <a
                  href="/sop-creation"
                  onClick={handleNav('/sop-creation')}
                  className={`block px-4 py-2 text-sm ${currentRoute.startsWith('/sop-creation') ? 'text-cyan-100 bg-cyan-500/10' : 'text-gray-200 hover:bg-gray-700/70'}`}
                >
                  SOP Creation
                </a>
                <a
                  href="/stakeholder-analysis"
                  onClick={handleNav('/stakeholder-analysis')}
                  className={`block px-4 py-2 text-sm ${currentRoute.startsWith('/stakeholder-analysis') ? 'text-cyan-100 bg-cyan-500/10' : 'text-gray-200 hover:bg-gray-700/70'}`}
                >
                  Stakeholder Analysis
                </a>
                <a
                  href="/authority-assessment"
                  onClick={handleNav('/authority-assessment')}
                  className={`block px-4 py-2 text-sm ${currentRoute.startsWith('/authority-assessment') ? 'text-cyan-100 bg-cyan-500/10' : 'text-gray-200 hover:bg-gray-700/70'}`}
                >
                  Authority Assessment
                </a>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
