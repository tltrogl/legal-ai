# Open Source Resources & Integration Plan

Comprehensive catalog of public repositories and tools we will leverage to accelerate development with a free-first strategy.

## Guiding Principles
- Prefer MIT / Apache / BSD licensed code for direct reuse.
- For AGPL / GPL projects: treat as architectural inspiration or data source, avoid copying server-side code directly to keep license flexibility.
- Keep everything runnable locally, offline where possible (Ollama + embedded or single-binary vector DB).

## Legend
| Tag | Meaning |
|-----|---------|
| ✅ Direct Use | We will adopt code, schema, or binary directly |
| 🔍 Reference | We will study it for patterns / prompts |
| 📥 Data Source | We ingest or query its public data |
| 🧩 Optional | Nice-to-have later |

---
## 1. Legal / Case Management
| Repo | License | Tag | Planned Use |
|------|---------|-----|-------------|
| jhpyle/docassemble | MIT | 🔍 | Guided interview flow patterns → motion template prompt structuring |
| freelawproject/courtlistener | AGPL-3.0 | 📥 | Citations & opinions → future RAG corpus / grounding sources |
| freelawproject/juriscraper | BSD-3-Clause | 📥 | Scrape public court documents to expand dataset (offline preprocessing) |
| KETSE/casebox | AGPL-3.0 | 🔍 | Data model for case→files→tasks mapping; informs future backend schema |
| opencivictech/opencasework | GPL-3.0 | 🔍 | Workflow statuses, assignments, roles reference |
| laws-africa/indigo | MIT | 🔍 | Legal document structural patterns (sections, numbering) for improving motion formatting |

### Immediate Extraction Targets
- Motion structure (intro, factual background, argument, conclusion) → create structured prompt scaffolds.
- Common discovery document categories and metadata fields (from casebox/opencasework) → normalize `DiscoveryDocument` model extension.

---
## 2. UI / Angular Productivity
| Repo | License | Tag | Planned Use |
|------|---------|-----|-------------|
| primefaces/primeng | MIT | ✅ | Prebuilt tables, file upload, tab panels if we outgrow custom markup |
| akveo/ngx-admin | MIT | 🔍 | Layout ideas, theming, auth guard patterns (for future backend) |

---
## 3. Vector Databases / RAG
| Repo | License | Tag | Planned Use |
|------|---------|-----|-------------|
| qdrant/qdrant | Apache-2.0 | ✅ | Primary local vector DB (Docker or single binary) for embeddings (case facts, discovery chunks, motion history) |
| lancedb/lancedb | Apache-2.0 | ✅ | Embedded RAG alternative when we want zero external process (direct Node usage) |
| weaviate/weaviate | BSD-3-Clause | 🧩 | Hybrid search (vector + keyword) if we need advanced filtering |
| milvus-io/milvus | Apache-2.0 | 🧩 | Scalable alternative for large multi-user deployments |
| chroma-core/chroma | Apache-2.0 | 🔍 | Simplicity reference; possible quick prototype for retrieval pipeline |
| pgvector/pgvector | PostgreSQL + extension | 🧩 | Single DB approach once backend with Postgres is introduced |
| asg017/sqlite-vec | Apache-2.0 | 🧩 | Ultra-light desktop/offline distribution embedding store |
| facebookresearch/faiss | MIT | 🔍 | Low-level ANN concepts; possible custom index experimentation |
| nmslib/hnswlib | Apache-2.0 | 🔍 | Underlying algorithm insights for performance tuning |

### Planned RAG Data Objects
| Object | Chunk Strategy | Metadata Fields |
|--------|----------------|-----------------|
| Case Facts | Paragraph / semantic split | caseId, jurisdiction, createdAt |
| Motions | Section-level (argument segments) | caseId, motionType, citedStatutes |
| Discovery Documents | Adaptive: PDF pages, image alt descriptors, transcript segments | caseId, docMime, docType, uploadedAt |
| Research Notes (future) | QA pair / summary segment | caseId, sourceURL, citationList |

---
## 4. AI Orchestration / RAG Frameworks
| Repo | License | Tag | Planned Use |
|------|---------|-----|-------------|
| langchain-ai/langchainjs | MIT | ✅ | Embedding pipeline, retrieval, prompt chaining for motion drafting improvements |
| run-llama/LlamaIndexTS | MIT | 🔍 | Alternative index abstractions; possible doc ingestion flows |

