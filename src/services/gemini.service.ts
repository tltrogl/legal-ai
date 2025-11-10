import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ChatMessage } from '../models/chat.model';
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
    caseFile: CaseFile,
    documentToAnalyze: DiscoveryDocument,
    prompt: string
  ): Promise<GenerateContentResponse> {
    const { caseFacts, motions, discoveryDocuments } = caseFile;
    const { content: fileContent, mimeType, name: docName } = documentToAnalyze;

    // Context of other documents, excluding the one being analyzed
    const otherDocsContext = discoveryDocuments.filter(d => d.id !== documentToAnalyze.id).length > 0
      ? `Other Available Discovery Documents:\n${discoveryDocuments.filter(d => d.id !== documentToAnalyze.id).map(d => `- ${d.name} (${d.mimeType})`).join('\n')}`
      : 'There are no other discovery documents in the file.';

    const motionsContext = motions.length > 0
      ? `Filed Motions:\n${motions.map(m => `- ${m.type}`).join('\n')}`
      : 'No motions have been filed yet.';

    const systemInstruction = `You are an expert paralegal analyzing a piece of discovery evidence in the context of a legal case.
    Case Summary:
    ---
    ${caseFacts}
    ---
    Case History & Other Documents:
    ---
    ${motionsContext}
    ${otherDocsContext}
    ---
    Your task is to analyze the provided evidence document ("${docName}") based on the user's specific prompt. Use the full case context provided to inform your analysis. Be thorough, objective, and highlight legally significant details, connections, or inconsistencies.`;

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
      const fullPrompt = `Evidence Document Content ("${docName}"):\n\n---\n${fileContent}\n---\n\nUser's Analysis Request: "${prompt}"`;
      
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
    caseFile: CaseFile,
    motionType: string,
    factualBasis: string
  ): Promise<GenerateContentResponse> {
    const model = 'gemini-2.5-pro';
    const { jurisdiction, name: caseName, caseFacts, motions, discoveryDocuments } = caseFile;

    const jurisdictionRules = jurisdiction === 'federal'
        ? 'You must cite the Federal Rules of Criminal Procedure and relevant federal case law from United States District Courts, Circuit Courts of Appeals, and the Supreme Court of the United States.'
        : 'You must cite relevant Florida Statutes (F.S.) and case law from Florida District Courts of Appeal (DCA) and the Florida Supreme Court.';

    const systemInstruction = `You are an expert criminal defense paralegal. Your task is to draft a legal motion based on the user's request. The motion must be well-structured, professionally toned, and legally sound for the specified jurisdiction.
    
    - **Jurisdiction Rules:** ${jurisdictionRules}
    - **Document Structure:** The motion should include a title, a clear introduction stating the relief sought, a section detailing the factual basis, a legal argument section citing appropriate rules and case law, and a conclusion summarizing the request.
    - **Tone:** Formal and persuasive.
    - **Citations:** Ensure citations are formatted correctly for the jurisdiction.
    `;
    
    const existingMotionsContext = motions.length > 0 
      ? `Existing Motions in Case File:\n${motions.map(m => `- ${m.type} (Filed: ${new Date(m.createdAt).toLocaleDateString()})`).join('\n')}`
      : 'No existing motions have been filed.';
      
    const discoveryContext = discoveryDocuments.length > 0
      ? `Available Discovery Documents in Case File:\n${discoveryDocuments.map(d => `- ${d.name} (${d.mimeType})`).join('\n')}`
      : 'No discovery documents have been uploaded yet.';

    const contents = `
      **Case Name/Number:** ${caseName}
      **Jurisdiction:** ${jurisdiction}
      
      **Summary of Case Facts:** 
      ${caseFacts}

      **Case History & Existing Documents Context:**
      ${existingMotionsContext}
      ${discoveryContext}
      
      ---
      
      **NEW Motion to be Drafted:** ${motionType}
      **Factual Basis for this NEW Motion:** 
      ${factualBasis}
      
      ---
      
      Please draft the full text of the requested new motion based on ALL the information provided, including the case facts and the context of existing documents and motions.
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