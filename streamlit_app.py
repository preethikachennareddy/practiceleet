"""
PracticeLeet - AI Mock Interview Coach (Streamlit version)
Run with:  streamlit run streamlit_app.py
Requires:  pip install streamlit google-generativeai
Set env:   GEMINI_API_KEY=your-key-here  (free at aistudio.google.com)
"""

import streamlit as st
import google.generativeai as genai
import json
import time
import os
from datetime import datetime

# --- Page config ---
st.set_page_config(
    page_title="PracticeLeet - AI Interview Coach",
    page_icon="",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# --- Constants ---
COMPANIES = ["Amazon", "Google", "Meta", "Microsoft", "Apple"]
LEVELS    = ["New Grad", "Early Career (24 yrs)", "Senior", "Staff"]
TOPICS    = ["Arrays", "Strings", "Linked Lists", "Trees", "Graphs",
             "Dynamic Programming", "Backtracking", "Heaps", "Binary Search", "SQL"]
DIFFICULTIES = ["Easy", "Medium", "Hard"]
LANGUAGES    = ["Python", "Java", "C++", "JavaScript", "Go"]

COMPANY_PERSONAS = {
    "Amazon": {
        "persona": (
            "You are a senior Software Development Engineer at Amazon conducting a Bar Raiser-style technical interview.\n"
            "Amazon values: customer obsession, ownership, think big, bias for action, invent and simplify.\n"
            "After the coding problem, briefly ask one Leadership Principle question such as "
            "'Tell me about a time you disagreed with a decision' or "
            "'Describe a project where you had to deliver under extreme time pressure.'\n"
            "Push candidates to discuss trade-offs and scalability (Amazon scale = billions of requests/day).\n"
            "Be direct and expect candidates to be specific with examples (STAR format for LP answers)."
        ),
        "scoring_focus": "scalability, ownership, trade-off discussion",
        "color": "#e8a838",
        "emoji": "",
    },
    "Google": {
        "persona": (
            "You are a senior Software Engineer at Google conducting a technical interview.\n"
            "Google values: optimal solutions, clean code, strong computer science fundamentals, and clear communication.\n"
            "Push candidates to first explain their approach before coding. Ask 'Can you do better?' once they have a working solution.\n"
            "Probe for time and space complexity deeply - O(n log n) is often expected where a candidate might settle for O(n²).\n"
            "Expect candidates to walk through their code line by line and reason about correctness.\n"
            "Communication and thought process matter as much as the final answer."
        ),
        "scoring_focus": "optimal complexity, communication, CS fundamentals",
        "color": "#5b9cf6",
        "emoji": "",
    },
    "Meta": {
        "persona": (
            "You are a senior Software Engineer at Meta (Facebook) conducting a technical interview.\n"
            "Meta values: speed, pattern recognition, and getting to a working solution fast.\n"
            "Expect candidates to identify the algorithmic pattern quickly (sliding window, two pointers, BFS, etc.).\n"
            "Meta interviews are time-pressured - if a candidate is stuck for more than 5 minutes, nudge them.\n"
            "Ask follow-up questions about how the solution scales to Meta's billions of users.\n"
            "Be friendly but move fast. Value coding speed and pattern fluency."
        ),
        "scoring_focus": "pattern recognition, speed, scalability",
        "color": "#4caf7d",
        "emoji": "",
    },
    "Microsoft": {
        "persona": (
            "You are a senior Software Engineer at Microsoft conducting a technical interview.\n"
            "Microsoft values: problem-solving process, collaboration, and practical engineering judgment.\n"
            "Encourage candidates to think out loud. Ask clarifying questions yourself to guide the process collaboratively.\n"
            "Microsoft looks for candidates who can adapt their solution based on new requirements mid-interview - "
            "add a follow-up constraint after they have a solution (e.g., 'Now what if the input is sorted?').\n"
            "Be warm and supportive but thorough on correctness."
        ),
        "scoring_focus": "adaptability, process, collaborative communication",
        "color": "#5b9cf6",
        "emoji": "",
    },
    "Apple": {
        "persona": (
            "You are a senior Software Engineer at Apple conducting a technical interview.\n"
            "Apple values: elegant solutions, attention to detail, and deep ownership of quality.\n"
            "Ask candidates to think about edge cases and input validation before they start coding.\n"
            "Apple interviews tend to be more conversational - discuss the solution design before diving into code.\n"
            "Probe for code quality: naming conventions, modularity, and whether the code is readable.\n"
            "Ask 'How would you test this?' after they write their solution."
        ),
        "scoring_focus": "code quality, edge cases, testing mindset",
        "color": "#aaa",
        "emoji": "",
    },
}

CODE_STARTERS = {
    "Python":     "# Write your solution here\n\ndef solution():\n    pass\n",
    "Java":       "// Write your solution here\n\nclass Solution {\n    public void solve() {\n        // your code\n    }\n}\n",
    "C++":        "// Write your solution here\n\n#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solution() {\n    // your code\n}\n",
    "JavaScript": "// Write your solution here\n\nfunction solution() {\n    // your code\n}\n",
    "Go":         "// Write your solution here\n\npackage main\n\nfunc solution() {\n    // your code\n}\n",
}

# --- Gemini client ---
GEMINI_MODEL = "gemini-2.0-flash"  # fast + cheap; swap to "gemini-1.5-pro" for harder problems

def _get_api_key():
    return (
        os.environ.get("GEMINI_API_KEY")
        or st.secrets.get("GEMINI_API_KEY", "")
    )

def _build_prompt(system: str, messages: list) -> str:
    """
    Gemini's generate_content takes a single prompt string.
    We bake the system instruction + conversation history into one block.
    """
    parts = [f"[SYSTEM]\n{system}\n[/SYSTEM]\n"]
    for m in messages:
        role = "Candidate" if m["role"] == "user" else "Interviewer"
        parts.append(f"{role}: {m['content']}")
    return "\n".join(parts)


def call_claude(system: str, messages: list, max_tokens: int = 1000) -> str:
    """Drop-in replacement - same signature, now calls Gemini."""
    api_key = _get_api_key()
    if not api_key:
        return "Warning: No API key found. Set GEMINI_API_KEY in your environment or Streamlit secrets."
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=0.7,
            ),
        )
        prompt = _build_prompt(system, messages)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Warning: Gemini API error: {e}"


