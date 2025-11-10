export interface Motion {
  id: string;
  type: string;
  factualBasis: string;
  generatedText: string;
  createdAt: string;
}

export interface DiscoveryAnalysis {
  id: string;
  prompt: string;
  result: string;
  createdAt: string;
}

export interface DiscoveryDocument {
  id: string;
  name: string;
  // content is base64 for media, plain text for text/pdf
  content: string; 
  mimeType: string;
  analyses: DiscoveryAnalysis[];
}

export interface CaseFile {
  id: string;
  name: string;
  jurisdiction: 'federal' | 'florida';
  caseFacts: string;
  motions: Motion[];
  discoveryDocuments: DiscoveryDocument[];
  createdAt: string;
  updatedAt: string;
}