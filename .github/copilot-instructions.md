# Copilot Coding Agent Instructions for this Repository

These instructions help any Copilot coding agent (and humans) work effectively in this codebase. They encode our stack, constraints, commands, quality gates, and security rules so the agent can implement tasks end-to-end with minimal back-and-forth.

## Project Snapshot

- Name: Lexi AI — Legal Aid Assistant
- Framework: Angular 20 (standalone components, signals, zoneless)
- Language: TypeScript 5.8
- Build: Angular CLI + Vite
- Styling: TailwindCSS
- Storage: Browser LocalStorage
- AI Providers (free-first):
  1) Ollama (local, private, 100% free) — preferred default
  2) Groq API (free tier)
  3) ChatGPT web via extension bridge (experimental)

Key entry points:
- App root: `src/app.component.ts`, `src/app.component.html`
- Components: `src/components/**`
- Services: `src/services/**`
- Models: `src/models/**`

## Run, Build, and Check (PowerShell)

- Dev server:
  ```powershell
  npm run dev
  ```
- Production build:
  ```powershell
  npm run build
  ```
- Preview prod config (served):
  ```powershell
  npm run preview
  ```
- Type-check only (no emit):
  ```powershell
  npx tsc -p tsconfig.json --noEmit
  ```

Notes:
- Angular CLI is listed in deps; `ng` is available through npm scripts. Prefer npm scripts shown above.
- If you add new dependencies, prefer small, permissively licensed packages.

## AI Provider Policy (Free-first)

- Default to free providers: Ollama → Groq → ChatGPT Extension.
- Do NOT introduce paid OpenAI/Gemini APIs as required paths.
- Secrets management:
  - Never commit keys. If needed for local dev, use `.env.local` (ignored) and read at runtime without bundling.
  - Avoid server calls for keys; this is a frontend app.
- Data sensitivity:
  - For private or sensitive inputs, prefer Ollama (local, offline possible).
  - Groq is acceptable for general research; warn in docs if sensitive.
  - ChatGPT extension use is experimental and subject to OpenAI’s ToS.

## Extension Bridge (ChatGPT)

- Location: `extension/` (MV3 manifest, background, content script, README)
- Messaging:
  - App → Page: `LEXI_EXTENSION_SEND_PROMPT`, `LEXI_EXTENSION_PING`
  - Page → App: `LEXI_EXTENSION_READY`, `LEXI_EXTENSION_PONG`, `LEXI_EXTENSION_RESPONSE_CHUNK`, `LEXI_EXTENSION_ERROR`
- Use origin checks when possible; current draft uses `*` and should be hardened.

## Coding Conventions

- Angular 20, standalone components (no NgModules). Keep components small and focused.
- Reuse `AIProviderService` wrappers from `src/services/ai-provider.service.ts`. Do not call provider SDKs directly from components.
- Prefer strongly typed models in `src/models/*`.
- Keep public APIs stable; avoid breaking component/service method signatures without updating all usages.
- Error handling: surface helpful messages to the UI; for provider selection, attempt `ensureProviderInitialized()` patterns already used in components.

## Quality Gates (Required before PR)

- Build: PASS (`npm run build`)
- Typecheck: PASS (`npx tsc -p tsconfig.json --noEmit`)
- Lint: Not configured yet; if you add ESLint, include script and pass it.
- Tests: None yet; if you add tests, include a script and run them.

Report results in PR description as:
- Build: PASS/FAIL
- Typecheck: PASS/FAIL
- Tests: PASS/FAIL (N/A if none)

## Security & Privacy Rules

- Never commit secrets or personal data.
- Do not exfiltrate or log sensitive case contents to third-party services.
- When using Groq or ChatGPT web, include a warning in user-facing docs if dealing with sensitive data.
- Review licenses before copying external code; prefer MIT/Apache/BSD. Avoid copying AGPL/GPL code into the repo.

## Documentation Expectations

- Update `README.md` and `FREE_AI_SETUP.md` when adding or changing provider behavior.
- For new features, add a short section to `DEVELOPER_GUIDE.md` or a new focused doc.
- If you add a notable integration, link it from `RESOURCES.md` when relevant.

## Typical Tasks and Patterns

- Add a new provider:
  - Implement `AIProvider` in `src/services/your-provider.service.ts`.
  - Register in `AIProviderService` initialization and selection logic.
  - Update AI Settings UI to allow selection/configuration.
  - Add docs to README and FREE_AI_SETUP.md.

- Wire a new settings page or tab:
  - Add a standalone component under `src/components/<feature>/`.
  - Add route or menu entry in `app.component.html`.
  - Keep state in a service if shared.

- Add RAG later:
  - Prefer local/vector DBs (Qdrant/LanceDB) and client-side embeddings when feasible.
  - Keep privacy guarantees clear in docs.

## Pull Request Guidelines

- Small, cohesive commits with clear messages (imperative style: "Add X", "Fix Y").
- PR description should include:
  - What changed and why
  - Any new env/config needs
  - Quality gate results
  - Screenshots/GIFs for UI
- Link to issues or tasks.

## Issue Template for Copilot Agent

Use the provided template: `.github/ISSUE_TEMPLATE/copilot-task.md`.
Include acceptance criteria and constraints. For automation, include the trigger tag below.

Trigger tag to request the Copilot coding agent asynchronously:
Include the official Copilot coding agent trigger phrase (the special hashtag documented by GitHub) in an issue or chat request to hand off work to the asynchronous coding agent. Do not place the trigger phrase in source files or configuration.

## When to Ask vs. Act

- Ask clarifying questions only if blocked or risk of rework is high.
- Otherwise, make 1–2 reasonable assumptions (document them in PR) and proceed.

## Known Gaps

- Linting/tests are not yet set up. If you add them, update this file and the PR template.
- ChatGPT extension origin filtering and streaming parsing can be improved.

## Sources and alignment with GitHub documentation

- This guidance was written to align with GitHub's official Copilot documentation. See `../REFERENCES.md` at the repository root for the authoritative links used (Copilot coding agent, best practices, prompt engineering, and managing organization policies).
- Where this repository includes a "Team policy" or project-specific constraint (for example, the "free-first" AI provider ordering), that is an explicit project preference and not a GitHub requirement. Team policies are labeled as such in this document.


---
Last updated: 2025-11-10