def stream_claude(system: str, messages: list, max_tokens: int = 1000):
    """Streaming version - yields text chunks."""
    api_key = _get_api_key()
    if not api_key:
        yield "Warning: No API key found. Set GEMINI_API_KEY in your environment or Streamlit secrets."
        return
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=0.7,
            ),
        )
        prompt = _build_prompt(system, messages)
        for chunk in model.generate_content(prompt, stream=True):
            if chunk.text:
                yield chunk.text
    except Exception as e:
        yield f"Warning: Gemini API error: {e}"


# --- Prompt builders ---
def opening_prompt(company, level, topic, difficulty):
    mode = COMPANY_PERSONAS[company]
    return (
        f"{mode['persona']}\n\n"
        f"The candidate is a {level} applying for a software engineering role.\n"
        f"You are giving them a {difficulty}-level {topic} coding problem.\n\n"
        "Instructions:\n"
        "1. Greet them briefly (1 sentence).\n"
        f"2. Present ONE coding problem appropriate for {company} {difficulty} {topic}. Include:\n"
        "   - A clear problem title\n"
        "   - Problem description (35 sentences)\n"
        "   - Input/Output format\n"
        "   - Constraints (time, space, value ranges)\n"
        "   - 2 examples with inputs and expected outputs\n"
        "3. Ask ONE clarifying question to prompt their thinking process.\n\n"
        f"Keep the problem realistic - it should feel like an actual {company} interview question.\n"
        "Do NOT give hints or solutions yet. Format clearly with line breaks."
    )


def conversation_system(company, level, topic, difficulty):
    mode = COMPANY_PERSONAS[company]
    return (
        f"{mode['persona']}\n\n"
        f"You are mid-interview with a {level} candidate on a {difficulty} {topic} problem.\n"
        "Continue the conversation naturally:\n"
        "- Answer clarifying questions briefly and precisely.\n"
        "- Do NOT give away the solution or full approach.\n"
        "- Push for complexity analysis if they haven't discussed it.\n"
        "- If they describe an approach, ask 'what's the time complexity of that?'\n"
        "- Keep responses concise (24 sentences max unless the question warrants more)."
    )


