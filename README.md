<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Lexi AI: Legal Aid Assistant

An AI-powered legal aid application built with Angular 20 and Google Gemini AI to assist with case analysis, evidence review, and legal research.

View your app in AI Studio: https://ai.studio/apps/drive/1f3CgIvHhzbZ5QiLKFKT9Ai5o5UKaawsA

## 📚 Documentation

- **[Analysis Summary](ANALYSIS_SUMMARY.md)** - Executive summary with key findings and recommendations
- **[Project Analysis](PROJECT_ANALYSIS.md)** - Comprehensive analysis of features, architecture, and issues
- **[Architecture Guide](ARCHITECTURE.md)** - Technical documentation with diagrams and patterns
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Quick reference for development setup and common tasks

## ⚠️ Important Notes

**Build Issue:** Currently the production build fails due to a TypeScript error with the PDF.js CDN import. See [Project Analysis](PROJECT_ANALYSIS.md#weaknesses-and-issues) for details.

**Security Warning:** The API key is exposed in client-side code. Do not deploy to production without implementing a backend API proxy. See [Architecture Guide](ARCHITECTURE.md#security-architecture) for recommended architecture.

## 🚀 Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in `.env.local`:
   ```bash
   echo "API_KEY=your-gemini-api-key-here" > .env.local
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

## ✨ Features

- **Case Chat** - Interactive AI legal consultation with deep analysis mode
- **Evidence Analyzer** - Analyze images, video, and audio evidence
- **Legal Research** - Grounded research with citations and document context
- **Case Management** - Complete case file management with motion generation and discovery analysis
- **Multi-jurisdictional** - Support for Federal and Florida criminal defense cases

## 🛠️ Technology Stack

- Angular 20 with Signals
- Google Gemini AI (Pro & Flash models)
- TailwindCSS
- TypeScript 5.8
- LocalStorage for data persistence

## 📋 Project Status

**Status:** 🟡 Proof of Concept - Not Production Ready

**Key Issues:**
- Build failure (PDF.js import)
- API key security vulnerability
- No authentication system
- No testing infrastructure

See [Analysis Summary](ANALYSIS_SUMMARY.md) for complete assessment and recommendations.

## 🤝 Contributing

Before contributing, please review:
1. [Developer Guide](DEVELOPER_GUIDE.md) for setup and conventions
2. [Architecture Guide](ARCHITECTURE.md) for technical patterns
3. [Project Analysis](PROJECT_ANALYSIS.md) for known issues and improvement areas

## 📄 License

[Add your license here]
