# Lexi AI: Legal Aid Assistant

An AI-powered legal aid application to assist with case analysis, evidence review, and legal research. Built with Angular 20 and Google Gemini AI, this application helps legal professionals analyze documents, images, audio, and video evidence while providing grounded legal insights.

## Features

- **Case Management** - Create and manage case files with comprehensive case information
- **AI Chat Assistant** - Interactive legal consultation with deep analysis mode using Gemini AI
- **Evidence Analyzer** - Analyze multimedia evidence including:
  - Images (visual analysis, tampering detection)
  - Video (event extraction, transcription)
  - Audio (transcription, speaker identification)
  - Live audio recording and analysis
- **Legal Research** - Grounded research with Google Search integration and document context analysis
- **Motion Generation** - AI-powered legal document generation with jurisdiction-specific citations
- **Discovery Management** - Upload and analyze discovery documents with full case context

## Technology Stack

- **Frontend:** Angular 20 (standalone components, signals, zoneless change detection)
- **AI/ML:** Multiple FREE options available:
  - **Ollama** - Run AI models locally (100% free, private)
  - **Groq API** - Fast free API tier with open-source models
  - Google Gemini AI (optional, paid)
- **Styling:** TailwindCSS
- **Language:** TypeScript 5.8
- **Build Tool:** Angular CLI + Vite
- **Storage:** Browser LocalStorage

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- **AI Provider** (choose ONE free option):
  - 🌟 **Ollama** (100% free, runs locally) - RECOMMENDED
  - ⚡ **Groq API** (free tier, cloud-based)
  - 🔄 **ChatGPT Extension** (coming soon)
  - 💎 **Google Gemini API** (paid, optional)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tltrogl/legal-ai.git
   cd legal-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. **Set up a FREE AI provider** (choose one):

   ### Option 1: Ollama (100% Free, Local) - RECOMMENDED
   ```bash
   # Install Ollama from https://ollama.ai
   # Then pull a model:
   ollama pull llama3.1:8b
   ```
   
   ### Option 2: Groq API (Free Tier)
   ```bash
   # Get free API key from https://console.groq.com
   # Add to .env.local:
   echo "GROQ_API_KEY=your-groq-api-key" > .env.local
   ```
   
   ### Option 3: Gemini API (Paid)
   ```bash
   # Only if you want to use paid Gemini API:
   echo "API_KEY=your-gemini-api-key-here" > .env.local
   ```

   **📖 Full setup guide:** See [FREE_AI_SETUP.md](FREE_AI_SETUP.md) for detailed instructions

## Usage

### Development Server

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

Build the application:
```bash
npm run build
```

Note: There is currently a known build issue with PDF.js imports. See [Project Analysis](PROJECT_ANALYSIS.md) for details.

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

## Project Structure

```
legal-ai/
├── src/
│   ├── components/        # Angular components
│   │   ├── home/          # Dashboard
│   │   ├── case-chat/     # AI chat interface
│   │   ├── evidence-analyzer/  # Evidence analysis
│   │   ├── legal-research/     # Research tool
│   │   └── case-management/    # Case management
│   ├── services/          # Business logic services
│   ├── models/            # TypeScript interfaces
│   └── app.component.ts   # Root component
├── index.tsx              # Application bootstrap
├── package.json
└── angular.json
```

## Documentation

- [Analysis Summary](ANALYSIS_SUMMARY.md) - Executive overview and key findings
- [Project Analysis](PROJECT_ANALYSIS.md) - Comprehensive technical analysis
- [Architecture Guide](ARCHITECTURE.md) - System architecture and design patterns
- [Developer Guide](DEVELOPER_GUIDE.md) - Development setup and reference
 - [FREE AI Setup](FREE_AI_SETUP.md) - Run entirely free with Ollama/Groq
 - [Free AI Implementation Overview](FREE_AI_IMPLEMENTATION.md) - What was added and how it works
 - [Resources](RESOURCES.md) - Curated repos and how we’ll use them

## Open-source resources we will leverage (free-first)

To move fast without paid APIs, we will reuse proven open-source projects. Here is what we’ll use and how it fits into this app:

### Legal / Case Management
- docassemble/docassemble (MIT)
  - Use for: Motion templates and guided intake flows we can adapt into prompts/templates for motion generation.
  - Repo: https://github.com/jhpyle/docassemble
- Free Law Project: courtlistener (AGPL-3.0)
  - Use for: Public court opinions and citations as grounding sources for research (optional ingestion into RAG store).
  - Repo: https://github.com/freelawproject/courtlistener
