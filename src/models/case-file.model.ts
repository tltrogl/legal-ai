export interface Motion {
  id: string;
  type: string;
  factualBasis: string;
  generatedText: string;
  createdAt: string;
}

export interface CaseFile {
  id: string;
  name: string;
  jurisdiction: 'federal' | 'florida';
  caseFacts: string;
  motions: Motion[];
  createdAt: string;
  updatedAt: string;
}
