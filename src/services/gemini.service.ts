import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ChatMessage } from '../models/chat.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    if (!process.env.API_KEY) {
      throw new Error('API_KEY environment variable not set');
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateChatResponse(history: ChatMessage[], newMessage: string, deepAnalysis: boolean): Promise<GenerateContentResponse> {
    const model = deepAnalysis ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    // Deep Analysis / Thinking Mode uses Pro with max thinking budget.
    // Standard mode uses Flash with no thinking for speed.
    const config = deepAnalysis 
      ? { thinkingConfig: { thinkingBudget: 32768 } } 
      : { thinkingConfig: { thinkingBudget: 0 } };
    
    const chat = this.ai.chats.create({
        model,
        history,
        config
    });

    return chat.sendMessage({ message: newMessage });
  }

  async analyzeMedia(prompt: string, fileBase64: string, mimeType: string): Promise<GenerateContentResponse> {
    // Use Pro for complex video analysis, Flash for images and audio.
    const model = mimeType.startsWith('video/') ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    const promptPart = {
      text: prompt,
    };

    const mediaPart = {
      inlineData: {
        mimeType,
        data: fileBase64,
      },
    };

    return this.ai.models.generateContent({
        model,
        contents: { parts: [promptPart, mediaPart] }
    });
  }

  async analyzeDiscoveryEvidence(
    caseContext: string,
    prompt: string,
    fileContent: string, // Can be base64 or plain text
    mimeType: string
  ): Promise<GenerateContentResponse> {
    const systemInstruction = `You are an expert paralegal analyzing a piece of discovery evidence in the context of a legal case.
    Case Summary:
    ---
    ${caseContext}
    ---
    Your task is to analyze the provided evidence (text, image, or video) based on the user's specific prompt. Be thorough, objective, and highlight legally significant details.`;

    if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
      const model = mimeType.startsWith('video/') ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
      const parts = [
        { text: prompt },
        { inlineData: { mimeType, data: fileContent } }
      ];
      return this.ai.models.generateContent({
        model,
        contents: { parts },
        config: { systemInstruction }
      });
    } else { // Text or PDF content
      const model = 'gemini-2.5-pro';
      const fullPrompt = `Evidence Document Content:\n\n---\n${fileContent}\n---\n\nUser's Analysis Request: "${prompt}"`;
      
      return this.ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });
    }
  }

  async performLegalResearch(query: string, documentContext?: string): Promise<GenerateContentResponse> {
    // Use Pro for complex document analysis, Flash for simple grounded search.
    const model = documentContext ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    const config: { 
        thinkingConfig?: { thinkingBudget: number };
        tools?: { googleSearch: Record<string, never> }[];
    } = {};

    if (documentContext) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    } else {
      config.tools = [{ googleSearch: {} }];
    }

    const finalQuery = documentContext
      ? `Based on the following document, please answer the user's query. If the query is a general question, use the document as primary context but you may also use your own knowledge. If the query is a request to analyze or summarize the document, focus solely on the document's content.\n\n---\nDOCUMENT CONTENT:\n${documentContext}\n---\n\nUSER QUERY: "${query}"`
      : query;

    return this.ai.models.generateContent({
        model,
        contents: finalQuery,
        config,
    });
  }

  async generateLegalDocument(
    jurisdiction: 'federal' | 'florida',
    caseName: string,
    caseFacts: string,
    motionType: string,
    factualBasis: string
  ): Promise<GenerateContentResponse> {
    const model = 'gemini-2.5-pro';
    
    const jurisdictionRules = jurisdiction === 'federal'
        ? 'You must cite the Federal Rules of Criminal Procedure and relevant federal case law from United States District Courts, Circuit Courts of Appeals, and the Supreme Court of the United States.'
        : 'You must cite relevant Florida Statutes (F.S.) and case law from Florida District Courts of Appeal (DCA) and the Florida Supreme Court.';

    const systemInstruction = `You are an expert criminal defense paralegal. Your task is to draft a legal motion based on the user's request. The motion must be well-structured, professionally toned, and legally sound for the specified jurisdiction.
    
    - **Jurisdiction Rules:** ${jurisdictionRules}
    - **Document Structure:** The motion should include a title, a clear introduction stating the relief sought, a section detailing the factual basis, a legal argument section citing appropriate rules and case law, and a conclusion summarizing the request.
    - **Tone:** Formal and persuasive.
    - **Citations:** Ensure citations are formatted correctly for the jurisdiction.
    `;

    const contents = `
      **Case Name/Number:** ${caseName}
      **Jurisdiction:** ${jurisdiction}
      **Summary of Case Facts:** 
      ${caseFacts}
      
      ---
      
      **Motion to be Drafted:** ${motionType}
      **Factual Basis for this Motion:** 
      ${factualBasis}
      
      ---
      
      Please draft the full text of the requested motion based on the information provided.
    `;

    return this.ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
  }
}