/* Lightweight Qdrant HTTP wrapper used by Node scripts and backend services.
   Keeps request shape consistent and avoids relying on client SDK versions. */
import fetch from 'node-fetch';

export interface QdrantPoint {
    id: string | number;
    vector: number[];
    payload?: Record<string, any>;
}

export async function createCollection(qdrantUrl: string, apiKey: string, name: string, vectorsConfig: any) {
    const res = await fetch(`${qdrantUrl.replace(/\/$/, '')}/collections/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
        },
        body: JSON.stringify({ vectors: vectorsConfig }),
    });
    if (!res.ok && res.status !== 409) {
        const body = await res.text().catch(() => '');
        throw new Error(`Create collection failed: ${res.status} ${res.statusText} ${body}`);
    }
    return true;
}

export async function upsertPoints(qdrantUrl: string, apiKey: string, name: string, points: QdrantPoint[]) {
    const res = await fetch(`${qdrantUrl.replace(/\/$/, '')}/collections/${encodeURIComponent(name)}/points?wait=true`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
        },
        body: JSON.stringify({ points }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Upsert failed: ${res.status} ${res.statusText} ${body}`);
    }
    return res.json();
}

export async function searchPoints(qdrantUrl: string, apiKey: string, name: string, vector: number[], limit = 3) {
    const res = await fetch(`${qdrantUrl.replace(/\/$/, '')}/collections/${encodeURIComponent(name)}/points/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
        },
        body: JSON.stringify({ vector, limit }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Search failed: ${res.status} ${res.statusText} ${body}`);
    }
    return res.json();
}

export default { createCollection, upsertPoints, searchPoints };
