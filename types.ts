
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  fileName?: string;
  sources?: {
    uri: string;
    title: string;
  }[];
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  content: string;
  isFromRepo?: boolean; // Flag to indicate if document is from repository
}
