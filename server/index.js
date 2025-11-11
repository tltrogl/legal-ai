import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION = process.env.QDRANT_COLLECTION || 'legal_docs';

function simpleTextToVector(text, dim = 64) {
    const v = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
        v[i % dim] += text.charCodeAt(i) % 100;
    }
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map(x => x / norm);
}

async function qdrantCreateCollection(name, vectorsConfig) {
    const res = await fetch(`${QDRANT_URL.replace(/\/$/, '')}/collections/${encodeURIComponent(name)}`, {
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
    const res = await fetch(`${QDRANT_URL.replace(/\/$/, '')}/collections/${encodeURIComponent(name)}/points?wait=true`, {
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
    const res = await fetch(`${QDRANT_URL.replace(/\/$/, '')}/collections/${encodeURIComponent(name)}/points/search`, {
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

app.get('/', (req, res) => res.json({ ok: true, env: !!QDRANT_URL }));

// Dev-only seed endpoint (POST) — seeds a few sample docs
app.post('/api/seed', async (req, res) => {
    if (!QDRANT_URL || !QDRANT_API_KEY) return res.status(500).json({ error: 'QDRANT_URL or QDRANT_API_KEY not set in environment' });
    try {
        await qdrantCreateCollection(COLLECTION, { size: 64, distance: 'Cosine' });
        const docs = [
            { id: 'doc1', text: 'Affidavit describing incident at Main St on 2021-05-12.' },
            { id: 'doc2', text: 'Police report: witness statement about vehicle description and license plate.' },
            { id: 'doc3', text: 'Forensic lab results showing DNA match to subject in custody.' },
        ];
        const points = docs.map((d, idx) => ({ id: idx + 1, vector: simpleTextToVector(d.text), payload: { sourceId: d.id, text: d.text } }));
        await qdrantUpsertPoints(COLLECTION, points);
        return res.json({ seeded: points.length });
    } catch (e) {
        console.error('Seed error', e);
        return res.status(500).json({ error: e.message });
    }
});

// Search endpoint — accepts { query, topK }
app.post('/api/search', async (req, res) => {
    if (!QDRANT_URL || !QDRANT_API_KEY) return res.status(500).json({ error: 'QDRANT_URL or QDRANT_API_KEY not set in environment' });
    const { query, topK = 5 } = req.body || {};
    if (!query) return res.status(400).json({ error: 'query is required' });
    try {
        const vector = simpleTextToVector(String(query));
        const result = await qdrantSearch(COLLECTION, vector, topK);
        return res.json(result);
    } catch (e) {
        console.error('Search error', e);
        return res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} — Qdrant configured: ${!!QDRANT_URL}`);
});
