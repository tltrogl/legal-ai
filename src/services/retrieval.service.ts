import { Injectable } from '@angular/core';
// Using the REST client for Qdrant
import { QdrantClient, VectorParams } from '@qdrant/js-client-rest';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class RetrievalService {
    private client: QdrantClient | null = null;
    private endpoint = environment.qdrantUrl;
    private apiKey = environment.qdrantApiKey;

    async connect() {
        if (!this.client) {
            this.client = new QdrantClient({
                url: this.endpoint,
                apiKey: this.apiKey,
            });
        }
        return this.client;
    }

    async ensureCollection(collectionName: string, vectorSize = 512) {
        const client = await this.connect();
        try {
            await client.getCollection(collectionName);
        } catch (e) {
            await client.createCollection(collectionName, {
                vectors: { size: vectorSize, distance: 'Cosine' } as VectorParams,
            });
        }
    }

    async upsert(collectionName: string, points: Array<{ id: string; vector: number[]; payload?: any }>) {
        const client = await this.connect();
        await client.upsert(collectionName, { wait: true, points });
    }

    async search(collectionName: string, vector: number[], topK = 5) {
        const client = await this.connect();
        const res = await client.search(collectionName, { vector, limit: topK });
        return res; // contains array of scored points
    }
}
