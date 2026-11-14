"""Six specialised agents coordinated by a LangGraph orchestrator.
Agents never call each other directly: they read/write a shared structured state
and append an envelope {agent, to, payload} to `trace` (the message bus)."""
import operator, uuid, json, datetime as dt
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from .llm import ask_json

TARGET = 80
CAREERS = {
 "Full-Stack Developer": ["HTML & CSS", "JavaScript", "React", "Python", "SQL", "APIs", "Git"],
 "Data Scientist": ["Python", "Statistics", "SQL", "Pandas", "Machine Learning", "Data Visualization", "Git"],
 "AI Engineer": ["Python", "Machine Learning", "Deep Learning", "APIs", "Prompt Engineering", "Git", "SQL"],
 "UX Designer": ["Design Principles", "Figma", "User Research", "Prototyping", "HTML & CSS", "Accessibility"],
 "Cybersecurity Analyst": ["Networking", "Linux", "Python", "Cryptography", "Web Security", "Git"],
 "Mobile Developer": ["JavaScript", "React", "APIs", "Git", "UI Design", "SQL"],
}
ACHIEVEMENTS = {
 "first_steps": "First Steps — finished onboarding", "first_quest": "Quest Starter — completed a roadmap step",
 "quiz_whiz": "Quiz Whiz — scored 80%+ on a quiz", "streak_3": "On Fire — 3 day streak",
 "xp_100": "Century — earned 100 XP", "xp_500": "Legend — earned 500 XP",
}
class S(TypedDict, total=False):
    goal: str; ratings: dict; roadmap: list; skill: str; quiz: list; answers: list; score: int
    profile: dict; message: str; history: list; gaps: list; matches: list; summary: str
    feedback: str; xp_delta: int; new_achievements: list; reply: str; action: dict; event: str; ai: bool
    trace: Annotated[list, operator.add]

def _msg(a, to, payload): return [{"agent": a, "to": to, "payload": payload}]

# 1. Skill Analyzer
def skill_analyzer(s: S):
    req = CAREERS.get(s.get("goal"), [])
    gaps = sorted([{"skill": k, "level": s["ratings"].get(k, 0), "target": TARGET, "gap": max(0, TARGET - s["ratings"].get(k, 0))} for k in req], key=lambda g: -g["gap"])
    fb = f"You're closest on {min(gaps, key=lambda g:g['gap'])['skill']} and have the most room to grow in {gaps[0]['skill']}." if gaps else "Pick a career goal to begin."
    d, ai = ask_json(f"You are a skill analyst. Goal: {s.get('goal')}. Skill levels(0-100): {json.dumps(gaps)}. "
                     'Return JSON {"summary": "2 encouraging sentences identifying strengths and the biggest gaps"}', {"summary": fb})
    return {"gaps": gaps, "summary": d.get("summary", fb), "ai": ai, "trace": _msg("SkillAnalyzer", "CareerMatcher", {"gaps": gaps})}

# 2. Career Matcher
def career_matcher(s: S):
    r = s["ratings"]; out = []
    for c, skills in CAREERS.items():
        m = sum(min(r.get(k, 0) / TARGET, 1) for k in skills) / len(skills)
        out.append({"career": c, "match": round(m * 100)})
    out.sort(key=lambda x: -x["match"])
    return {"matches": out[:4], "trace": _msg("CareerMatcher", "LearningRecommender", {"matches": out[:4]})}

# 3. Learning Recommender
def _fallback_step(g):
    k = g["skill"]
    return {"skill": k, "title": f"Master {k}", "description": f"Close a {g['gap']}-point gap in {k} with focused practice.",
            "course": f"{k} fundamentals (freeCodeCamp / MDN / Coursera)", "project": f"Build a small portfolio project that uses {k}"}
