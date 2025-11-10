import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse, GroundingChunk } from '@google/genai';
import { ChatMessage, ChatPart } from '../models/chat.model';
import { CaseFile, DiscoveryDocument } from '../models/case-file.model';

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

  async generateChatResponse(history: ChatMessage[], newContent: ChatPart[], deepAnalysis: boolean): Promise<GenerateContentResponse> {
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

    return chat.sendMessage(newContent);
  }

  async analyzeMedia(prompt: string, base64Data: string, mimeType: string): Promise<GenerateContentResponse> {
    const isVideo = mimeType.startsWith('video/');
    const model = isVideo ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };
    const textPart = { text: prompt };

    return this.ai.models.generateContent({
      model,
      contents: { parts: [textPart, imagePart] },
    });
  }

  async performLegalResearch(prompt: string, documentContent?: string): Promise<GenerateContentResponse> {
    if (documentContent) {
      // Document analysis uses the more powerful model
      const fullPrompt = `Based on the following document, please answer this question: "${prompt}"\n\n--- DOCUMENT ---\n${documentContent}`;
      return this.ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullPrompt,
      });
    } else {
      // No document, perform a grounded search
      return this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{googleSearch: {}}],
        }
      });
    }
  }
  
  async generateCaseIntakePrompts(jurisdiction: 'federal' | 'florida'): Promise<GenerateContentResponse> {
    const prompt = `Generate a short checklist of key questions and topics a defense attorney should cover when writing a case summary for a new criminal case in ${jurisdiction} jurisdiction. Focus on the most critical information needed for an initial case file.`;
    return this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
  }

  async extractCaseFactsFromFile(document: { content: string, mimeType: string }): Promise<GenerateContentResponse> {
    const systemInstruction = "You are an expert paralegal. Your task is to analyze the provided document and extract a concise, well-structured summary of the case facts. Focus on key events, dates, individuals, and alleged offenses. Present the facts in a clear, narrative format suitable for a case file summary.";
    
    const textPart = { text: "Please extract the case facts from the attached document." };
    const filePart = { inlineData: { data: document.content, mimeType: document.mimeType } };

    return this.ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [textPart, filePart] },
      config: { systemInstruction }
    });
  }

  async generateLegalDocument(caseFile: CaseFile, motionType: string, factualBasis: string): Promise<GenerateContentResponse> {
    const systemInstruction = `You are an expert defense paralegal drafting a legal motion. Your response MUST be only the text of the legal motion itself, properly formatted. You must cite relevant case law and statutes based on the specified jurisdiction.`;
    const context = this.buildCaseContext(caseFile);

    const prompt = `
      Case Context:
      ${context}

      ---
      Draft a "${motionType}".
      Factual Basis for this motion: ${factualBasis}
      ---
      Generate the full text of the motion now.
    `;

    return this.ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: { systemInstruction }
    });
  }

  async analyzeDiscoveryEvidence(caseFile: CaseFile, document: DiscoveryDocument, prompt: string): Promise<GenerateContentResponse> {
    const systemInstruction = "You are an expert defense paralegal analyzing a piece of discovery evidence. Provide a clear, concise analysis based on the user's prompt, keeping the full case context in mind.";
    const context = this.buildCaseContext(caseFile);

    const model = document.mimeType.startsWith('image/') ? 'gemini-2.5-flash' : 'gemini-2.5-pro';

    const fullPrompt = `
      Case Context:
      ${context}

      ---
      Analysis Request: "${prompt}"
      ---
      Analyze the attached discovery document now.
    `;

    const textPart = { text: fullPrompt };
    const filePart = { inlineData: { data: document.content, mimeType: document.mimeType } };

    return this.ai.models.generateContent({
      model,
      contents: { parts: [textPart, filePart] },
      config: { systemInstruction }
    });
  }

  private buildCaseContext(caseFile: CaseFile): string {
    let context = `
      Jurisdiction: ${caseFile.jurisdiction}
      Case Facts Summary: ${caseFile.caseFacts}
    `;

    if (caseFile.motions.length > 0) {
      context += `\n\nExisting Motions in File:\n` + caseFile.motions.map(m => `- ${m.type}`).join('\n');
    }
    if (caseFile.discoveryDocuments.length > 0) {
      context += `\n\nExisting Discovery Documents:\n` + caseFile.discoveryDocuments.map(d => `- ${d.name} (${d.mimeType})`).join('\n');
    }
    return context;
  }
}