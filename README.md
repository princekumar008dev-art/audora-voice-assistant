# 🎙️ Echo - AI Voice Assistant (Amazon Echo / Alexa Web App)

A futuristic, intelligent AI Voice Assistant web application inspired by **Amazon Echo & Alexa**. Built with **Next.js 14 (App Router)**, **Web Speech API**, **Tailwind CSS**, and connected to **Supabase (PostgreSQL)**, ready for instant deployment on **Vercel**.

![Echo Voice Assistant](https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Features

- 🌐 **Amazon Echo Glowing Ring UI**: Futuristic cyan/blue ambient orb that reacts to speaking, listening, and thinking states.
- 🎙️ **Voice Interaction (Speech-to-Speech)**:
  - Wake-up mode & click-to-speak.
  - Realistic natural Text-to-Speech audio response using Web Speech Synthesis.
  - Synthesized Alexa/Echo audio wake and completion chimes.
- 📝 **Voice Notes**: Say *"Take a note: Buy groceries tomorrow"* — automatically saved & synced to Supabase database.
- ⏰ **Reminders & Timers**: Say *"Remind me to drink water at 5 PM"* — tracks tasks and due times with completion toggles.
- ⛅ **Smart Skills**:
  - Live weather simulation & queries
  - Date & Time checks
  - Funny Alexa-style jokes and witty responses
  - General knowledge and conversational Q&A
- 🗄️ **Supabase Integration**:
  - PostgreSQL database schema with Row Level Security (RLS).
  - Syncs conversations, voice notes, and reminders in real-time.
  - **Graceful Fallback**: Works 100% offline using `localStorage` even before Supabase is connected!
- 🚀 **Vercel Ready**: Preconfigured with `vercel.json` for one-command deployment (`vercel --prod`).

---

## 🚀 Quick Start (Local Run)

1. **Install Dependencies** (Already installed):
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Supabase Setup Guide

1. Go to [Supabase](https://supabase.com) and create a new project.
2. Navigate to **SQL Editor** in your Supabase dashboard.
3. Copy and run the SQL code from [`supabase/schema.sql`](./supabase/schema.sql).
4. Go to **Project Settings** -> **API** and copy:
   - `Project URL`
   - `anon public key`
5. Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

---

## 🌐 Deploy to Vercel

### Method 1: Using Vercel CLI (Installed on your machine)
1. Run:
   ```bash
   vercel
   ```
2. Follow the prompt to login to your Vercel account.
3. Deploy to production:
   ```bash
   vercel --prod
   ```
4. Set Environment Variables in Vercel Project Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Method 2: Via GitHub & Vercel Dashboard
1. Initialize git and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Echo Voice Assistant"
   # push to your GitHub repo
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new) -> Import repository.
3. Add environment variables and click **Deploy**!