- Free Law Project: juriscraper (BSD-3-Clause)
  - Use for: If we ingest public decisions/dockets into our local vector DB later.
  - Repo: https://github.com/freelawproject/juriscraper
- casebox/casebox (AGPL-3.0)
  - Use for: Reference data model and UI patterns for case → discovery → motions.
  - Repo: https://github.com/KETSE/casebox
- opencasework/opencasework (GPL-3.0)
  - Use for: Status pipelines, assignments, and role patterns we can mirror.
  - Repo: https://github.com/opencivictech/opencasework
- laws-africa/indigo (MIT)
  - Use for: Legal document structure/citation modeling ideas for motion outputs.
  - Repo: https://github.com/laws-africa/indigo

### Vector DB / RAG (local, free)
- Qdrant (Apache-2.0)
  - Use for: Local vector DB via a single binary/Docker; store embeddings for case facts, discovery, and prior motions.
  - Repo: https://github.com/qdrant/qdrant
- LanceDB (Apache-2.0)
  - Use for: Embedded vector DB in Node/TS (no server) for ultra-simple local RAG.
  - Repo: https://github.com/lancedb/lancedb
- Weaviate (BSD-3-Clause) / Milvus (Apache-2.0) / Chroma (Apache-2.0)
  - Use for: Alternatives if we prefer GraphQL/scale/simplicity trade-offs.
  - Repos: https://github.com/weaviate/weaviate • https://github.com/milvus-io/milvus • https://github.com/chroma-core/chroma
- pgvector (Postgres extension)
  - Use for: One-DB solution later if we add a backend with Postgres.
  - Repo: https://github.com/pgvector/pgvector
- Tooling: LangChainJS, LlamaIndexTS (MIT)
  - Use for: Quickly wiring chunking, embeddings, retrieval steps in TypeScript.
  - Repos: https://github.com/langchain-ai/langchainjs • https://github.com/run-llama/LlamaIndexTS

### ChatGPT browser extension path (free with account)
- Chrome extensions samples (MIT)
  - Use for: MV3 scaffolding, content/background messaging patterns to automate ChatGPT web.
  - Repo: https://github.com/GoogleChrome/chrome-extensions-samples

Notes on licenses: Please review licenses before shipping derivative features. For AGPL/GPL projects, prefer using them for ideas/data access, not code-copying into this repo. MIT/Apache/BSD projects are generally safe to reuse with attribution.

## Supported Jurisdictions

- Federal criminal defense cases
- Florida state criminal defense cases

## 💰 Zero-Cost AI Options

**You don't need to pay for APIs!** This application now supports completely free AI providers:

1. **Ollama (Local)** - Run AI models on your computer (100% free, private, offline)
2. **Groq API** - Fast free cloud API with generous rate limits
3. **ChatGPT Extension** - Use free ChatGPT web interface (coming soon)

**See [FREE_AI_SETUP.md](FREE_AI_SETUP.md) for complete setup instructions.**

## Security Notes

⚠️ **Important Security Information:**

**For Free Providers (Ollama):**
- ✅ Data stays on your computer (100% private)
- ✅ No API key needed
- ✅ Recommended for confidential cases

**For Cloud Providers (Groq):**
- ⚠️ Data is sent to provider's servers
- ⚠️ Store API keys in `.env.local` (not committed to git)
- ⚠️ Don't use for highly sensitive cases without client consent

**Before Production Deployment:**
- Implement user authentication and authorization
- Add data encryption for sensitive case information
- Implement proper security headers and input sanitization
- Use backend service for API key management (if using cloud providers)

## Contributing

Contributions are welcome! Please review the following before contributing:

1. Check the [Developer Guide](DEVELOPER_GUIDE.md) for setup instructions
2. Review the [Architecture Guide](ARCHITECTURE.md) for technical patterns
3. See [Project Analysis](PROJECT_ANALYSIS.md) for known issues

## License

[Add your license information here]

## Acknowledgments

- Built with [Angular](https://angular.dev)
- FREE AI Options:
  - [Ollama](https://ollama.ai) - Local AI models
  - [Groq](https://groq.com) - Fast free API
- Optional: [Google Gemini AI](https://ai.google.dev)
- Styled with [TailwindCSS](https://tailwindcss.com)

## Contact

For questions or feedback, please open an issue on GitHub.

---

**AI Studio App:** View this app in [AI Studio](https://ai.studio/apps/drive/1f3CgIvHhzbZ5QiLKFKT9Ai5o5UKaawsA)