---
## 5. Free Model / Inference Tools
| Tool | License | Tag | Planned Use |
|------|---------|-----|-------------|
| Ollama | Various model licenses | ✅ | Local inference: chat, motion drafting, discovery analysis |
| Groq API | Proprietary (free tier) | ✅ | Fast cloud inference fallback when local resources limited |
| llava (via Ollama) | Apache-2.0 (model specific) | ✅ | Image evidence analysis |
| llama3.x | Meta License (per release) | ✅ | General reasoning + drafting |
| phi3 | MIT | 🧩 | Lightweight fast fallback for low-resource environments |

---
## 6. Browser Extension (ChatGPT Web Bridge)
| Repo | License | Tag | Planned Use |
|------|---------|-----|-------------|
| GoogleChrome/chrome-extensions-samples | Various (mostly MIT) | 🔍 | MV3 messaging reference, content → background routing patterns |

### Planned Extension Modules
| File | Purpose |
|------|---------|
| manifest.json | Declare permissions (activeTab, scripting), content script injection on chat.openai.com |
| background.js (service worker) | Message routing between Angular app (via postMessage/reverse port) and content script |
| content-script.js | DOM interaction: set prompt, submit, scrape response |
| injected.js | Optional: direct access to page’s JS context if needed |
| README.md | Setup, manual load instructions, ToS disclaimer |

---
## 7. Licensing Strategy
- Maintain a `NOTICE` section if we bundle code from MIT/Apache sources.
- Avoid direct code imports from AGPL/GPL unless we accept copyleft obligations (currently we do not). Use their patterns conceptually.
- Attribute sources when prompts or templates are derived from public examples (e.g., docassemble interview flows).

---
## 8. Integration Roadmap (Resources → Features)
| Phase | Resource Used | Feature Delivered |
|-------|---------------|-------------------|
| P0 | Ollama, LangChainJS | Replace Gemini, local chat & motion drafting |
| P1 | Qdrant + Embeddings | Basic retrieval: case facts + prior motions influence responses |
| P2 | courtlistener ingest | Citation grounding for legal research answers |
| P3 | juriscraper ingestion | Automated docket/evidence updates (optional) |
| P4 | Indigo patterns | Rich formatting & section structuring for generated motions |
| P5 | Chrome Extension | Free ChatGPT mode (no API) fallback |
| P6 | LanceDB / pgvector | Simplify deployment or move to unified DB |

---
## 9. Embedding & Retrieval Strategy (Draft)
1. Chunk discovery documents:
   - PDFs: page → sentence groups (max ~512 tokens)
   - Images: llava caption + OCR (future) → semantic chunk
   - Audio/video: transcript segments (60–90 sec blocks)
2. Store vectors (e.g., in Qdrant) with metadata filters: caseId, type, mime, date.
3. Retrieval pipeline:
   - User prompt → embed → similarity search (top-k = 8)
   - Apply heuristic re-rank (prefer same jurisdiction & recent updates)
   - Construct contextual prompt section: "Context Sources:" numbered with short summaries.
4. Generation call via Ollama/Groq → produce answer/motion referencing enumerated sources.

---
## 10. Prompt Template Inspirations
| Source | Adaptation |
|--------|-----------|
| docassemble guided interviews | Convert question flows into a structured checklist for motion factual basis collection |
| Indigo legal doc sections | Map generated motion to: Caption → Introduction → Procedural History → Statement of Facts → Argument → Prayer for Relief |
| CourtListener citation data | Insert inline bracketed placeholders: [Case: Name v. Name, Citation] for later validation |

---
## 11. Risk & Compliance Notes
| Area | Mitigation |
|------|------------|
| AGPL/GPL contamination | Treat those repos as reference only; no direct code copy |
| Data accuracy (citations) | Add citation verification phase (future) comparing extracted citations to CourtListener dataset |
| Privacy (client data) | Encourage Ollama local-only mode for sensitive work; optional toggle to disable cloud providers entirely |
| Extension ToS risk | Mark ChatGPT extension mode clearly “experimental; may violate automated use restrictions” |

---
## 12. Next Immediate Actions
1. Wire components to `AIProviderService` (replace Gemini).
2. Add minimal Qdrant setup script (optional next commit).
3. Scaffold Chrome extension folder.
4. Implement basic retrieval (LangChainJS + Qdrant) after wiring.

---
**Last Updated:** November 10, 2025
