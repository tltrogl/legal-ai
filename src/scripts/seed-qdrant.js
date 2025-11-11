// Simple seeding script for Qdrant to exercise upsert/search plumbing.
// This uses a very simple placeholder embedding function; replace with a real embeddings provider.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Start: Read credentials directly from environment file ---
const envFilePath = path.resolve(__dirname, '..', 'environments', 'environment.local.ts');
let QDRANT_URL;
let QDRANT_API_KEY;

try {
    const envFileContent = fs.readFileSync(envFilePath, 'utf-8');
    const urlMatch = envFileContent.match(/qdrantUrl: '(.*?)'/);
    const keyMatch = envFileContent.match(/qdrantApiKey: '(.*?)'/);

    if (!urlMatch || !keyMatch) {
        throw new Error('Could not parse credentials from environment.local.ts');
    }

    QDRANT_URL = urlMatch[1];
    QDRANT_API_KEY = keyMatch[1];
} catch (error) {
    console.error(`Failed to read or parse environment file at ${envFilePath}`, error);
    process.exit(1);
}
// --- End: Read credentials ---

// Use direct HTTP calls to Qdrant REST API to avoid client-version mismatches.
async function qdrantCreateCollection(name, vectorsConfig) {
    const res = await fetch(`${QDRANT_URL}/collections/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'api-key': QDRANT_API_KEY,
        },
        body: JSON.stringify({ vectors: vectorsConfig }),
    });
    if (!res.ok && res.status !== 409) {
        const body = await res.text().catch(() => '');
        throw new Error(`Create collection failed: ${res.status} ${res.statusText} ${body}`);
    }
    return true;
}

async function qdrantUpsertPoints(name, points) {
    const res = await fetch(`${QDRANT_URL}/collections/${encodeURIComponent(name)}/points?wait=true`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'api-key': QDRANT_API_KEY,
        },
        body: JSON.stringify({ points }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Upsert failed: ${res.status} ${res.statusText} ${body}`);
    }
    return res.json();
}

async function qdrantSearch(name, vector, limit = 3) {
    const res = await fetch(`${QDRANT_URL}/collections/${encodeURIComponent(name)}/points/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': QDRANT_API_KEY,
        },
        body: JSON.stringify({ vector, limit }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Search failed: ${res.status} ${res.statusText} ${body}`);
    }
    return res.json();
}

function simpleTextToVector(text, dim = 64) {
    // naive hashing to a fixed-dim vector (not semantic). Replace later with an embedding model.
    const v = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
        v[i % dim] += text.charCodeAt(i) % 100;
    }
    // normalize
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map(x => x / norm);
}

async function run() {
    const collection = 'legal_docs';
    try {
        await qdrantCreateCollection(collection, { size: 64, distance: 'Cosine' });
    } catch (e) {
        // may already exist or fail; propagate if critical
        console.warn('Create collection warning:', e.message);
    }

    const docs = [
        { id: 'doc1', text: 'Affidavit describing incident at Main St on 2021-05-12.' },
        { id: 'doc2', text: 'Police report: witness statement about vehicle description and license plate.' },
        { id: 'doc3', text: 'Forensic lab results showing DNA match to subject in custody.' },
    ];

    const points = docs.map(d => ({ id: d.id, vector: simpleTextToVector(d.text), payload: { text: d.text } }));
    await qdrantUpsertPoints(collection, points);
    console.log('Seeded', points.length, 'points');

    const q = 'witness vehicle license';
    const qVec = simpleTextToVector(q);
    const res = await qdrantSearch(collection, qVec, 3);
    console.log('Query results:');
    console.log(res);
}

run().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
