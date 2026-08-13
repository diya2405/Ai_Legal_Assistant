# 📐 LegalAId Frontend UI/UX Master Specification & Backend Mapping

> **System Standard**: Google-Level Professional Design, Zero Frontend/Backend Mismatch, Accessibility AAA Compliant, Mobile-First Responsive Architecture.

---

## 🎨 1. Design System & Aesthetics (Google Material You + Modern Glassmorphism)

The UI is built with an **empathetic, high-trust visual language** tailored for first-generation litigants in India.

### Color Tokens & System Palette
| Token Name | Hex Code | Visual Use Case |
| :--- | :--- | :--- |
| `--primary-900` (Deep Slate Navy) | `#0F172A` | Backgrounds, Headers, Primary Text |
| `--primary-700` (Royal Indigo) | `#4F46E5` | Primary CTA Buttons, Active Navigation, Focal Accents |
| `--accent-emerald` (Legal Shield Green) | `#10B981` | Verified Citations, Success Badges, 0-Hallucination Indicators |
| `--accent-amber` (Limitation Warning) | `#F59E0B` | Limitation Period Warnings, Rate Limit Notices |
| `--neutral-50` (Warm Cream Surface) | `#F8FAFC` | Card Backgrounds, Soft Content Containers |
| `--neutral-200` (Glass Border) | `#E2E8F0` | Glassmorphism Card Borders, Dividers |

### Typography Tokens
- **Primary Font**: `Outfit`, `sans-serif` (Headings, Buttons, Badges)
- **Body Font**: `Inter`, `sans-serif` (Plain Language Legal Explanations)
- **Code/Citation Font**: `JetBrains Mono`, `monospace` (Legal Section Numbers, Act Codes)

---

## 🖥️ 2. Screen-by-Screen Detailed Feature Specification

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               NAVIGATION BAR                                    │
│ [⚖️ LegalAId]              [🟢 Session: Active]  [🌙 Theme]  [📜 History (3)] │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
    ┌────────────────────────────────────┴────────────────────────────────────┐
    ▼                                    ▼                                    ▼
