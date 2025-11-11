# Agents (ChatGPT / Codex Cloud) — Best Practices

This document describes recommended conventions, file layouts and operational practices for building, testing, and deploying "agents" that run in or alongside ChatGPT / Codex-style cloud environments. It synthesizes industry best practices for agent metadata, tool integration, security, testing, observability and developer workflows. Use this as a practical checklist and reference when creating agents for this project (legal-ai).

## Purpose
- Provide a single reference explaining how agents are authored, configured, and maintained.
- Define a minimal manifest / metadata contract for each agent so it can be registered, inspected, and tested consistently.
- Show recommended patterns for tool integration (e.g., vector DB retrieval, external tools/APIs) and safe handling of secrets.

## Refactor goals & immediate objectives
This repository is undergoing a small, focused refactor to make agent tooling reliable, reproducible, and safe for local development and CI. The goals below are intentional, small, and testable so automated agents and humans can validate progress.

- Standardize environment handling
  - Move Node scripts to read secrets from environment variables (use `dotenv` in local dev). Stop importing Angular `.ts` environment modules from Node.
- Stabilize Qdrant integration
  - Prefer small, well-documented REST wrappers (`src/lib/qdrant-http.ts`) for short scripts to avoid SDK version friction; ensure `seed-qdrant` works reliably against Qdrant Cloud.
- Make retrieval reusable and testable
  - Refactor `RetrievalService` to call the shared wrapper so both backend scripts and frontend backends use the same request shape.
- Add minimal CI validation for agents
  - Add a smoke-test job that runs `seed-qdrant` and a minimal retrieval smoke-test in CI using secrets stored in the Actions secrets store.
- Safety and secrets hygiene
  - Keep secrets out of the frontend; provide `.env.example` and instruct developers to use `.env.local` (gitignored).

Acceptance criteria (short):
- `npm run seed-qdrant` completes locally when `.env.local` contains valid Qdrant Cloud creds.
- `src/lib/qdrant-http.ts` exists and is used by `src/services/retrieval.service.ts`.
- A minimal smoke-test script (`src/scripts/smoke-test.js`) runs and returns expected top-K ids for seeded docs.
- CI job exists that runs seed + smoke-test using repository secrets.

## Audience
- Engineers building agents that orchestrate LLMs and external tools (retrieval, web calls, DBs) for `legal-ai`.
- Devops / SRE responsible for deploying and monitoring agents.
- Security reviewers assessing the agent's external integrations and secret handling.

## High-level agent contract (what an agent *is*)
- An agent implements a bounded set of capabilities / intents (e.g., "legal research", "evidence summarization").
- It exposes a manifest (metadata) describing: id, name, description, version, author, triggers, tools allowed, and required config/secrets.
- It implements a deterministic tool-action loop: observe -> choose tool/action -> run tool -> ingest result -> respond.
- It must include test vectors (example prompts + expected behavior) and a safety policy section.

## Recommended repo layout (suggested)
- agents/
  - <agent-id>/
    - manifest.yaml (or manifest.json)
    - README.md (agent-specific docs)
    - tests/
      - integration.test.json
      - unit/...
    - scripts/
      - seed-data.js
      - smoke-test.js
    - tools/ (light wrappers the agent uses)
      - qdrant-http.ts
      - search-tool.ts
      - generate-tool.ts

Place global, multi-agent utilities in `src/lib/` or `scripts/` depending on runtime.

## Agent manifest — minimal fields (YAML example)

A manifest is a small, machine-readable file describing the agent. Keep it lean and explicit.

Example `manifest.yaml`:

```yaml
id: legal-research-agent
name: Legal Research Assistant
version: "0.1.0"
description: |
  Agent that performs legal research by retrieving relevant case documents
  from the vector DB (Qdrant) and drafting concise summaries for attorneys.
author: Your Name <you@example.com>
intents:
  - find-relevant-cases
  - summarize-document
triggers:
  - on_message
  - on_http_request: /api/agents/legal-research
tools:
  - id: qdrant_search
    type: http
    description: "Search Qdrant for top-k document vectors"
    config:
      endpoint_env: QDRANT_URL
      api_key_env: QDRANT_API_KEY
  - id: llm_generate
    type: llm
    description: "Ask the chosen LLM to summarize or draft text"
    config:
      provider: ollama|groq|chatgpt-web
      model: llama2-13b
secrets:
  - QDRANT_API_KEY
  - OLLAMA_API_KEY
security:
  allowed_origins: ["https://app.example.org"]
  min_privilege: least_privilege
monitoring:
  metrics: [requests_total, errors_total, avg_latency_ms]
  logging: structured
tests:
  - tests/integration.test.json

``` 

Notes:
- Keep provider identifiers generic so the same manifest works with Ollama, Groq, or other LLMs.
- Use `*_env` references rather than storing secrets in the manifest.

## Tool design & integration
Agents will rely on a small set of well-defined tools. Each tool should have:
- Id and human-friendly name
- Transport type (http, rpc, local, llm)
- Input schema and example
- Output schema and example
- Failure semantics (retry, backoff, fallback)

Example tool spec (qdrant_search):
- Transport: HTTP REST
- Input: { query_embedding: number[], collection: string, topK: number }
- Output: [ { id, score, payload } ]
- Errors: return 4xx for bad request, 5xx for transient server; client must implement retry/backoff.

