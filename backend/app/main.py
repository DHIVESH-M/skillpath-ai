import os
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv
from .agents import orchestrator, adapt_roadmap, generate_quiz, CAREERS, ACHIEVEMENTS
load_dotenv()
app = FastAPI(title="SkillPath AI")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","), allow_methods=["*"], allow_headers=["*"])
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"]) if os.getenv("SUPABASE_URL") else None

def uid(authorization: str = Header(None)):
    if not sb: raise HTTPException(500, "Supabase is not configured on the server")
    if not authorization: raise HTTPException(401, "Missing token")
    try: return sb.auth.get_user(authorization.split()[-1]).user
    except Exception: raise HTTPException(401, "Invalid or expired session")

def load(u):
    p = (sb.table("profiles").select("*").eq("id", u.id).execute().data or [None])[0]
    if not p:
        p = {"id": u.id, "name": (u.email or "Learner").split("@")[0], "xp": 0, "streak": 0}
        sb.table("profiles").insert(p).execute()
    sk = {r["skill"]: r["level"] for r in sb.table("skill_scores").select("*").eq("user_id", u.id).execute().data}
    rm = (sb.table("roadmaps").select("*").eq("user_id", u.id).execute().data or [None])[0]
    p["achievements"] = [r["key"] for r in sb.table("achievements").select("key").eq("user_id", u.id).execute().data]
    return p, sk, rm

def persist_profile(p): sb.table("profiles").update({k: p.get(k) for k in ("name", "career_goal", "xp", "streak", "last_active")}).eq("id", p["id"]).execute()
def grant(u_id, keys):
    for k in keys: sb.table("achievements").upsert({"user_id": u_id, "key": k}).execute()
def tv(t): return [{"agent": m["agent"], "to": m["to"]} for m in t]

@app.get("/api/health")
def health(): return {"ok": True, "gemini": bool(os.getenv("GEMINI_API_KEY")), "supabase": bool(sb)}
@app.get("/api/careers")
def careers(): return CAREERS

@app.get("/api/me")
def me(u=Depends(uid)):
    p, sk, rm = load(u)
    att = sb.table("attempts").select("skill,score,created_at").eq("user_id", u.id).order("created_at", desc=True).limit(10).execute().data
    return {"profile": p, "skills": sk, "roadmap": rm, "attempts": att, "achievements": [{"key": k, "label": ACHIEVEMENTS.get(k, k)} for k in p["achievements"]]}

class Plan(BaseModel): name: str; goal: str; ratings: dict[str, int]
@app.post("/api/analyze")
def analyze(b: Plan, u=Depends(uid)):
    if b.goal not in CAREERS: raise HTTPException(400, "Unknown career goal")
    p, _, _ = load(u); p.update(name=b.name, career_goal=b.goal)
    ratings = {k: max(0, min(100, v)) for k, v in b.ratings.items()}
    r = orchestrator.plan(b.goal, ratings, p)
    for k, v in ratings.items(): sb.table("skill_scores").upsert({"user_id": u.id, "skill": k, "level": v}).execute()
    sb.table("roadmaps").upsert({"user_id": u.id, "summary": r["summary"], "steps": r["roadmap"], "matches": r["matches"]}).execute()
    persist_profile(r["profile"]); grant(u.id, r["new_achievements"])
    return {"summary": r["summary"], "matches": r["matches"], "ai": r["ai"], "trace": tv(r["trace"])}

@app.get("/api/quiz/{skill}")
def quiz(skill: str, u=Depends(uid)):
    _, sk, _ = load(u)
    return {"skill": skill, "questions": generate_quiz(skill, sk.get(skill, 0))}

class Submit(BaseModel): skill: str; questions: list[dict]; answers: list[int]
@app.post("/api/quiz/submit")
def submit(b: Submit, u=Depends(uid)):
    p, sk, rm = load(u)
    r = orchestrator.evaluate(b.skill, b.questions, b.answers, p)
    lvl = round(0.5 * sk.get(b.skill, 0) + 0.5 * r["score"])
    sb.table("skill_scores").upsert({"user_id": u.id, "skill": b.skill, "level": lvl}).execute()
    sb.table("attempts").insert({"user_id": u.id, "skill": b.skill, "score": r["score"], "feedback": r["feedback"]}).execute()
    if rm: sb.table("roadmaps").update({"steps": adapt_roadmap(rm["steps"], b.skill, r["score"])}).eq("user_id", u.id).execute()
    persist_profile(r["profile"]); grant(u.id, r["new_achievements"])
    return {"score": r["score"], "feedback": r["feedback"], "new_level": lvl, "xp": r["xp_delta"], "new_achievements": r["new_achievements"],
            "adapted": bool(rm) and r["score"] < 60, "trace": tv(r["trace"])}

@app.post("/api/roadmap/{step_id}/complete")
def complete(step_id: str, u=Depends(uid)):
    p, sk, rm = load(u)
    st = next((s for s in (rm or {}).get("steps", []) if s["id"] == step_id), None)
    if not st: raise HTTPException(404, "Step not found")
    if st["done"]: return {"xp": 0, "new_achievements": []}
    st["done"] = True
    r = orchestrator.complete_step(st["xp"], p)
    sb.table("roadmaps").update({"steps": rm["steps"]}).eq("user_id", u.id).execute()
    sb.table("skill_scores").upsert({"user_id": u.id, "skill": st["skill"], "level": min(100, sk.get(st["skill"], 0) + 10)}).execute()
    persist_profile(r["profile"]); grant(u.id, r["new_achievements"])
    return {"xp": r["xp_delta"], "new_achievements": r["new_achievements"]}

class Chat(BaseModel): message: str
@app.post("/api/mentor")
def mentor(b: Chat, u=Depends(uid)):
    p, sk, rm = load(u)
    hist = list(reversed(sb.table("messages").select("role,content").eq("user_id", u.id).order("id", desc=True).limit(8).execute().data))
    r = orchestrator.mentor(b.message, hist, p, (rm or {}).get("steps", []), sk)
    sb.table("messages").insert([{"user_id": u.id, "role": "user", "content": b.message}, {"user_id": u.id, "role": "assistant", "content": r["reply"]}]).execute()
    return {"reply": r["reply"], "action": r.get("action"), "ai": r["ai"], "trace": tv(r["trace"])}
@app.get("/api/mentor/history")
def history(u=Depends(uid)): return sb.table("messages").select("role,content").eq("user_id", u.id).order("id").limit(50).execute().data