def hint_system(company, topic, difficulty, hint_count, code):
    return (
        f"You are a {company} interviewer giving hint #{hint_count} for a {difficulty} {topic} problem.\n\n"
        "Hint rules:\n"
        "- Hint 1: A very small nudge - point to the data structure or pattern family.\n"
        "- Hint 2: A slightly more specific direction - mention the algorithm pattern without giving steps.\n"
        "- Hint 3+: A concrete but incomplete step - show the first move without completing it.\n\n"
        "Never reveal the full solution. Keep it to 12 sentences.\n"
        f"{'Candidate current code:\\n' + code if code.strip() else 'No code written yet.'}"
    )


def test_system(topic, difficulty, language):
    return (
        f"You are evaluating {language} code for a {difficulty} {topic} LeetCode-style problem.\n\n"
        "Run exactly 3 visible test cases against the candidate's code. For each test:\n"
        "- Carefully read and trace through the code manually to determine the actual output.\n"
        "- Show: Input -> Expected -> Actual -> PASS or FAIL\n\n"
        "Format each test on its own line like:\n"
        "Test 1: Input: [1,2,3] -> Expected: 6 -> Got: 6 OK PASS\n"
        "Test 2: Input: [] -> Expected: 0 -> Got: error FAIL FAIL\n\n"
        "After the 3 tests, add one line: 'Edge case note: ...' highlighting one edge case the code may not handle.\n"
        "Be accurate - if the code has a bug, mark it FAIL. Do not just pass everything."
    )


def feedback_system(company, level, topic, difficulty, hint_count, elapsed_min):
    mode = COMPANY_PERSONAS[company]
    return (
        f"You are a senior {company} engineer completing a debrief on a {level} candidate's {difficulty} {topic} interview.\n"
        f"Scoring focus for {company}: {mode['scoring_focus']}.\n\n"
        f"Evaluate holistically. Hints used: {hint_count} (each hint reduces the score slightly).\n"
        f"Time taken: {elapsed_min} minutes ({difficulty} problems: Easy 15m, Medium 25m, Hard 40m).\n\n"
        "Return ONLY a valid JSON object - no markdown, no prose, no code fences:\n"
        "{\n"
        '  "correctness": <integer 0-10>,\n'
        '  "complexity": <integer 0-10>,\n'
        '  "code_quality": <integer 0-10>,\n'
        '  "communication": <integer 0-10>,\n'
        '  "edge_cases": <integer 0-10>,\n'
        '  "overall": <integer 0-10>,\n'
        '  "decision": "<Strong Hire | Hire | Borderline | No Hire>",\n'
        '  "summary": "<2-3 sentences of honest, specific feedback>",\n'
        '  "strengths": ["<strength 1>", "<strength 2>"],\n'
        '  "improvements": ["<improvement 1>", "<improvement 2>"],\n'
        '  "optimal_complexity": "<optimal time/space complexity>",\n'
        '  "candidate_complexity": "<candidate solution complexity>",\n'
        '  "follow_up": "<one follow-up question the interviewer would ask>"\n'
        "}"
    )