Implementation recommendation:
- Provide a small HTTP wrapper `src/lib/qdrant-http.ts` that both Node scripts and Angular services can call.
- For browser clients, never embed the API key; route calls through a backend service or use a short-lived proxy token.

## Configuration & secrets
- Use environment variables for secrets: QDRANT_URL, QDRANT_API_KEY, OLLAMA_API_KEY, GROQ_API_KEY.
- Keep a `.env.example` in repo root listing keys (without values).
- Local dev: `.env.local` (added to .gitignore) with real values.
- CI: use the GitHub Actions secrets store (do not commit secrets to code).

Example `.env.example`:

```
QDRANT_URL=
QDRANT_API_KEY=
OLLAMA_API_KEY=
GROQ_API_KEY=
```

## Node vs Browser runtime rules
- Node scripts (seeding, tools, testing) should read config via `process.env` or `dotenv` and must not import TypeScript-only Angular environment files.
- Angular runtime should use `src/environments/environment.ts` for build-time values (these are safe for non-secret config). DO NOT put secrets in front-end code.
- For shared code between Node and Angular, export plain JS functions or REST wrappers, not TS environment modules.

## Example RAG flow (high-level)
1. User query arrives at agent.
2. Agent builds a short query and asks the embedding tool (or uses a local embedding model) to produce a vector.
3. Agent calls Qdrant (qdrant_search tool) with the vector and receives top-K documents.
4. Agent builds a prompt template that includes top-K context snippets (source-attributed).
5. Agent calls LLM (llm_generate tool) with the prompt and returns the generated answer with citations.

Prompt template example:

```
You are a legal research assistant. Use the documents below to answer the user's question.

Documents:
{{#each docs}}
- [{{this.id}}] {{this.payload.text}}
{{/each}}

Question: {{question}}
Answer concisely and include references to documents by id.
```

## Safety & policy
- Agents must verify sensitive intent before using any personal data (PII). Add explicit confirmation steps.
- Implement rate limiting and quotas for expensive tools (LLMs, external APIs).
- Sanitize tool outputs before returning to users (strip binaries, huge payloads).
- Log only metadata and safe telemetry in production. Avoid logging secrets or whole documents unless encrypted.

## Testing
- Unit tests for tools: mock HTTP responses and verify parsing.
- Integration (smoke) tests:
  - seed a test collection
  - run a sample query
  - verify expected doc ids returned and an LLM call completes.
- Regression tests: store seed inputs and expected top-K ids in `agents/<id>/tests`.

Minimal test script example (pseudo):

```bash
# run from repo root
cp .env.example .env.local    # add values locally
npm run seed-qdrant
node src/scripts/smoke-test.js
```

## Observability
- Export structured logs with spans and correlation ids.
- Capture metrics: requests, success/fail ratio, latencies, LLM token usage.
- Configure alerts on high error rates or high latency.

## Deployment checklist
- [ ] Manifest file present and validated
- [ ] Secrets stored in secure store (CI / vault)
- [ ] Smoke test passes against staging Qdrant instance
- [ ] Monitoring dashboards configured
- [ ] Automatic rollback on repeated failures

## Example agent for `legal-ai` (summary)
Agent: `legal-research-agent`
- Tools: qdrant_search (cloud), llm_generate (ollama/groq), citation_formatter
- Env: QDRANT_URL, QDRANT_API_KEY, preferred LLM provider config
- Tests: `agents/legal-research-agent/tests/integration.test.json`

## Practical notes for this repo
- We already have a `seed-qdrant.js` script that uses the Qdrant REST API. Follow the Node rules above when editing it.
- The `RetrievalService` in `src/services/retrieval.service.ts` should be a thin wrapper around a small `src/lib/qdrant-http.ts` so that both frontend and scripts share the same request shape while keeping secrets in Node.
- Preference: continue using Qdrant Cloud for development (no Docker local dependency). Keep the docker-compose-based local option as a toggle for offline work.

## Example manifest + quick-start for a developer
1. Copy `.env.example` to `.env.local` and fill values (gitignored).
2. Run:

```powershell
npm ci
npm run seed-qdrant
node src/scripts/smoke-test.js
```

3. Start dev server (Angular) and open app. The frontend will call the agent endpoints (ensure backend proxy or CORS configured).

## Appendix: Troubleshooting common issues
- "Node script can't import TypeScript environment": Node cannot import .ts frontend files directly — use `.env` or compile TS first.
- "Qdrant connection refused": confirm QDRANT_URL is correct and API key is present; check cloud panel for allowed IPs.
- "Client library mismatch": prefer REST API calls in short scripts to avoid client SDK version mismatch; centralize the client shape if using an SDK.

## References & further reading
- Keep up with the cloud vendor's agent and security docs when registering agents with a provider. If you register agents with any vendor portal, always follow the portal's required manifest schema and validation rules.
- For large-scale production agents, consider adding a lightweight backend service between the frontend and external tools to centralize security and observability.


---

If you want, I can:
- scaffold `agents/legal-research-agent/manifest.yaml` and a smoke-test script, or
- implement the minimal incremental refactor now (dotenv + seed script + small qdrant-http wrapper), or
- draft a CI job for agent validation (lint + seed + smoke-test).

Which next step do you want me to take?  
