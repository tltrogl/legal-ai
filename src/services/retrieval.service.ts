import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import qdrant from '../lib/qdrant-http';

@Injectable({ providedIn: 'root' })
export class RetrievalService {
    private endpoint = environment.qdrantUrl;
    private apiKey = environment.qdrantApiKey;

    async ensureCollection(collectionName: string, vectorSize = 512) {
        await qdrant.createCollection(this.endpoint, this.apiKey, collectionName, { size: vectorSize, distance: 'Cosine' });
    }

    async upsert(collectionName: string, points: Array<{ id: string; vector: number[]; payload?: any }>) {
        return qdrant.upsertPoints(this.endpoint, this.apiKey, collectionName, points as any);
    }

    async search(collectionName: string, vector: number[], topK = 5) {
        const res = await qdrant.searchPoints(this.endpoint, this.apiKey, collectionName, vector, topK);
        return res;
    }
}