┌──────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
│ SCREEN 1: INTAKE     │    │ SCREEN 2: EXPLANATION    │    │ SCREEN 3: DOCUMENT       │
│                      │    │                          │    │                          │
│ • Grievance Textarea │───►│ • Domain Badge           │───►│ • Tone Selector          │
│ • Voice Input Modal  │    │ • Verified Citations     │    │ • Pre-filled Form        │
│ • Entity Pills       │    │ • AI Plain Explanation   │    │ • Live PDF Download      │
│ • Submit CTA         │    │ • Actionable Timeline    │    │ • Print / Export         │
└──────────────────────┘    └──────────────────────────┘    └──────────────────────────┘
```

---

### 🔹 Screen 1: Hero & Grievance Intake Portal (`/`)

#### 1. Top Navigation Bar (`Navbar.tsx`)
- **Logo**: ⚖️ **LegalAId** (Gradient text, home link).
- **Session Indicator Pill**: `🟢 Anonymous Session Active` (Hover shows tooltip: *"Your privacy is protected via HTTP-Only session cookies. No account required."*).
- **History Trigger**: `📜 My Cases (3)` (Opens side drawer with past intakes).
- **Theme Toggle**: Switch between Light Mode & Dark Glassmorphism Mode.

#### 2. Hero Header (`HeroSection.tsx`)
- **Headline**: *"Understand Your Legal Rights in Simple Words & Generate Free Legal Notices"*
- **Sub-headline**: *"AI-powered assistance for Indian consumers, workers, and tenants. 100% verified legal citations."*
- **Trust Badges**:
  - `🛡️ Verified Indian Statutes (IPC / BNS / CPA)`
  - `⚡ 0% AI Hallucinated Laws Guarantee`
  - `🔒 100% Anonymous & Free`

#### 3. Grievance Intake Box (`IntakeForm.tsx`)
- **Textarea Element**:
  - Auto-growing text height (min 150px, max 400px).
  - Placeholder: *"Describe your problem in English, Hindi, or Hinglish (e.g. I bought a defective laptop for Rs 45000 and the seller refuses repair...)"*
  - Character counter: `0 / 2000 chars` (Changes to amber at 1800 chars).
- **Voice Input Feature (`VoiceRecorderModal.tsx`)**:
  - Microphone button allowing speech-to-text input.
- **Quick-Start Grievance Chips (`ScenarioChips.tsx`)**:
  - Chip 1: 🛒 *"Defective Product / Vendor Refund Denial"*
  - Chip 2: 💼 *"Unpaid Salary / Illegal Termination"*
  - Chip 3: 🏠 *"Tenant Deposit Withheld by Landlord"*
  - *Clicking a chip populates sample text into the textarea.*
- **Live Entity Detection Bar (`EntityLivePreview.tsx`)**:
  - As user types, extracted entities appear dynamically:
    - `[💵 MONEY: Rs. 45,000]`
    - `[📞 PHONE: 9876543210]`
    - `[📅 DATE: 12th May]`
- **Submit Primary CTA**:
  - Button text: **"Analyze My Case & Explain Rights →"**
  - **Loading State Indicator**:
    - Progress steps: `[1/3] Detecting language...` -> `[2/3] Extracting entities...` -> `[3/3] Fetching verified laws...`

---

### 🔹 Screen 2: AI Rights Explanation & Verified Citations Dashboard (`/case/:id`)

#### 1. Case Banner Header (`CaseHeader.tsx`)
- **Domain Badge**: `🛒 CONSUMER DISPUTE` or `💼 LABOR RIGHTS` or `🏠 TENANT DISPUTE`.
- **Classification Meter**: Visual confidence gauge (`Confidence: 94% High Match`).
- **Language Badge**: Auto-detected language indicator (`Detected: English / Hindi`).

#### 2. Verified Legal Citations Panel - Left Column (`VerifiedCitations.tsx`)
- **Header**: `📜 VERIFIED LEGAL PROVISIONS (HUMAN AUDITED)`
- **Citation Card (`CitationCard.tsx`)**:
  - `Act Name`: *Consumer Protection Act, 2019*
  - `Section Number`: *Section 2(10) / Section 35*
  - `Law Code Badge`: `N/A` or `IPC` or `BNS` (High contrast pill).
  - `Provision Summary`: Plain text snippet of what the section enforces.
  - `Official Source Link`: Clickable link to official government repository (`India Code`).
  - `Verification Badge`: `✔ Verified Audit Date: Aug 2026`

#### 3. AI Plain-Language Explanation Panel - Right Column (`LegalExplanation.tsx`)
- **Header**: `🤖 YOUR LEGAL RIGHTS EXPLAINED`
- **Provider Used Badge**: `Powered by Groq Llama-3.3` (or `Gemini Fallback`).
- **Hallucination Shield**: `🛡️ 100% Citation Grounded (0% AI Hallucination)`.
- **Part 1: Rights Summary Card**:
  - Plain-language explanation structured into bullet points formatted for first-generation litigants.
- **Part 2: Step-by-Step Action Plan**:
  - **Remedy Forum Card**: Displays where to file (`District Consumer Disputes Redressal Commission`).
  - **Limitation Period Gauge**: Visual progress bar showing time window (`2 Years from date of cause of action`).
  - **Checklist**:
    - [ ] Gather purchase receipts and warranty cards
    - [ ] Send 15-day formal legal notice to vendor
    - [ ] Approach Consumer Forum if unaddressed

#### 4. Sticky Bottom Action Bar (`ActionBar.tsx`)
- Floating glassmorphism bar with CTA: **"Generate Formal Legal Notice PDF →"**

---

### 🔹 Screen 3: Legal Notice Customizer & Live PDF Download (`/case/:id/document`)

#### 1. Tone Selector Card (`ToneSelector.tsx`)
- **Option A (Amicable Request Notice)**:
  - *"Polite demand notice for vendor/employer requesting resolution within 15 days without legal aggression."*
- **Option B (Formal Legal Demand Notice)**:
  - *"Strict legal notice citing statutory provisions, warning of formal court proceedings before Consumer Forum / Labor Court."*

#### 2. Editable Notice Form (`NoticeForm.tsx`)
Pre-filled automatically from extracted NLP entities, editable by user:
- **Complainant Details**: Name, Phone Number, Full Address.
- **Opposing Party Details**: Vendor/Company Name, Store/Office Address.
- **Claimed Value**: Disputed amount in Rupees (`Rs. 45,000`).

#### 3. Document Action Panel & Live PDF Download (`PDFViewerModal.tsx`)
- **Generate Button**: `Generate & Preview Notice PDF`
- **Download Button**: `📥 Download Official PDF (Legal_Notice.pdf)`
  - Direct download trigger connecting to backend signed URL: `/api/document/{doc_id}/download?token={token}`.
- **Print / Share Button**: Opens browser print dialog directly for the PDF.

---

### 🔹 Screen 4: Case History Drawer (`HistoryDrawer.tsx`)
- Slide-over drawer accessible from navbar.
- Displays list of past intakes stored under current session cookie.
- Shows timestamp, raw text snippet, domain badge, and direct link to view full explanation / download PDF again.

---

## 🔗 3. Backend API Mapping & Data Flow Matrix

| Screen Component | Event / Trigger | FastAPI Backend Endpoint | Request Payload | Response Handling |
| :--- | :--- | :--- | :--- | :--- |
| `App.tsx` | Page Load | `GET /api/session` | None (Cookies sent) | Sets active session state |
| `IntakeForm.tsx` | Typing in text box | Local spaCy / regex matcher | `raw_text` | Renders entity pills |
| `IntakeForm.tsx` | Click "Analyze Case" | `POST /api/intake` | `{ raw_text, session_id }` | Returns `intake_id`, entities |
| `CaseHeader.tsx` | Page Load `/case/:id` | `POST /api/intake/{id}/classify` | None | Returns matched KB entries |
| `LegalExplanation.tsx` | Page Load `/case/:id` | `POST /api/intake/{id}/explain` | None | Renders plain-language text & verified citations |
| `NoticeForm.tsx` | Click "Generate PDF" | `POST /api/intake/{id}/document` | `{ tone, complainant_name, opponent_name, amount_claimed }` | Returns `document_id` & `download_url` |
| `PDFViewer.tsx` | Click "Download PDF" | `GET /api/document/{id}/download` | `token` query param | Streams PDF file blob for browser download |

---

## 📁 4. React Project Folder Structure (`legalaid-frontend`)

```
legalaid-frontend/
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios client with withCredentials & 429 interceptor
│   │   ├── session.ts             # Session API calls
│   │   ├── intake.ts              # Intake API calls
│   │   ├── classification.ts      # Classification API calls
│   │   ├── explanation.ts         # LLM Explanation API calls
│   │   └── document.ts            # PDF Generation & Download API calls
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx         # Navigation bar with session indicator
│   │   │   ├── Footer.tsx         # Footer with legal disclaimer
│   │   │   ├── Badge.tsx          # High-contrast legal domain & status badges
│   │   │   ├── Button.tsx         # Accessible gradient primary & secondary buttons
│   │   │   └── Toast.tsx          # Toast notification alerts
│   │   ├── intake/
│   │   │   ├── IntakeForm.tsx     # Grievance textarea with char counter
│   │   │   ├── ScenarioChips.tsx  # Quick-start legal issue chips
│   │   │   └── EntityPreview.tsx  # Real-time extracted entity pills
│   │   ├── explanation/
│   │   │   ├── CitationCard.tsx   # Verified human-audited legal citation card
│   │   │   ├── RightsSummary.tsx  # Plain-language explanation card
│   │   │   └── ActionPlan.tsx     # Step-by-step remedy timeline & limitation gauge
│   │   └── document/
│   │       ├── ToneSelector.tsx   # Amicable vs Formal tone toggle
│   │       ├── NoticeForm.tsx     # Editable complainant/opponent details form
│   │       └── PDFDownload.tsx    # Live PDF download trigger
│   ├── pages/
│   │   ├── HomePage.tsx           # Intake Portal (Screen 1)
│   │   ├── CaseDetailPage.tsx     # Explanation Dashboard (Screen 2)
│   │   └── DocumentPage.tsx       # PDF Customizer (Screen 3)
│   ├── context/
│   │   ├── AuthContext.tsx        # Session state management
│   │   └── ThemeContext.tsx       # Dark/Light mode theme provider
│   ├── types/
│   │   └── api.ts                 # TypeScript interfaces matching FastAPI Pydantic schemas
│   ├── styles/
│   │   └── globals.css            # Tailwind directives and design system tokens
│   ├── App.tsx                    # Main app routes & layout
│   └── main.tsx                   # Entry point
├── vercel.json                    # Vercel SPA rewrite config
├── vite.config.ts                 # Vite TypeScript configuration
└── package.json
```

---

## 🛠️ 5. State Machine & Error Resilience

1. **Network Error Boundary**: If backend API on Render is cold-starting or unreachable, show a friendly status message: *"Connecting to legal database... Please wait."*
2. **Rate Limit Handling (429)**: Displays a countdown timer toast: *"Rate limit reached (20 requests/min). Next request available in 45 seconds."*
3. **Session Auto-Recovery**: If a session cookie expires, the frontend calls `POST /api/session` automatically to acquire a fresh session token without losing draft text.
