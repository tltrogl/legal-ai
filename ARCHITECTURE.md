# Lexi AI - Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client-Side)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Angular Application (SPA)                 │  │
│  │                                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │   App Shell  │  │  Components  │  │  Services   │ │  │
│  │  │  (Routing)   │  │   (Views)    │  │  (Logic)    │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │           Gemini Service (AI Layer)               │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                          ↓                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                             ↓                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            LocalStorage (Data Persistence)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────┬───────────────────────────────┘
                                ↓
                    ┌───────────────────────┐
                    │    Gemini API         │
                    │   (Google Cloud)      │
                    └───────────────────────┘
```

## Component Architecture

### Application Layer (app.component.ts)
**Responsibility:** Root component, navigation shell

```typescript
AppComponent
├── Header (Branding + Tab Navigation)
├── Main Content Area
│   └── Dynamic Component (based on activeTab)
│       ├── HomeComponent
│       ├── CaseChatComponent
│       ├── EvidenceAnalyzerComponent
│       ├── LegalResearchComponent
│       └── CaseManagementComponent
└── State Management (activeTab signal)
```

**Key Features:**
- Tab-based routing without Angular Router
- Signal-based reactive navigation
- Effect-based deep linking from NavigationService

### Component Hierarchy

```
AppComponent (Root)
│
├─── HomeComponent
│    ├─ Dashboard View
│    ├─ Recent Cases List
│    └─ Quick Action Cards
│
├─── CaseChatComponent
│    ├─ Chat History Display
│    ├─ Message Input
│    └─ Mode Toggle (Deep/Standard)
│
├─── EvidenceAnalyzerComponent
│    ├─ Mode Selection (Upload/Record)
│    ├─ File Upload/Recording UI
│    ├─ Analysis Form
│    └─ Results Display
│
├─── LegalResearchComponent
│    ├─ Research History
│    ├─ Document Upload (optional)
│    ├─ Query Input
│    └─ Results with Citations
│
└─── CaseManagementComponent (Most Complex)
     ├─ Dashboard View
     │   ├─ Case List
     │   ├─ New Case Form
     │   └─ Import/Export Actions
     │
     └─ Workspace View
         ├─ Case Info Header
         ├─ Tab Navigation (Motions/Discovery)
         │
         ├─ Motions Tab
         │   ├─ Motion List
         │   ├─ Motion Generator Form
         │   └─ Motion Viewer
         │
         └─ Discovery Tab
             ├─ Document List
             ├─ Document Upload
             ├─ Document Viewer
             ├─ Analysis Form
             └─ Analysis History
```

## Service Layer

### GeminiService
**Purpose:** Centralized AI integration and model orchestration

**Methods:**
```typescript
class GeminiService {
  // Chat functionality
  generateChatResponse(
    history: ChatMessage[], 
    newMessage: string, 
    deepAnalysis: boolean
  ): Promise<GenerateContentResponse>
  
  // Evidence analysis
  analyzeMedia(
    prompt: string, 
    fileBase64: string, 
    mimeType: string
  ): Promise<GenerateContentResponse>
  
  // Discovery document analysis with case context
  analyzeDiscoveryEvidence(
    caseFile: CaseFile,
    documentToAnalyze: DiscoveryDocument,
    prompt: string
  ): Promise<GenerateContentResponse>
  
  // Legal research with optional document context
  performLegalResearch(
    query: string, 
    documentContext?: string
  ): Promise<GenerateContentResponse>
  
  // Legal document generation
  generateLegalDocument(
    caseFile: CaseFile,
    motionType: string,
    factualBasis: string
  ): Promise<GenerateContentResponse>
}
```

**Model Selection Logic:**
```typescript
Task Type                    → Model Selection
─────────────────────────────────────────────
Chat (Deep Analysis)         → gemini-2.5-pro (thinking: 32768)
Chat (Standard)              → gemini-2.5-flash (thinking: 0)
Video Analysis               → gemini-2.5-pro
Image/Audio Analysis         → gemini-2.5-flash
Discovery (Text/PDF)         → gemini-2.5-pro (thinking: 32768)
Discovery (Image/Video)      → gemini-2.5-pro/flash (by type)
Research (No Document)       → gemini-2.5-flash + Google Search
Research (With Document)     → gemini-2.5-pro (thinking: 32768)
Legal Document Generation    → gemini-2.5-pro (thinking: 32768)
```

### CaseFileService
**Purpose:** CRUD operations for case files with LocalStorage

**Methods:**
```typescript
class CaseFileService {
  getCaseFiles(): CaseFile[]
  getCaseFile(id: string): CaseFile | undefined
  saveNewCase(caseData): CaseFile
  updateCaseFile(updatedFile: CaseFile): CaseFile
  deleteCaseFile(id: string): void
  importCaseFile(caseFile: CaseFile): void
  
  private saveAllFiles(files: CaseFile[]): void
}
```

**Storage Strategy:**
- Key: `'lexi-ai-case-files'`
- Format: JSON array
- Sorting: By `updatedAt` (descending)
- Error Handling: Try-catch with console logging

### NavigationService
**Purpose:** Cross-component communication for deep linking

**Structure:**
```typescript
class NavigationService {
  caseToLoad = signal<string | null>(null);
}
```

**Usage Pattern:**
```
HomeComponent → Set caseToLoad signal
     ↓
