
import React from 'react';
import { AitLogoIcon } from './icons';

type HeaderProps = {
  currentRoute?: string;
  onNavigate?: (path: string) => void;
};

const Header: React.FC<HeaderProps> = ({ currentRoute = '/', onNavigate }) => {
  const handleNav = (path: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (onNavigate) {
      event.preventDefault();
      onNavigate(path);
    }
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

        <nav className="flex items-center gap-2 text-sm">
          <a
            href="/"
            onClick={handleNav('/')}
            className={`${linkBase} ${currentRoute === '/' ? active : inactive}`}
          >
            Chat
          </a>
          <a
            href="/eval-criteria"
            onClick={handleNav('/eval-criteria')}
            className={`${linkBase} ${currentRoute.startsWith('/eval-criteria') ? active : inactive}`}
          >
            Eval Criteria
          </a>
          <a
            href="/strategy"
            onClick={handleNav('/strategy')}
            className={`${linkBase} ${currentRoute.startsWith('/strategy') ? active : inactive}`}
          >
            Strategy
          </a>
          <a
            href="/requirement-docs"
            onClick={handleNav('/requirement-docs')}
            className={`${linkBase} ${currentRoute.startsWith('/requirement-docs') ? active : inactive}`}
          >
            Requirement Docs
          </a>
          <a
            href="/market-research"
            onClick={handleNav('/market-research')}
            className={`${linkBase} ${currentRoute.startsWith('/market-research') ? active : inactive}`}
          >
            Market Research
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
