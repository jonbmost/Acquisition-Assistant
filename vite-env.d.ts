/// <reference types="vite/client" />

interface ImportMetaEnv {
  // No client-exposed environment variables. Serverless routes read process.env.ANTHROPIC_API_KEY.
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