# --- Session state init ---
def init_state():
    defaults = {
        "screen":       "setup",    # setup | interview | feedback
        "config":       {},
        "messages":     [],         # {role, content}
        "hint_count":   0,
        "code":         "",
        "start_time":   None,
        "feedback":     None,
        "test_output":  "",
        "history":      [],         # past attempts
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


# --- CSS ---
def inject_css():
    st.markdown("""
    <style>
    /* Hide default Streamlit header chrome */
    #MainMenu, footer, header { visibility: hidden; }

    /* Global */
    body { font-family: 'Inter', sans-serif; }

    /* Metric cards */
    [data-testid="metric-container"] {
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 10px;
        padding: 14px 18px;
    }

    /* Chat messages */
    .ai-bubble {
        background: #1e1e2e;
        border: 1px solid #333;
        border-radius: 12px;
        border-top-left-radius: 3px;
        padding: 12px 16px;
        margin: 6px 0;
        font-size: 14px;
        line-height: 1.65;
        color: #e0e0e0;
    }
    .user-bubble {
        background: #242424;
        border: 1px solid #3a3a3a;
        border-radius: 12px;
        border-top-right-radius: 3px;
        padding: 12px 16px;
        margin: 6px 0 6px 40px;
        font-size: 14px;
        line-height: 1.65;
        color: #e0e0e0;
    }
    .bubble-label {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #666;
        margin-bottom: 4px;
    }

    /* Score bars */
    .score-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
    }
    .score-label { font-size: 13px; color: #aaa; min-width: 130px; }
    .score-track {
        flex: 1;
        height: 6px;
        background: #2a2a2a;
        border-radius: 4px;
        overflow: hidden;
    }
    .score-fill { height: 100%; border-radius: 4px; }
    .score-num { font-size: 13px; font-weight: 600; min-width: 36px; text-align: right; }

    /* Decision badge */
    .decision-badge {
        display: inline-block;
        padding: 6px 18px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
    }

    /* Stbutton full width */
    div.stButton > button { width: 100%; }

    /* Code area */
    .stTextArea textarea {
        font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
        font-size: 13px !important;
        background: #0d0d0d !important;
        color: #e0e0e0 !important;
        border: 1px solid #333 !important;
    }

    /* Selectbox */
    .stSelectbox label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }

    /* Timer display */
    .timer-display {
        font-size: 24px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: #aaa;
        text-align: center;
        padding: 6px;
        background: #1a1a1a;
        border-radius: 8px;
        border: 1px solid #333;
        letter-spacing: 0.05em;
    }

    /* Section headers */
    .section-header {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #555;
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 1px solid #2a2a2a;
    }

    /* Hint box */
    .hint-box {
        background: #1e1a00;
        border: 1px solid #3a3000;
        border-radius: 8px;
        padding: 10px 14px;
        font-size: 13px;
        color: #d4a017;
        margin: 6px 0;
    }

    /* Follow-up box */
    .followup-box {
        background: #1a1a2e;
        border: 1px solid #2a2a5a;
        border-radius: 8px;
        padding: 14px;
        font-size: 13px;
        color: #a0a0e0;
        font-style: italic;
        margin-top: 8px;
    }
    </style>
    """, unsafe_allow_html=True)


# --- Helpers ---
def score_color(v):
    if v >= 8: return "#4caf7d"
    if v >= 6: return "#e8a838"
    return "#e05c5c"


def score_bar_html(label, value):
    color = score_color(value)
    pct = value * 10
    return (
        f'<div class="score-row">'
        f'  <span class="score-label">{label}</span>'
        f'  <div class="score-track"><div class="score-fill" style="width:{pct}%;background:{color}"></div></div>'
        f'  <span class="score-num" style="color:{color}">{value}/10</span>'
        f'</div>'
    )


def elapsed_str(start_time):
    if not start_time:
        return "00:00"
    secs = int(time.time() - start_time)
    return f"{secs // 60:02d}:{secs % 60:02d}"


# --- Screens ---
def render_setup():
    st.markdown("##  PracticeLeet")
    st.markdown("AI-powered mock technical interviews. Choose your target and start coding.")

    # Stats strip if there's history
    if st.session_state.history:
        h = st.session_state.history
        avg = sum(a.get("overall", 0) for a in h) / len(h)
        c1, c2, c3 = st.columns(3)
        c1.metric("Attempts",    len(h))
        c2.metric("Avg score",   f"{avg:.1f}/10")
        c3.metric("Last result", h[0].get("decision", "-") if h else "-")
        st.divider()

    col1, col2 = st.columns(2)
    with col1:
        company    = st.selectbox("Company",    COMPANIES)
        topic      = st.selectbox("Topic",      TOPICS)
    with col2:
        level      = st.selectbox("Level",      LEVELS)
        difficulty = st.selectbox("Difficulty", DIFFICULTIES)

    language = st.selectbox("Language", LANGUAGES)

    mode = COMPANY_PERSONAS[company]
    mode_tips = {
        "Amazon":    " Includes a Leadership Principle question after coding.",
        "Google":    " Focus on optimal complexity and clear communication.",
        "Meta":      " Speed and pattern recognition emphasized.",
        "Microsoft": " Collaborative - expects you to adapt mid-problem.",
        "Apple":     " Code quality and testing mindset.",
    }
    st.info(mode_tips[company])

    if st.button("Start Interview ->", type="primary", use_container_width=True):
        st.session_state.config = {
            "company": company, "level": level,
            "topic": topic, "difficulty": difficulty, "language": language,
        }
        st.session_state.messages  = []
        st.session_state.hint_count = 0
        st.session_state.code      = CODE_STARTERS.get(language, "")
        st.session_state.test_output = ""
        st.session_state.feedback  = None
        st.session_state.start_time = time.time()
        st.session_state.screen    = "interview"

        # Get opening problem
        cfg = st.session_state.config
        sys = opening_prompt(cfg["company"], cfg["level"], cfg["topic"], cfg["difficulty"])
        with st.spinner("Your interviewer is preparing a problem..."):
            reply = call_claude(sys, [{"role": "user", "content": "Begin the interview."}], max_tokens=1200)
        st.session_state.messages = [
            {"role": "user",      "content": "Begin the interview."},
            {"role": "assistant", "content": reply},
        ]
        st.rerun()


def render_interview():
    cfg = st.session_state.config
    company    = cfg["company"]
    topic      = cfg["topic"]
    difficulty = cfg["difficulty"]
    language   = cfg["language"]
    level      = cfg["level"]

    mode = COMPANY_PERSONAS[company]

    # --- Top bar ---
    bar_cols = st.columns([3, 1, 1])
    with bar_cols[0]:
        diff_color = {"Easy": "green", "Medium": "orange", "Hard": "red"}[difficulty]
        st.markdown(
            f"{mode['emoji']} **{company}** &nbsp;-&nbsp; "
            f":{diff_color}[{difficulty}] &nbsp;-&nbsp; `{topic}` &nbsp;-&nbsp; `{language}`",
            unsafe_allow_html=False,
        )
    with bar_cols[1]:
        elapsed = elapsed_str(st.session_state.start_time)
        st.markdown(f'<div class="timer-display"> {elapsed}</div>', unsafe_allow_html=True)
    with bar_cols[2]:
        if st.button("x End interview"):
            st.session_state.screen = "setup"
            st.rerun()

    st.divider()

    # --- Split layout ---
    left, right = st.columns([1, 1], gap="medium")

    # --- LEFT: Chat panel ---
    with left:
        st.markdown('<div class="section-header">AI Interviewer</div>', unsafe_allow_html=True)

        # Display chat (skip seed message)
        display = [m for m in st.session_state.messages if m["content"] != "Begin the interview."]
        for msg in display:
            if msg["role"] == "assistant":
                st.markdown(
                    f'<div class="bubble-label">Interviewer</div>'
                    f'<div class="ai-bubble">{msg["content"]}</div>',
                    unsafe_allow_html=True,
                )
            else:
                st.markdown(
                    f'<div class="bubble-label" style="text-align:right">You</div>'
                    f'<div class="user-bubble">{msg["content"]}</div>',
                    unsafe_allow_html=True,
                )

        st.markdown("---")

        # Hint button
        hint_label = f" Request hint ({st.session_state.hint_count} used)"
        if st.button(hint_label, use_container_width=True):
            st.session_state.hint_count += 1
            n = st.session_state.hint_count
            sys = hint_system(company, topic, difficulty, n, st.session_state.code)
            with st.spinner(f"Preparing hint #{n}..."):
                hint_reply = call_claude(sys, [{"role": "user", "content": f"Give hint #{n}."}], max_tokens=350)
            hint_msg = f" Hint #{n}: {hint_reply}"
            st.session_state.messages.append({"role": "user",      "content": f"[Requested hint #{n}]"})
            st.session_state.messages.append({"role": "assistant",  "content": hint_msg})
            st.rerun()

        # Chat input
        user_input = st.chat_input("Ask a clarifying question...")
        if user_input:
            st.session_state.messages.append({"role": "user", "content": user_input})
            sys = conversation_system(company, level, topic, difficulty)
            with st.spinner("Interviewer is responding..."):
                reply = call_claude(sys, st.session_state.messages, max_tokens=600)
            st.session_state.messages.append({"role": "assistant", "content": reply})
            st.rerun()

    # --- RIGHT: Code panel ---
    with right:
        st.markdown('<div class="section-header">Code Editor</div>', unsafe_allow_html=True)

        code = st.text_area(
            label="code",
            label_visibility="collapsed",
            value=st.session_state.code,
            height=380,
            placeholder=f"Write your {language} solution here...",
            key="code_editor",
        )
        st.session_state.code = code

        r1, r2 = st.columns(2)

        with r1:
            if st.button(" Run tests", use_container_width=True):
                sys = test_system(topic, difficulty, language)
                with st.spinner("Running test cases..."):
                    result = call_claude(sys, [{"role": "user", "content": f"Code:\n{code}"}], max_tokens=700)
                st.session_state.test_output = result
                st.rerun()

        with r2:
            if st.button("OK Submit & review", type="primary", use_container_width=True):
                elapsed_sec = int(time.time() - (st.session_state.start_time or time.time()))
                elapsed_min = elapsed_sec // 60
                conv = "\n\n".join(
                    f"{'Interviewer' if m['role'] == 'assistant' else 'Candidate'}: {m['content']}"
                    for m in st.session_state.messages
                    if m["content"] != "Begin the interview."
                )
                sys = feedback_system(
                    company, level, topic, difficulty,
                    st.session_state.hint_count, elapsed_min,
                )
                with st.spinner("Generating your interview feedback..."):
                    raw = call_claude(
                        sys,
                        [{"role": "user", "content": f"Conversation:\n{conv}\n\nFinal code:\n{code or '(no code submitted)'}"]},
                        max_tokens=1400,
                    )
                try:
                    raw_clean = raw.replace("```json", "").replace("```", "").strip()
                    feedback = json.loads(raw_clean)
                except Exception:
                    feedback = {
                        "correctness": 5, "complexity": 5, "code_quality": 5,
                        "communication": 5, "edge_cases": 5, "overall": 5,
                        "decision": "Borderline",
                        "summary": raw or "Could not parse feedback.",
                        "strengths": ["Attempted a solution"],
                        "improvements": ["Try again for detailed feedback"],
                        "optimal_complexity": "Unknown",
                        "candidate_complexity": "Unknown",
                        "follow_up": "N/A",
                    }

                feedback["elapsed_sec"] = elapsed_sec
                feedback["hint_count"]  = st.session_state.hint_count
                feedback["company"]     = company
                feedback["topic"]       = topic
                feedback["difficulty"]  = difficulty
                feedback["language"]    = language
                feedback["date"]        = datetime.now().isoformat()

                st.session_state.feedback = feedback
                st.session_state.history.insert(0, {
                    "overall":    feedback.get("overall", 0),
                    "decision":   feedback.get("decision", ""),
                    "company":    company,
                    "topic":      topic,
                    "difficulty": difficulty,
                    "date":       feedback["date"],
                })
                st.session_state.screen = "feedback"
                st.rerun()

        # Test output
        if st.session_state.test_output:
            st.markdown('<div class="section-header" style="margin-top:12px">Test results</div>', unsafe_allow_html=True)
            lines = st.session_state.test_output.split("\n")
            for line in lines:
                if "PASS" in line or "OK" in line:
                    st.success(line, icon="OK")
                elif "FAIL" in line or "FAIL" in line:
                    st.error(line, icon="FAIL")
                elif line.strip():
                    st.caption(line)


def render_feedback():
    f = st.session_state.feedback
    if not f:
        st.session_state.screen = "setup"
        st.rerun()

    company    = f.get("company",    "")
    topic      = f.get("topic",      "")
    difficulty = f.get("difficulty", "")
    language   = f.get("language",   "")
    decision   = f.get("decision",   "Borderline")
    overall    = f.get("overall",    0)
    elapsed    = f.get("elapsed_sec", 0)
    hints      = f.get("hint_count", 0)

    elapsed_str_val = f"{elapsed // 60}m {elapsed % 60}s"

    decision_styles = {
        "Strong Hire": ("", "#4caf7d", "#0d2a1a"),
        "Hire":        ("", "#4caf7d", "#0d2a1a"),
        "Borderline":  ("Warning:", "#e8a838", "#2a2010"),
        "No Hire":     ("", "#e05c5c", "#2a0f0f"),
    }
    icon, dcolor, dbg = decision_styles.get(decision, ("Warning:", "#e8a838", "#2a2010"))

    st.markdown(f"## Interview Complete")
    st.markdown(f"`{company}` - `{difficulty} {topic}` - `{language}`")

    # Decision + overall
    st.markdown(
        f'<div style="background:{dbg};border:1px solid {dcolor};border-radius:12px;'
        f'padding:16px 20px;display:flex;align-items:center;justify-content:space-between;margin:16px 0">'
        f'  <span style="font-size:20px;font-weight:700;color:{dcolor}">{icon} {decision}</span>'
        f'  <span style="font-size:28px;font-weight:700;color:{score_color(overall)}">{overall}/10</span>'
        f'</div>',
        unsafe_allow_html=True,
    )

    # Metrics
    m1, m2, m3 = st.columns(3)
    m1.metric("Time",       elapsed_str_val)
    m2.metric("Hints used", hints)
    m3.metric("Overall",    f"{overall}/10")

    st.divider()

    # Score bars
    st.markdown('<div class="section-header">Dimension scores</div>', unsafe_allow_html=True)
    bars_html = "".join([
        score_bar_html("Correctness",   f.get("correctness",   0)),
        score_bar_html("Complexity",    f.get("complexity",    0)),
        score_bar_html("Code quality",  f.get("code_quality",  0)),
        score_bar_html("Communication", f.get("communication", 0)),
        score_bar_html("Edge cases",    f.get("edge_cases",    0)),
    ])
    st.markdown(bars_html, unsafe_allow_html=True)

    st.divider()

    # Summary
    st.markdown('<div class="section-header">Summary</div>', unsafe_allow_html=True)
    st.markdown(f.get("summary", ""))

    # Complexity
    opt = f.get("optimal_complexity", "")
    cand = f.get("candidate_complexity", "")
    if opt or cand:
        st.divider()
        st.markdown('<div class="section-header">Complexity analysis</div>', unsafe_allow_html=True)
        cx1, cx2 = st.columns(2)
        cx1.markdown(f"**Optimal**\n\n`{opt}`")
        cx2.markdown(f"**Your solution**\n\n`{cand}`")

    # Strengths & improvements
    st.divider()
    s1, s2 = st.columns(2)
    with s1:
        st.markdown('<div class="section-header">Strengths</div>', unsafe_allow_html=True)
        strengths = f.get("strengths", [])
        if isinstance(strengths, list):
            for s in strengths:
                st.markdown(f"OK {s}")
        else:
            st.markdown(f"OK {strengths}")

    with s2:
        st.markdown('<div class="section-header">Areas to improve</div>', unsafe_allow_html=True)
        improvements = f.get("improvements", [])
        if isinstance(improvements, list):
            for imp in improvements:
                st.markdown(f"-> {imp}")
        else:
            st.markdown(f"-> {improvements}")

    # Follow-up
    followup = f.get("follow_up", "")
    if followup and followup != "N/A":
        st.divider()
        st.markdown('<div class="section-header">Follow-up question</div>', unsafe_allow_html=True)
        st.markdown(
            f'<div class="followup-box">"{followup}"</div>',
            unsafe_allow_html=True,
        )

    st.divider()
    col1, col2 = st.columns(2)
    with col1:
        if st.button("<- New interview", use_container_width=True):
            st.session_state.screen   = "setup"
            st.session_state.feedback = None
            st.rerun()
    with col2:
        if st.button("View history", use_container_width=True):
            st.session_state.screen = "history"
            st.rerun()


def render_history():
    st.markdown("##  Interview History")
    h = st.session_state.history
    if not h:
        st.info("No interviews completed yet.")
    else:
        avg = sum(a.get("overall", 0) for a in h) / len(h)
        c1, c2 = st.columns(2)
        c1.metric("Total attempts", len(h))
        c2.metric("Average score",  f"{avg:.1f}/10")
        st.divider()
        for attempt in h:
            decision = attempt.get("decision", "")
            ov       = attempt.get("overall", 0)
            col1, col2, col3 = st.columns([2, 1, 1])
            col1.markdown(f"**{attempt.get('company','')}** - {attempt.get('difficulty','')} {attempt.get('topic','')}")
            col2.markdown(f"`{decision}`")
            col3.markdown(f"**{ov}/10**")

    if st.button("<- Back"):
        st.session_state.screen = "setup"
        st.rerun()


# --- Main ---
def main():
    inject_css()
    init_state()

    screen = st.session_state.screen

    if screen == "setup":
        render_setup()
    elif screen == "interview":
        render_interview()
    elif screen == "feedback":
        render_feedback()
    elif screen == "history":
        render_history()


if __name__ == "__main__":
    main()