AppComponent → Effect detects signal
     ↓
AppComponent → Switch to 'management' tab
     ↓
CaseManagementComponent → Effect detects signal
     ↓
CaseManagementComponent → Load specified case
```

## Data Flow Patterns

### Case Management Flow
```
1. User Creates Case
   ↓
2. CaseManagementComponent.createCase()
   ↓
3. CaseFileService.saveNewCase()
   ↓
4. LocalStorage.setItem()
   ↓
5. Component State Updated (signal)
   ↓
6. UI Re-renders (OnPush + Signals)
```

### Motion Generation Flow
```
1. User Inputs Motion Details
   ↓
2. CaseManagementComponent.generateMotion()
   ↓
3. GeminiService.generateLegalDocument()
   ├─ Constructs system instruction
   ├─ Builds full case context
   └─ Calls Gemini API (gemini-2.5-pro)
   ↓
4. Response Received
   ↓
5. Motion Added to Case
   ↓
6. CaseFileService.updateCaseFile()
   ↓
7. LocalStorage Updated
   ↓
8. UI Updated with New Motion
```

### Discovery Analysis Flow
```
1. User Uploads Document
   ↓
2. File Processing
   ├─ Image/Video → Base64 encoding
   ├─ PDF → PDF.js text extraction
   └─ Text → Direct read
   ↓
3. Document Stored in Case
   ↓
4. User Requests Analysis
   ↓
5. GeminiService.analyzeDiscoveryEvidence()
   ├─ Builds case context
   ├─ Includes other documents
   ├─ Adds motion history
   └─ Calls appropriate model
   ↓
6. Analysis Result Stored
   ↓
7. Case Updated in LocalStorage
```

## State Management Strategy

### Signal-Based Reactivity
**Why Signals over RxJS:**
- Fine-grained reactivity
- Automatic dependency tracking
- Better performance (no zone.js needed)
- Simpler mental model for component state

**Signal Types Used:**
```typescript
// Primitive signals
signal<string>('')
signal<boolean>(false)
signal<number>(0)

// Object signals
signal<CaseFile | null>(null)
signal<Motion[]>([])

// Computed signals (derived state)
computed(() => this.allCases().slice(0, 3))
computed(() => this.history().length > 0)

// Effects (side effects)
effect(() => {
  const caseId = this.navigationService.caseToLoad();
  if (caseId) this.loadCase(caseId);
})
```

### Component State Patterns
```typescript
// Loading state pattern
this.loading.set(true);
try {
  const result = await this.service.doSomething();
  this.result.set(result);
} catch (e) {
  this.error.set(errorMessage);
} finally {
  this.loading.set(false);
}

// Update pattern
this.items.update(items => [...items, newItem]);

// Replace pattern
this.activeItem.set(newItem);
```

## Build Configuration

### Angular Configuration (angular.json)
```json
{
  "architect": {
    "build": {
      "builder": "@angular/build:application",
      "options": {
        "outputPath": {"base": "./dist", "browser": "."},
        "browser": "index.tsx",
        "tsConfig": "tsconfig.json"
      }
    },
    "serve": {
      "builder": "@angular/build:dev-server",
      "options": {"port": 3000}
    }
  }
}
```

### TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "jsx": "react-jsx",
    "skipLibCheck": true
  }
}
```

**Note:** JSX mode is "react-jsx" even though this is Angular - required for the AI Studio compatibility layer.

## API Integration

### Gemini API Configuration
```typescript
// Initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Chat creation
const chat = ai.chats.create({
  model: 'gemini-2.5-pro',
  history: previousMessages,
  config: { thinkingConfig: { thinkingBudget: 32768 } }
});

// Content generation
const response = ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: { parts: [textPart, mediaPart] },
  config: { 
    systemInstruction: 'You are an expert...',
    tools: [{ googleSearch: {} }]
  }
});
```

### Request Types
1. **Chat Messages** - Conversational with history
2. **Content Generation** - One-shot with multimodal input
3. **Grounded Search** - With Google Search tool

## Performance Considerations

### Change Detection Strategy
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```
- All components use OnPush
- Combined with signals for optimal performance
- Reduces unnecessary change detection cycles

### Lazy Loading Opportunities (Not Implemented)
```typescript
// Potential improvement:
const routes = [
  { path: 'chat', loadComponent: () => import('./components/case-chat/...') },
  { path: 'evidence', loadComponent: () => import('./components/evidence/...') },
  // etc.
];
```

### Bundle Size Optimization Opportunities
- Code splitting by component
- Tree shaking (already enabled)
- Dynamic imports for heavy dependencies (PDF.js)
- Image optimization

## Security Architecture

### Current State (Vulnerabilities)
```
┌─────────────────┐
│  Browser        │
│  ├─ API Key ⚠️  │  ← Exposed in client code
│  ├─ Case Data ⚠️│  ← Stored in localStorage (no encryption)
│  └─ User Input  │  ← No sanitization
└─────────────────┘
         ↓
    Direct API Call
         ↓
