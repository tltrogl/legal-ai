# References — GitHub Copilot Documentation

This file collects the authoritative GitHub documentation pages used when drafting the repository Copilot agent guidance. Use these links to verify any guidance in `.github/copilot-instructions.md`.

1. About GitHub Copilot coding agent — overview, protections, limitations, and guidance
   - URL: https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent
   - Key sections used:
     - Overview of Copilot coding agent (PR workflow, agent capabilities)
     - Built-in security protections (CodeQL scanning, secret scanning, branch restrictions)
     - Risks and mitigations (prompt injection, sensitive data)
     - Limitations (repository scope, branch restrictions, model selection)

2. Best practices for using GitHub Copilot
   - URL: https://docs.github.com/en/copilot/get-started/best-practices
   - Key sections used:
     - "Understand Copilot's strengths and weaknesses"
     - "Create thoughtful prompts"
     - "Check Copilot's work"
     - "Guide Copilot towards helpful outputs"

3. Prompt engineering for GitHub Copilot Chat
   - URL: https://docs.github.com/en/copilot/using-github-copilot/prompt-engineering-for-github-copilot
   - Key sections used:
     - Start general, then get specific
     - Give examples
     - Break complex tasks into simpler tasks
     - Avoid ambiguity / Indicate relevant code

4. Managing policies and features for GitHub Copilot in your organization
   - URL: https://docs.github.com/en/copilot/managing-github-copilot-in-your-organization/managing-policies-and-features-for-copilot-in-your-organization
   - Key sections used:
     - Enabling Copilot features and models in your organization
     - Policy controls / opt-ins and previews

Notes
- The repository guidance (`.github/copilot-instructions.md`) is intended to align with the above official GitHub documentation. Where the repository requires a specific local policy (for example: "Free-first AI providers: Ollama → Groq → ChatGPT-extension"), that is labeled in the instructions as a team policy or project constraint, and not an official GitHub requirement.
- If you want, I can add exact quoted snippets from these pages into the instructions file; let me know and I will include them with clear attribution.

Last updated: 2025-11-10
