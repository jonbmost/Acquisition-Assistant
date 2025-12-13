# Deployment Guide for Acquisition Assistant

## Overview
The Acquisition Assistant (Agile Innovation Toolkit) is now configured for automated deployment to GitHub Pages.

## Build Configuration
- **Build Tool**: Vite
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS (via CDN)
- **AI Integration**: Anthropic Claude Sonnet 4

## GitHub Pages Deployment

### Automatic Deployment
The application automatically deploys to GitHub Pages when you push to the `main` branch.

### Setup Steps

1. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to Pages section
   - Under "Build and deployment":
     - Source: GitHub Actions

2. **Configure API Key**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add a new repository secret:
     - Name: `ANTHROPIC_API_KEY`
     - Value: Your Anthropic Claude API key (server-side only)

3. **Deploy**:
   - Push to main branch (already done!)
   - GitHub Actions will automatically build and deploy
   - Your site will be available at: `https://jonbmost.github.io/Acquisition-Assistant/`

## Local Development

### Prerequisites
- Node.js 20+ and npm

### Setup
```bash
npm install
```

### Development Server
```bash
npm run dev
```
This starts a local development server at `http://localhost:5173`

### Build Locally
```bash
npm run build
```
Output will be in the `dist` folder.

### Preview Production Build
```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory (not tracked in git):
```
ANTHROPIC_API_KEY=your_api_key_here
```

## Manual Deployment (Alternative)

If you prefer to deploy manually using gh-pages:
```bash
npm run deploy
```
This builds and pushes the `dist` folder to the `gh-pages` branch.

## Repository Structure
```
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions workflow
├── dist/                      # Build output (generated)
├── node_modules/              # Dependencies (generated)
├── App.tsx                    # Main application component
├── ChatWindow.tsx             # Chat interface
├── ChatMessage.tsx            # Message display
├── ChatInput.tsx              # Message input
├── Sidebar.tsx                # Knowledge base sidebar
├── Header.tsx                 # Application header
├── icons.tsx                  # Icon components
├── types.ts                   # TypeScript types
├── constants.ts               # Application constants
├── index.html                 # HTML entry point
├── index.tsx                  # React entry point
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript config
├── package.json               # Dependencies & scripts
└── .gitignore                 # Git ignore rules
```

## Troubleshooting

### Build Fails
- Ensure all dependencies are installed: `npm ci`
- Check for TypeScript errors: `npx tsc --noEmit`

### Deployment Fails
- Verify GitHub Pages is enabled in repository settings
- Check that the `ANTHROPIC_API_KEY` secret is set
- Review GitHub Actions logs in the Actions tab

### API Key Issues
- Ensure your Anthropic API key is valid
- For production, always use repository secrets, never commit API keys

## Next Steps

1. Monitor the GitHub Actions workflow: https://github.com/jonbmost/Acquisition-Assistant/actions
2. Once deployed, visit: https://jonbmost.github.io/Acquisition-Assistant/
3. Add your Anthropic API key in repository secrets if not already done

## Notes

- The base URL is configured for `/Acquisition-Assistant/` to match the GitHub Pages path
- Static assets are bundled and optimized during build
- The application uses localStorage for chat history and knowledge base persistence
