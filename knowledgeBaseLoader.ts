// Auto-load knowledge base files from the repository
export async function loadRepositoryKnowledgeBase() {
  const knowledgeBaseFiles = import.meta.glob('/knowledge-base/**/*.{txt,md}', { 
    query: '?raw',
    import: 'default',
    eager: false 
  });

  const documents = await Promise.all(
    Object.entries(knowledgeBaseFiles).map(async ([path, loader]) => {
      const content = await loader();
      const name = path.split('/').pop() || path;
      return {
        id: `repo-${path}`,
        name,
        content: typeof content === 'string' ? content : String(content),
        isFromRepo: true,
      };
    })
  );

  return documents;
}
