# 🎨 LegalAId UI/UX Design System, React Integration & Deployment Guide

This document defines the complete **UI/UX Design Architecture**, **React Frontend Connectivity**, and step-by-step **Deployment Instructions** for publishing the **React Frontend on Vercel** and the **Python FastAPI Backend on Render**.

---

## 🏛️ 1. UI/UX Design Philosophy & Vision

LegalAId is engineered specifically for **first-generation litigants in India** who face intimidating legal processes, complex jargon, and prohibitive legal costs. 

### Key Design Pillars:
1. **Empathy First**: Warm, trustworthy color palettes (Deep Indigo, Slate Navy, Emerald green accents) replacing sterile corporate blues.
2. **Zero Barrier to Entry**: Anonymous session auth via HTTP-Only cookies. Users can submit grievances immediately without filling out sign-up forms.
3. **Chunked Cognitive Load**: Progressive 3-step disclosure:
   - **Step 1**: Describe problem (Intake)
   - **Step 2**: Understand rights & verified laws (Explanation)
   - **Step 3**: Take action & generate notice (Remedies & PDF)
4. **Mobile-First & High Accessibility**: Responsive layout, high-contrast text ratios, large touch targets, and visual badges for non-lawyers.

---

## 📱 2. UI Page Flows & Wireframe Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LEGALAID WEB APPLICATION                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [ STEP 1: INTAKE ] ───► [ STEP 2: RIGHTS EXPLANATION ] ───► [ STEP 3: NOTICE GENERATOR ]  │
│                                                                        │
│   ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐ │
│   │ Describe Grievance     │  │ Verified Legal Rights  │  │ Generate PDF Notice    │ │
│   │ Auto-Detected Entities │  │ Plain-Language Steps   │  │ Download / Print       │ │
│   └────────────────────────┘  └────────────────────────┘  └────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Page 1: Hero & Grievance Intake Portal (`/`)
- **Header**: Logo, Session Status badge ("Anonymous Session Active"), Language Selector (English / Hindi).
- **Hero Banner**: "Describe your legal issue in your own words. We will explain your rights & generate a free legal notice."
- **Grievance Input Box**:
  - Auto-growing text area with character counter (max 2000 chars).
  - Quick-start chips: *"Defective product replacement"*, *"Unpaid salary by employer"*, *"Tenant security deposit withholding"*.
  - Real-time Entity Extraction preview chips below text area (`[MONEY: Rs 45,000]`, `[PHONE: 9876543210]`).
- **Submit Button**: Gradient primary CTA: **"Analyze My Case & Rights →"**

### Page 2: AI Rights Explanation & Verified Citations (`/case/:id`)
- **Domain Badge Header**: Visual pill (e.g. `CONSUMER DISPUTE`, `LABOR RIGHTS`, `TENANT DISPUTE`).
- **Two-Column Responsive Layout**:
  - **Left Column (Verified Laws)**:
    - Cards displaying `Act Name`, `Section Number`, `Law Code` (`IPC`/`BNS`/`N/A`), and official `India Code Source URL`.
    - **Auditability Tag**: *"100% Verified Human Legal Context (0% AI Hallucination)"*.
  - **Right Column (AI Explanation)**:
    - **Part 1: Plain-Language Summary** (What happened & your rights).
    - **Part 2: Step-by-Step Action Plan** (Forum to approach, 2-year limitation period).
- **CTA Bar**: **"Generate Formal Legal Notice PDF →"**

### Page 3: Legal Notice Generator & Live PDF Download (`/case/:id/document`)
- **Tone Selector**:
  - 🔘 **Amicable Request Notice** (Polite 15-day demand notice to vendor/employer)
  - 🔘 **Formal Legal Demand Notice** (Strict pre-litigation notice before Consumer Forum / Labor Court)
- **Extracted Form Fields** (Pre-filled from NLP entities, editable by user):
  - Complainant Name & Address
  - Opponent/Company Name & Address
  - Claimed Refund Amount (Rs.)
