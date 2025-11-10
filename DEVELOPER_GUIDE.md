# Developer Quick Reference Guide

## Project Setup

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- Git

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd legal-ai

# Install dependencies
npm install

# Create environment file
# Note: .env.local not included - see setup instructions below
echo "API_KEY=your-gemini-api-key-here" > .env.local

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Build for production (currently has issues - see below)
npm run preview  # Preview production build
```

### Known Build Issue
**Problem:** Build fails with TypeScript error on PDF.js CDN import  
**Location:** `src/components/case-management/case-management.component.ts:283`  
**Workaround:** Runtime import works, but TypeScript compilation fails  
**Fix:** Install `pdfjs-dist` as npm dependency instead of CDN import

## Project Structure Quick Map

```
legal-ai/
├── src/
│   ├── app.component.ts/html        # Main app shell
│   ├── components/
│   │   ├── home/                    # Dashboard
│   │   ├── case-chat/               # AI chat interface
│   │   ├── evidence-analyzer/       # Media analysis
│   │   ├── legal-research/          # Research tool
│   │   └── case-management/         # Case CRUD + motions + discovery
│   ├── models/
│   │   ├── case-file.model.ts       # Data structures
│   │   └── chat.model.ts
│   └── services/
│       ├── gemini.service.ts        # AI integration
│       ├── case-file.service.ts     # Data persistence
│       └── navigation.service.ts    # Component communication
├── index.tsx                         # Bootstrap file
├── index.html                        # HTML shell
├── package.json
├── tsconfig.json
└── angular.json
```

## Component Responsibilities

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **HomeComponent** | Dashboard | Case list, quick actions |
| **CaseChatComponent** | AI Chat | Conversation history, deep/standard mode |
| **EvidenceAnalyzerComponent** | Media Analysis | Upload/record, image/video/audio support |
| **LegalResearchComponent** | Research | Grounded search, document context |
| **CaseManagementComponent** | Case Management | CRUD, motions, discovery |

## Service Quick Reference

### GeminiService API

```typescript
// Chat with conversation history
await geminiService.generateChatResponse(
  history: ChatMessage[],
  newMessage: string,
  deepAnalysis: boolean  // true = Pro, false = Flash
)

// Analyze standalone media
await geminiService.analyzeMedia(
  prompt: string,
  fileBase64: string,
  mimeType: string
)

// Analyze discovery with case context
await geminiService.analyzeDiscoveryEvidence(
  caseFile: CaseFile,
  document: DiscoveryDocument,
  prompt: string
)

// Legal research (grounded or document-based)
await geminiService.performLegalResearch(
  query: string,
  documentContext?: string  // undefined = grounded search
)

// Generate legal documents
await geminiService.generateLegalDocument(
  caseFile: CaseFile,
  motionType: string,
  factualBasis: string
)
```

### CaseFileService API

```typescript
// Read operations
const cases = caseFileService.getCaseFiles();
const case = caseFileService.getCaseFile(id);

// Create
const newCase = caseFileService.saveNewCase({
  name: string,
  jurisdiction: 'federal' | 'florida',
  caseFacts: string
});

// Update
const updated = caseFileService.updateCaseFile(modifiedCase);

// Delete
caseFileService.deleteCaseFile(id);

// Import/Export
caseFileService.importCaseFile(caseFileJson);
```

## Data Models

### CaseFile
```typescript
interface CaseFile {
  id: string;
  name: string;
  jurisdiction: 'federal' | 'florida';
  caseFacts: string;
  motions: Motion[];
  discoveryDocuments: DiscoveryDocument[];
  createdAt: string;
  updatedAt: string;
}
```

### Motion
```typescript
interface Motion {
  id: string;
  type: string;
  factualBasis: string;
  generatedText: string;
  createdAt: string;
}
```

### DiscoveryDocument
```typescript
interface DiscoveryDocument {
  id: string;
  name: string;
  content: string;  // Base64 for media, text for text/PDF
  mimeType: string;
  analyses: DiscoveryAnalysis[];
}
```

## Angular Patterns Used

### Signals (State Management)
```typescript
// Primitive signal
const count = signal(0);
count.set(1);           // Set new value
count.update(n => n + 1); // Update based on current