┌─────────────────┐
│  Gemini API     │
└─────────────────┘
```

### Recommended Architecture
```
┌─────────────────┐
│  Browser        │
│  ├─ Auth Token  │
│  └─ UI Only     │
└─────────────────┘
         ↓
    HTTPS (TLS)
         ↓
┌─────────────────┐
│  Backend API    │
│  ├─ Auth        │
│  ├─ API Key 🔒  │  ← Secure server-side storage
│  ├─ Validation  │
│  └─ Rate Limit  │
└─────────────────┘
         ↓
┌─────────────────┐
│  Gemini API     │
└─────────────────┘
         ↓
┌─────────────────┐
│  Database       │
│  └─ Encrypted   │
└─────────────────┘
```

## Deployment Architecture

### Current (AI Studio)
```
GitHub → AI Studio Build → Hosted App
                ↓
         Serves Static Files
                ↓
         User Browser
```

### Recommended (Production)
```
GitHub → CI/CD Pipeline
          ↓
    ┌─────────────────┐
    │  Build Process  │
    │  ├─ npm install │
    │  ├─ npm test    │
    │  └─ npm build   │
    └─────────────────┘
          ↓
    ┌─────────────────┐
    │  CDN/Static     │  ← Vercel/Netlify/CloudFront
    │  (Frontend)     │
    └─────────────────┘
          ↓
    User Browser
          ↓
    ┌─────────────────┐
    │  API Gateway    │
    │  (Backend)      │  ← Express/Fastify/Lambda
    └─────────────────┘
          ↓
    ┌─────────────────┐
    │  Database       │  ← PostgreSQL/MongoDB
    └─────────────────┘
```

## Error Handling Strategy

### Current Implementation
```typescript
try {
  const response = await this.service.doSomething();
  this.result.set(response);
} catch (e) {
  console.error(e);
  const errorMessage = e instanceof Error ? e.message : 'Unknown error';
  this.error.set(`Failed: ${errorMessage}`);
}
```

### Recommended Enhancement
```typescript
// Global error handler
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: Error) {
    // Log to monitoring service
    // Display user-friendly message
    // Track error metrics
  }
}

// Retry logic for API calls
async function withRetry<T>(
  fn: () => Promise<T>, 
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) throw e;
      await delay(Math.pow(2, i) * 1000);
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Testing Strategy (Recommended)

### Unit Testing Structure
```
src/
├── components/
│   ├── home/
│   │   ├── home.component.ts
│   │   └── home.component.spec.ts    ← Test file
├── services/
│   ├── gemini.service.ts
│   └── gemini.service.spec.ts        ← Test file
```

### Test Coverage Goals
- Components: 80%+ coverage
- Services: 90%+ coverage
- Critical paths: 100% coverage

### Test Types Needed
1. **Unit Tests** - Component and service logic
2. **Integration Tests** - Service interactions
3. **E2E Tests** - User workflows
4. **Visual Regression Tests** - UI consistency

## Key Architectural Decisions

### Why Angular Signals?
- ✅ Better performance than RxJS for component state
- ✅ Simpler mental model
- ✅ Automatic dependency tracking
- ✅ Enables zoneless change detection

### Why No Router?
- ✅ Simpler implementation for tab-based UI
- ✅ Maintains state within tabs
- ✅ No URL complexity needed
- ❌ Loses browser navigation (back/forward)
- ❌ No deep linking to specific views

### Why LocalStorage?
- ✅ Simple implementation for POC
- ✅ No backend required initially
- ✅ Instant persistence
- ❌ Not suitable for production (security, size limits)
- ❌ No sync across devices

### Why Multiple Gemini Models?
- ✅ Cost optimization (Flash cheaper than Pro)
- ✅ Performance optimization (Flash faster)
- ✅ Quality where needed (Pro for complex tasks)
- ✅ Thinking mode for legal reasoning

## Scalability Considerations

### Current Limitations
- Single device, single user
- No concurrent editing
- Memory-bound (all data in component state)
- No pagination
- No search/filter optimization

### Scaling Path
1. **Phase 1:** Add backend API
2. **Phase 2:** Implement database
3. **Phase 3:** Add authentication
4. **Phase 4:** Multi-user support
5. **Phase 5:** Real-time collaboration
6. **Phase 6:** Microservices (if needed)

## Monitoring and Observability (Not Implemented)

### Recommended Additions
```typescript
// Performance monitoring
performance.mark('analysis-start');
await analyzeEvidence();
performance.mark('analysis-end');
performance.measure('analysis', 'analysis-start', 'analysis-end');

// Error tracking
Sentry.captureException(error);

// Analytics
analytics.track('motion_generated', {
  jurisdiction: caseFile.jurisdiction,
  motionType: motionType
});

// API usage tracking
track('gemini_api_call', {
  model: modelName,
  tokens: response.usageMetadata.totalTokenCount
});
```

---

**Last Updated:** November 10, 2025  
**Version:** 1.0  
**Author:** Copilot SWE Agent