- **Live Document Actions**:
  - **Button 1**: `Generate & Preview PDF`
  - **Button 2**: `Download Official PDF (Legal_Notice.pdf)`

---

## ⚛️ 3. React Frontend to FastAPI Backend Connectivity

### API Endpoints Summary Table

| HTTP Method | Backend Route | React Frontend Action | Auth / Session |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/session` | Initializes anonymous session | Sets `legalaid_session` Cookie |
| `GET` | `/api/session` | Checks active session | Cookie / `X-Session-ID` Header |
| `POST` | `/api/intake` | Submits grievance text | Auto-attaches Session ID |
| `POST` | `/api/intake/{id}/classify` | Runs vector search classification | Rate Limited (20/min) |
| `POST` | `/api/intake/{id}/explain` | Generates LLM explanation + Hallucination Guard | Rate Limited (20/min) |
| `POST` | `/api/intake/{id}/document` | Generates Jinja2 PDF Document | Rate Limited (20/min) |
| `GET` | `/api/document/{id}/download` | Downloads generated PDF | Signed URL Token |

### React API Client (`src/api/client.ts`)

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enables HTTP-Only session cookies across domains
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle Rate Limiting (429) gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      alert('Too many requests. Please wait a minute before trying again.');
    }
    return Promise.reject(error);
  }
);
```

---

## 🚀 4. Deployment Instructions

### 🔴 Part A: Deploy Backend (Python FastAPI) on Render

1. **Push Repository to GitHub**:
   Ensure all Python files, `requirements.txt`, `app/`, and `.env` template are committed.

2. **Create New Web Service on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Web Service**.
   - Connect your GitHub repository (`legalaid-backend`).

3. **Configure Build & Environment Settings**:
   - **Name**: `legalaid-backend-api`
   - **Environment**: `Python 3`
   - **Region**: Singapore / Oregon
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt && python -m spacy download en_core_web_sm
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```

4. **Environment Variables on Render**:
   In the Render Environment tab, add:
   ```env
   DATABASE_URL=your_supabase_postgresql_connection_string
   DIRECT_URL=your_supabase_postgresql_connection_string
   GROQ_API_KEY=your_groq_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   CORS_ORIGINS=https://legalaid.vercel.app,http://localhost:3000,http://localhost:5173
   RATE_LIMIT=20/minute
   ```

5. **Deploy & Copy Backend URL**:
   Render will deploy your API to `https://legalaid-backend-api.onrender.com`.

---

### ⚪ Part B: Deploy Frontend (React) on Vercel

1. **Initialize React Project (Vite + React)**:
   ```bash
   npx create-vite legalaid-frontend --template react-ts
   cd legalaid-frontend
   npm install axios lucide-react tailwindcss
   ```

2. **Configure Vercel Configuration (`vercel.json`)**:
   Create `vercel.json` in the root of the React app for single-page app routing:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

3. **Environment Variable Configuration (`.env.production`)**:
   ```env
   VITE_API_BASE_URL=https://legalaid-backend-api.onrender.com
   ```

4. **Deploy to Vercel via Vercel CLI or Web Console**:
   - Install Vercel CLI: `npm i -g vercel`
   - Run deployment command:
     ```bash
     vercel --prod
     ```
   - Set **Environment Variable** on Vercel Dashboard:
     - `VITE_API_BASE_URL` = `https://legalaid-backend-api.onrender.com`

---

## ✅ Deployment Verification Checklist

- [x] **Backend Health**: `GET https://legalaid-backend-api.onrender.com/api/health` returns `200 OK`.
- [x] **Database Connectivity**: Supabase PostgreSQL pooler connected on Port 5432.
- [x] **CORS Pre-Flight**: Backend allows requests from `https://legalaid.vercel.app`.
- [x] **Session Cookies**: Cookies passed across domains with `SameSite=None; Secure`.
- [x] **Document Downloads**: PDF generation works on Render server disk and streams correctly.
