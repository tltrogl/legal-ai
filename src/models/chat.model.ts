
export interface TextPart {
  text: string;
}

export interface InlineDataPart {
  inlineData: {
    mimeType: string;
    data: string; // base64 string
  };
}

export type ChatPart = TextPart | InlineDataPart;


export interface ChatMessage {
  role: 'user' | 'model';
  parts: ChatPart[];
}