def learning_recommender(s: S):
    gaps = [g for g in s["gaps"] if g["gap"] > 10][:6]
    fb = {"steps": [_fallback_step(g) for g in gaps]}
    d, ai = ask_json(f"You are a learning designer. Goal: {s['goal']}. Gaps: {json.dumps(gaps)}. Order from foundational to advanced. "
                     'Return JSON {"steps":[{"skill","title","description","course","project"}]} one step per gap, concrete real course names and a specific project idea.', fb)
    steps = []
    for i, st in enumerate(d.get("steps") or fb["steps"]):
        gp = next((g for g in gaps if g["skill"] == st.get("skill")), {"gap": 20})
        steps.append({"id": uuid.uuid4().hex[:8], "skill": st.get("skill", ""), "title": st.get("title", ""), "description": st.get("description", ""),
                      "course": st.get("course", ""), "project": st.get("project", ""), "xp": 20 + gp["gap"] // 2, "done": False})
    return {"roadmap": steps, "trace": _msg("LearningRecommender", "Orchestrator", {"steps": len(steps)})}

def adapt_roadmap(roadmap, skill, score):
    """Adaptive recommendation after an assessment."""
    steps = [dict(x) for x in roadmap]
    if score < 60 and not any(x["skill"] == skill and x["title"].startswith("Review") and not x["done"] for x in steps):
        steps.insert(0, {"id": uuid.uuid4().hex[:8], "skill": skill, "title": f"Review {skill} basics", "xp": 15, "done": False,
                         "description": f"Your quiz score ({score}%) suggests revisiting the core ideas.", "course": f"{skill} beginner crash course", "project": f"Mini exercise set on {skill}"})
    elif score >= 85:
        for x in steps:
            if x["skill"] == skill and not x["done"] and "aced" not in x["description"]:
                x["description"] += " ⚡ You aced the quiz — feel free to skim this one."; break
    return steps

# 4. Assessment Evaluator
BANK = [{"q": "What does 'debugging' mean?", "options": ["Writing new features", "Finding and fixing errors", "Deleting code", "Designing UI"], "answer": 1},
        {"q": "Which describes version control best?", "options": ["Tracking changes to files over time", "Compressing images", "Hosting websites", "Encrypting data"], "answer": 0},
        {"q": "An API is…", "options": ["A database", "A contract for programs to talk", "A CSS framework", "A browser"], "answer": 1}]
def generate_quiz(skill, level):
    d, _ = ask_json(f"Create a 5-question multiple choice quiz on '{skill}' for a learner at level {level}/100. "
                    'Return JSON {"questions":[{"q","options":[4 strings],"answer":index 0-3}]}', {"questions": BANK})
    qs = [q for q in d.get("questions", []) if isinstance(q.get("options"), list) and len(q["options"]) == 4 and isinstance(q.get("answer"), int)]
    return qs or BANK
def assessment_evaluator(s: S):
    qs, ans = s["quiz"], s["answers"]
    right = sum(1 for q, a in zip(qs, ans) if a == q["answer"]); score = round(100 * right / max(len(qs), 1))
    wrong = [q["q"] for q, a in zip(qs, ans) if a != q["answer"]]
    fb = "Great work!" if score >= 80 else "Keep practising — review the questions you missed."
    d, ai = ask_json(f"Skill: {s['skill']}. Score {score}%. Missed: {wrong}. Return JSON {{\"feedback\":\"2 sentence encouraging tip\"}}", {"feedback": fb})
    return {"score": score, "feedback": d.get("feedback", fb), "ai": ai, "event": "quiz", "trace": _msg("AssessmentEvaluator", "ProgressTracker", {"skill": s["skill"], "score": score})}

# 5. Progress Tracker
def progress_tracker(s: S):
    p = s["profile"]; ev = s["event"]; today = dt.date.today()
    last = dt.date.fromisoformat(str(p["last_active"])) if p.get("last_active") else None
    streak = p.get("streak", 0) or 0
    streak = streak if last == today and streak else (streak + 1 if last and (today - last).days == 1 else 1)
    delta = {"onboard": 25, "step": s.get("xp_delta", 20), "quiz": 10 + (s.get("score", 0) // 5)}.get(ev, 0)
    xp = (p.get("xp", 0) or 0) + delta; have = set(p.get("achievements", [])); new = []
    def grant(k, cond):
        if cond and k not in have: new.append(k)
    grant("first_steps", ev == "onboard"); grant("first_quest", ev == "step"); grant("quiz_whiz", ev == "quiz" and s.get("score", 0) >= 80)
    grant("streak_3", streak >= 3); grant("xp_100", xp >= 100); grant("xp_500", xp >= 500)
    return {"xp_delta": delta, "new_achievements": new, "profile": {**p, "xp": xp, "streak": streak, "last_active": today.isoformat()},
            "trace": _msg("ProgressTracker", "Orchestrator", {"xp": xp, "streak": streak, "new": new})}

# 6. AI Mentor
def ai_mentor(s: S):
    p = s["profile"]; nxt = next((x for x in s.get("roadmap", []) if not x["done"]), None)
    ctx = {"name": p.get("name"), "goal": p.get("career_goal"), "xp": p.get("xp"), "streak": p.get("streak"), "next_step": nxt and nxt["title"], "gaps": s.get("gaps", [])[:4]}
    fb = {"reply": f"Hi {p.get('name','friend')}! " + (f"Your next quest is “{nxt['title']}”. Want a quick quiz on {nxt['skill']} first?" if nxt else "Set a career goal and I'll build your roadmap!"),
          "action": {"type": "quiz", "skill": nxt["skill"]} if nxt else None}
    d, ai = ask_json(f"You are Pip, a cheerful AI learning mentor. Context: {json.dumps(ctx)}. Recent chat: {json.dumps(s.get('history', [])[-6:])}. "
                     f"Learner says: {s['message']}\nReply in <=4 short friendly sentences. If helpful set action to {{\"type\":\"quiz\",\"skill\":<skill>}} or {{\"type\":\"roadmap\"}} else null. "
                     'Return JSON {"reply":"","action":null}', fb)
    return {"reply": d.get("reply", fb["reply"]), "action": d.get("action"), "ai": ai, "trace": _msg("AIMentor", "Orchestrator", {"reply": True})}

# Orchestrator (LangGraph)
def _graph(nodes):
    g = StateGraph(S)
    for n, f in nodes: g.add_node(n, f)
    g.set_entry_point(nodes[0][0])
    for (a, _), (b, _) in zip(nodes, nodes[1:]): g.add_edge(a, b)
    g.add_edge(nodes[-1][0], END)
    return g.compile()
_plan = _graph([("analyze", skill_analyzer), ("match", career_matcher), ("recommend", learning_recommender), ("track", progress_tracker)])
_eval = _graph([("evaluate", assessment_evaluator), ("track", progress_tracker)])
_step = _graph([("track", progress_tracker)])
_mentor = _graph([("analyze", skill_analyzer), ("mentor", ai_mentor)])

class Orchestrator:
    def plan(self, goal, ratings, profile): return _plan.invoke({"goal": goal, "ratings": ratings, "profile": profile, "event": "onboard", "trace": []})
    def evaluate(self, skill, quiz, answers, profile): return _eval.invoke({"skill": skill, "quiz": quiz, "answers": answers, "profile": profile, "trace": []})
    def complete_step(self, xp, profile): return _step.invoke({"event": "step", "xp_delta": xp, "profile": profile, "trace": []})
    def mentor(self, message, history, profile, roadmap, ratings): return _mentor.invoke({"goal": profile.get("career_goal", ""), "ratings": ratings, "message": message, "history": history, "profile": profile, "roadmap": roadmap, "event": "chat", "trace": []})
orchestrator = Orchestrator()
