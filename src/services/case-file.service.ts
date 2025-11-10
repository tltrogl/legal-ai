import { Injectable } from '@angular/core';
import { CaseFile } from '../models/case-file.model';

@Injectable({
  providedIn: 'root',
})
export class CaseFileService {
  private readonly STORAGE_KEY = 'lexi-ai-case-files';

  getCaseFiles(): CaseFile[] {
    try {
      const filesJson = localStorage.getItem(this.STORAGE_KEY);
      return filesJson ? JSON.parse(filesJson) : [];
    } catch (e) {
      console.error('Error reading case files from localStorage', e);
      return [];
    }
  }
  
  getCaseFile(id: string): CaseFile | undefined {
    const files = this.getCaseFiles();
    return files.find(file => file.id === id);
  }

  saveNewCase(caseFile: Omit<CaseFile, 'id' | 'motions' | 'createdAt' | 'updatedAt'>): CaseFile {
    const files = this.getCaseFiles();
    const newCase: CaseFile = {
      ...caseFile,
      id: self.crypto.randomUUID(),
      motions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    files.push(newCase);
    this.saveAllFiles(files);
    return newCase;
  }
  
  updateCaseFile(updatedFile: CaseFile): CaseFile {
    let files = this.getCaseFiles();
    updatedFile.updatedAt = new Date().toISOString();
    files = files.map(file => file.id === updatedFile.id ? updatedFile : file);
    this.saveAllFiles(files);
    return updatedFile;
  }

  deleteCaseFile(id: string): void {
    let files = this.getCaseFiles();
    files = files.filter(file => file.id !== id);
    this.saveAllFiles(files);
  }

  private saveAllFiles(files: CaseFile[]): void {
    try {
      // Sort by most recently updated
      files.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      const filesJson = JSON.stringify(files);
      localStorage.setItem(this.STORAGE_KEY, filesJson);
    } catch (e) {
      console.error('Error saving case files to localStorage', e);
    }
  }
}