// Computed signal (derived state)
const doubled = computed(() => count() * 2);

// Effect (side effects)
effect(() => {
  console.log('Count changed:', count());
});
```

### Component Setup
```typescript
@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,  // Performance
  imports: [CommonModule, FormsModule],              // Standalone
})
export class ExampleComponent {
  private service = inject(MyService);  // Inject dependencies
  
  mySignal = signal<string>('initial');
  
  async doSomething() {
    this.loading.set(true);
    try {
      const result = await this.service.fetch();
      this.mySignal.set(result);
    } catch (e) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }
}
```

### Template Syntax
```html
<!-- New control flow syntax -->
@if (loading()) {
  <div>Loading...</div>
}

@switch (mode()) {
  @case ('upload') {
    <app-upload />
  }
  @case ('record') {
    <app-record />
  }
}

<!-- Signals in templates (note the parentheses) -->
<div>{{ mySignal() }}</div>

<!-- Event binding -->
<button (click)="doSomething()">Click</button>

<!-- Two-way binding -->
<input [(ngModel)]="value" />
```

## Common Development Tasks

### Adding a New Component

```bash
# Generate component (if Angular CLI is globally installed)
ng generate component components/my-feature

# Or create manually:
# 1. Create directory: src/components/my-feature/
# 2. Create my-feature.component.ts
# 3. Create my-feature.component.html
# 4. Import in app.component.ts
```

### Adding a New Service

```bash
# Generate service
ng generate service services/my-service

# Or create manually:
# 1. Create src/services/my-service.ts
# 2. Add @Injectable({ providedIn: 'root' })
# 3. Inject where needed with inject(MyService)
```

### Adding a New Gemini Model Call

```typescript
// In gemini.service.ts
async myNewMethod(params: any): Promise<GenerateContentResponse> {
  const model = 'gemini-2.5-pro'; // or 'gemini-2.5-flash'
  
  return this.ai.models.generateContent({
    model,
    contents: 'your prompt',
    config: {
      systemInstruction: 'optional system instruction',
      thinkingConfig: { thinkingBudget: 32768 } // optional
    }
  });
}
```

### Working with LocalStorage

```typescript
// Read
const data = localStorage.getItem('key');
const parsed = data ? JSON.parse(data) : null;

// Write
localStorage.setItem('key', JSON.stringify(data));

// Delete
localStorage.removeItem('key');

// Clear all
localStorage.clear();
```

## Debugging Tips

### Angular DevTools
Install Angular DevTools browser extension for:
- Component tree inspection
- Change detection profiling
- Dependency injection tree
- Signal value inspection

### Console Debugging
```typescript
// Signal values
console.log('Current value:', mySignal());

// Effect for tracking signal changes
effect(() => {
  console.log('Signal changed:', mySignal());
});

// Gemini API responses
console.log('API response:', response);
console.log('Usage metadata:', response.usageMetadata);
```

### Common Issues

**Issue:** Signal not updating in template  
**Solution:** Make sure you're calling it with parentheses: `{{ mySignal() }}`

**Issue:** Gemini API returns error  
**Solution:** Check API key, network connectivity, and API quota

**Issue:** LocalStorage quota exceeded  
**Solution:** Reduce stored data, especially base64 media files

**Issue:** PDF.js fails to load  
**Solution:** Check network connectivity, CDN availability

## Model Selection Guide

| Task | Model | Thinking Budget | Why |
|------|-------|----------------|-----|
| Quick chat | gemini-2.5-flash | 0 | Speed |
| Complex legal question | gemini-2.5-pro | 32768 | Quality |
| Image analysis | gemini-2.5-flash | - | Cost/Speed |
| Video analysis | gemini-2.5-pro | - | Quality needed |
| Audio transcription | gemini-2.5-flash | - | Sufficient |
| Document generation | gemini-2.5-pro | 32768 | Legal accuracy |
| Discovery analysis | gemini-2.5-pro | 32768 | Context importance |
| Web research | gemini-2.5-flash | - | With Google Search |
| Document research | gemini-2.5-pro | 32768 | Deep understanding |

## API Key Management

### Environment Variables
```bash
# .env.local (not committed to git)
API_KEY=your-actual-api-key

