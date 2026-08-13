# 🚀 GitHub Push & Free Cloud Deployment Master Blueprint

> **Target Repository**: `https://github.com/diya2405/Ai_Legal_Assistant`  
> **New Branch Name**: `ai-legal-assistant-v2` (Safely preserves your friend's code on `main`)

---

## 📌 PART 1: Push Local Code to New Branch on GitHub

Open your terminal in `e:\Ai_Legal_Assistance` and execute these commands:

```powershell
# 1. Initialize Git (if not already initialized)
git init

# 2. Add all project files (secret .env files are automatically ignored by .gitignore)
git add .

# 3. Create your initial commit
git commit -m "Add complete LegalAId application with RAG, Voice, and Notice Generator"

# 4. Link to your target GitHub repository
git remote add origin https://github.com/diya2405/Ai_Legal_Assistant.git

# 5. Create and switch to your NEW branch (so main branch stays untouched!)
git checkout -b ai-legal-assistant-v2

# 6. Push your new branch to GitHub
git push -u origin ai-legal-assistant-v2
```

---

## 🔑 PART 2: Complete `.env` Environment Variables Reference

When deploying on **Render** (Backend) and **Vercel** (Frontend), enter these exact variable names and values into their dashboard environment settings:

### 1. Render (Backend Environment Variables)

| Variable Name | Exact Value | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `your_supabase_postgresql_connection_string` | Supabase PostgreSQL Connection Pooler (Port 5432) |
| `GROQ_API_KEY` | `your_groq_api_key_here` | Primary LLM Provider (llama-3.3-70b-versatile) |
| `GEMINI_API_KEY` | `your_gemini_api_key_here` | Fallback LLM Provider (gemini-2.5-flash) |
| `CORS_ORIGINS` | `*` | Allows cross-origin requests from your Vercel domain |
| `RATE_LIMIT` | `20/minute` | Rate limiting protection |

### 2. Vercel (Frontend Environment Variables)

| Variable Name | Exact Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://legalaid-backend.onrender.com` *(Replace with your actual Render URL after Step 3)* | Connects React Frontend to FastAPI Backend |

---

## 🐍 PART 3: Deploy Backend on Render (100% Free)

1. Log in to [render.com](https://render.com) with GitHub.
2. Click **New +** ➔ **Web Service**.
3. Connect repository `diya2405/Ai_Legal_Assistant`.
4. Select **Branch**: `ai-legal-assistant-v2` *(DO NOT select main!)*
5. Configure fields:
   - **Name**: `legalaid-backend`
   - **Root Directory**: `legalaid-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Click **Environment Variables** and add all 5 backend variables from Part 2.
7. Click **Create Web Service**.
8. Copy your Render Web Service URL (e.g. `https://legalaid-backend.onrender.com`).

---

## ⚡ PART 4: Deploy Frontend on Vercel (100% Free)

1. Log in to [vercel.com](https://vercel.com) with GitHub.
2. Click **Add New...** ➔ **Project**.
3. Import repository `diya2405/Ai_Legal_Assistant`.
4. Configure fields:
   - **Branch**: `ai-legal-assistant-v2`
   - **Root Directory**: Click Edit ➔ Select `legalaid-frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables**:
   - Add `VITE_API_BASE_URL` = `https://legalaid-backend.onrender.com` *(Your Render URL)*
6. Click **Deploy**!

---

## 🔗 PART 5: Ensuring Backend & Frontend Connectivity

The system has been engineered to handle cross-origin deployment automatically:

1. **Automatic Base URL Resolution**:
   - In `legalaid-frontend/src/api/client.ts`, `apiClient` uses `import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8002'`.
   - When deployed on Vercel, it routes all API calls (`/api/session`, `/api/intake`, `/api/intake/{id}/explain`, `/api/intake/{id}/chat`, `/api/intake/{id}/document`) directly to your Render backend.
2. **CORS & Session Cookie Handling**:
   - `withCredentials: true` is enabled in Axios so session cookies function across Vercel and Render domains.
   - `CORSMiddleware` in FastAPI is configured with `allow_origins=["*"]`, `allow_credentials=True`, and `allow_headers=["*"]`.
