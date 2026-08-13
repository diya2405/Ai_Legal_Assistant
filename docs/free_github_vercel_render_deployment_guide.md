# 🚀 Complete 100% Free Deployment Guide: GitHub + Vercel + Render

This guide outlines how to publish LegalAId for free using:
1. **GitHub** (Source Code Repository)
2. **Vercel** (Free React Frontend Hosting)
3. **Render** (Free Python FastAPI Backend Hosting)
4. **Supabase** (Free Managed PostgreSQL Database - Already Connected!)

---

## 📁 1. Project Directory Structure Prepared for GitHub

All necessary deployment configurations (`vercel.json`, `Procfile`, `render.yaml`, `.gitignore`) have been pre-configured in your workspace:

```
e:\Ai_Legal_Assistance\
├── .gitignore                      <-- Prevents secret leakage (node_modules, venv, .env)
├── legalaid-frontend/
│   ├── vercel.json                 <-- Configures Vercel SPA Routing
│   ├── src/api/client.ts           <-- Dynamic Base URL (VITE_API_BASE_URL)
│   └── package.json
└── legalaid-backend/
    ├── Procfile                    <-- Uvicorn command for Render
    ├── render.yaml                 <-- Render Web Service Blueprint
    ├── requirements.txt
    └── app/main.py
```

---

## 🐙 2. Push Code to GitHub (Step-by-Step Terminal Commands)

Open your terminal in `e:\Ai_Legal_Assistance` and execute:

```powershell
# 1. Initialize Git Repository
git init

# 2. Add all files to staging (secret .env files are automatically ignored by .gitignore)
git add .

# 3. Create your initial commit
git commit -m "Initial release of LegalAId AI Legal Rights Assistant"

# 4. Create a new public/private repository on GitHub (e.g. "legalaid-ai")
# 5. Link local repository to GitHub (replace YOUR_GITHUB_USERNAME):
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/legalaid-ai.git

# 6. Push code to GitHub main branch
git push -u origin main
```

---

## 🐍 3. Deploy Python FastAPI Backend on Render (100% FREE)

1. Go to [render.com](https://render.com) and log in with your GitHub account.
2. Click **New +** -> **Web Service**.
3. Select your GitHub repository (`legalaid-ai`).
4. Set the following parameters:
   - **Name**: `legalaid-backend`
   - **Root Directory**: `legalaid-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Click **Environment Variables** and add your keys:
   - `DATABASE_URL`: `your_supabase_postgresql_connection_string`
   - `GROQ_API_KEY`: `your_groq_api_key_here`
   - `GEMINI_API_KEY`: `your_gemini_api_key_here`
6. Click **Create Web Service**.
7. Copy your deployed Backend URL (e.g., `https://legalaid-backend.onrender.com`).

---

## ⚡ 4. Deploy React Frontend on Vercel (100% FREE)

1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`legalaid-ai`).
4. Configure Project settings:
   - **Root Directory**: Select `legalaid-frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - `VITE_API_BASE_URL`: Paste your Render backend URL (e.g. `https://legalaid-backend.onrender.com`)
6. Click **Deploy**!

🎉 Your app will be live globally on a free `.vercel.app` domain with SSL certificate, automatic CDN caching, and 100% free hosting!
