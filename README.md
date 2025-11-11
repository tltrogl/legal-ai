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
- **AI/ML:** Google Gemini AI (2.5 Pro and Flash models)
- **Styling:** TailwindCSS
- **Language:** TypeScript 5.8
- **Build Tool:** Angular CLI + Vite
- **Storage:** Browser LocalStorage

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Google Gemini API key

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

3. Create a `.env.local` file in the root directory and add your Gemini API key:
   ```bash
   echo "API_KEY=your-gemini-api-key-here" > .env.local
   ```

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

## Supported Jurisdictions

- Federal criminal defense cases
- Florida state criminal defense cases

## Security Notes

⚠️ **Warning:** This is a proof-of-concept application. Before deploying to production:
- Move API key to a backend service (currently exposed in client code)
- Implement user authentication and authorization
- Add data encryption for sensitive case information
- Implement proper security headers and input sanitization

## Contributing

Contributions are welcome! Please review the following before contributing:

1. Check the [Developer Guide](DEVELOPER_GUIDE.md) for setup instructions
2. Review the [Architecture Guide](ARCHITECTURE.md) for technical patterns
3. See [Project Analysis](PROJECT_ANALYSIS.md) for known issues

## License

[Add your license information here]

## Acknowledgments

- Built with [Angular](https://angular.dev)
- Powered by [Google Gemini AI](https://ai.google.dev)
- Styled with [TailwindCSS](https://tailwindcss.com)

## Contact

For questions or feedback, please open an issue on GitHub.

---

**AI Studio App:** View this app in [AI Studio](https://ai.studio/apps/drive/1f3CgIvHhzbZ5QiLKFKT9Ai5o5UKaawsA)
