# 🎙️ Audora - AI Voice Assistant

A futuristic, intelligent AI Voice Assistant web application. Built with **Next.js 14 (App Router)**, **Web Speech API**, **Tailwind CSS**, and connected to **Supabase (PostgreSQL)**, deployed on **Vercel**.

---

## ✨ Features

- 🌐 **Audora Glowing Ring UI**: Futuristic cyan/blue ambient orb that reacts to speaking, listening, and thinking states.
- 🎙️ **Voice Interaction (Speech-to-Speech)**:
  - Wake-up mode & click-to-speak.
  - Realistic natural Text-to-Speech audio response using Web Speech Synthesis.
  - Synthesized wake and completion audio chimes.
- 📝 **Voice Notes**: Say *"Take a note: Buy groceries tomorrow"* — automatically saved & synced to Supabase database.
- ⏰ **Reminders & Timers**: Say *"Remind me to drink water at 5 PM"* — tracks tasks and due times with completion toggles.
- ⛅ **Smart Skills**:
  - Live weather updates & queries
  - Date & Time checks
  - Funny jokes and witty responses
  - General knowledge and conversational Q&A
- 🗄️ **Supabase Integration**:
  - PostgreSQL database schema with Row Level Security (RLS).
  - Syncs conversations, voice notes, and reminders in real-time.
  - **Graceful Fallback**: Works 100% offline using `localStorage` even before Supabase is connected!
- 🚀 **Vercel Ready**: Preconfigured with `vercel.json` for one-command deployment (`vercel --prod`).

---

## 🚀 Quick Start (Local Run)

1. Start Development Server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

2. Or double-click `start-local.bat`.

---

## 🌐 Deploy to Vercel

```bash
vercel --prod
```