# Access in code
process.env.API_KEY
```

### Security Warning
⚠️ **Current implementation exposes API key in client code**  
- API key is visible in browser
- Anyone can extract and use it
- **Do not use personal API keys**
- **Do not deploy to production without backend proxy**

## Testing (Not Currently Implemented)

### Recommended Test Structure
```typescript
// example.component.spec.ts
describe('ExampleComponent', () => {
  let component: ExampleComponent;
  let mockService: jasmine.SpyObj<MyService>;
  
  beforeEach(() => {
    mockService = jasmine.createSpyObj('MyService', ['fetch']);
    component = new ExampleComponent(mockService);
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should handle fetch success', async () => {
    mockService.fetch.and.returnValue(Promise.resolve('data'));
    await component.doSomething();
    expect(component.mySignal()).toBe('data');
  });
});
```

## Performance Tips

### Change Detection
- All components use `OnPush` - only check when inputs change or signals update
- Use signals instead of direct property mutations
- Avoid expensive computations in templates

### Bundle Size
- Use lazy loading for components (not implemented)
- Tree-shaking is enabled by default
- Avoid importing entire libraries when only parts are needed

### API Efficiency
- Use Flash model when Pro isn't necessary
- Batch operations when possible
- Cache results when appropriate
- Set thinking budget to 0 for simple tasks

## Useful Resources

### Documentation Links
- [Angular Documentation](https://angular.dev)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

### Local Endpoints
- Dev Server: `http://localhost:3000`
- API (if backend added): `http://localhost:3001` (suggested)

## Troubleshooting

### "Cannot find module '@angular/...'"
```bash
npm install
```

### "API_KEY environment variable not set"
```bash
# Create .env.local file with your API key
echo "API_KEY=your-key" > .env.local
```

### "Failed to compile"
- Check TypeScript errors in terminal
- Ensure all imports are correct
- Verify file paths

### "Quota exceeded" (LocalStorage)
- Clear browser data
- Reduce case file sizes
- Use external storage for large media

### Build fails with PDF.js error
- Known issue - see "Known Build Issue" section above
- Runtime works, but TypeScript compilation fails

## Git Workflow

### Branch Strategy
```bash
# Feature branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "feat: description"

# Push
git push origin feature/my-feature

# Create PR on GitHub
```

### Commit Message Format
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Code style changes
refactor: Code refactoring
test: Add tests
chore: Maintenance tasks
```

## Environment Setup Checklist

- [ ] Node.js installed
- [ ] npm dependencies installed (`npm install`)
- [ ] `.env.local` created with API key
- [ ] Dev server starts (`npm run dev`)
- [ ] Browser opens to `http://localhost:3000`
- [ ] Can create a test case
- [ ] Chat component works
- [ ] Evidence analyzer works
- [ ] No console errors (check browser DevTools)

## Quick Command Reference

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build (has issues)
npm run preview            # Preview build

# Package Management
npm install                # Install dependencies
npm update                 # Update dependencies
npm outdated              # Check for updates

# Git
git status                 # Check status
git add .                  # Stage all changes
git commit -m "message"    # Commit
git push                   # Push to remote
git pull                   # Pull from remote

# Debugging
npm list                   # List installed packages
node --version            # Check Node version
npm --version             # Check npm version
```

---

**Last Updated:** November 10, 2025  
**Maintained By:** Development Team
