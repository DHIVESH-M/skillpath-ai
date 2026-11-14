# SkillPath AI 🧠✨
Personalized AI learning platform: career goal → skill-gap analysis → adaptive roadmap → quizzes → XP/streaks → AI mentor.

**Stack:** React + Vite + Tailwind · Three.js / React Three Fiber / Drei · GSAP · FastAPI · LangGraph · Gemini · Supabase

## Multi-agent architecture (`backend/app/agents.py`)
| Agent | Job |
|---|---|
| Skill Analyzer | Computes skill gaps vs career targets + Gemini insight |
| Career Matcher | Scores fit across all careers |
| Learning Recommender | Builds ordered quests (courses + projects); adapts after quizzes |
| Assessment Evaluator | Generates quizzes, grades, gives feedback |
| Progress Tracker | XP, streaks, achievements |
| AI Mentor | Context-aware chat that can trigger app actions (e.g. open a quiz) |

A **LangGraph orchestrator** runs 4 graphs (plan / evaluate / step / mentor). Agents share one typed state and post
`{agent, to, payload}` envelopes to a `trace` bus, which the UI surfaces. Without a Gemini key every agent uses a deterministic fallback, so the app still works.

## Setup
1. **Supabase:** create a project → run `supabase/schema.sql` in the SQL editor. (Optional: disable email confirmation under Auth → Providers for faster testing.)
2. **Backend**
   ```bash
   cd backend && python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env   # fill SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY
   uvicorn app.main:app --reload --port 8000
   ```
3. **Frontend**
   ```bash
   cd frontend && npm install
   cp .env.example .env   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
   npm run dev            # http://localhost:5173 (proxies /api → :8000)
   ```
Check `http://localhost:8000/api/health` to confirm Gemini + Supabase are wired.

## Notes
- Never expose the service-role key to the frontend. The backend verifies the user's Supabase JWT on every request.
- For production, set `CORS_ORIGINS`, and serve `frontend/dist` behind a proxy that forwards `/api`.
