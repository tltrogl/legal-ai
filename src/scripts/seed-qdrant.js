// Simple seeding script for Qdrant to exercise upsert/search plumbing.
// This uses a very simple placeholder embedding function; replace with a real embeddings provider.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load dotenv if present in local dev. In production/CI set variables in the environment.
try {
    // eslint-disable-next-line node/no-extraneous-import
    await import('dotenv/config');
} catch (e) {
    // ignore if dotenv is not installed globally; package.json includes it as devDependency.
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prefer process.env for credentials. Fallback to local TS env file for backward compatibility.
let QDRANT_URL = process.env.QDRANT_URL;
let QDRANT_API_KEY = process.env.QDRANT_API_KEY;

if (!QDRANT_URL || !QDRANT_API_KEY) {
    // try to read src/environments/environment.local.ts as a fallback (developer convenience only)
    const envFilePath = path.resolve(__dirname, '..', 'environments', 'environment.local.ts');
    try {
        const envFileContent = fs.readFileSync(envFilePath, 'utf-8');
        const urlMatch = envFileContent.match(/qdrantUrl:\s*['"](.*?)['"]/);
        const keyMatch = envFileContent.match(/qdrantApiKey:\s*['"](.*?)['"]/);
        if (urlMatch && keyMatch) {
            QDRANT_URL = urlMatch[1];
            QDRANT_API_KEY = keyMatch[1];
        }
    } catch (error) {
        // no local TS env file — we'll error below with a helpful message
    }
}

if (!QDRANT_URL || !QDRANT_API_KEY) {
    console.error('QDRANT_URL and QDRANT_API_KEY are required. Set them in .env.local or in the environment. See .env.example.');
    process.exit(1);
}

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

    // Qdrant requires point IDs to be numeric or UUID strings. Use numeric IDs and keep original id in payload.
    const points = docs.map((d, idx) => ({ id: idx + 1, vector: simpleTextToVector(d.text), payload: { sourceId: d.id, text: d.text } }));
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
