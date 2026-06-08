# PracticeLeet - AI Mock Interview Coach

A fully AI-powered technical interview simulator. Pick your target company, level, topic, and difficulty - then face a real mock interview with an AI interviewer that asks clarifying questions, gives hints on request, evaluates your code, and delivers a detailed post-interview scorecard.

---

## Features

- **AI Interviewer** - In-character for Amazon, Google, Meta, Microsoft, or Apple. Gives one real coding problem, responds to clarifying questions, pushes for complexity analysis, gives hints only when requested (and tracks them).
- **Code Editor** - Write in Python, Java, C++, or JavaScript. Run visible test cases instantly.
- **LLM Feedback** - Correctness, complexity analysis, code quality, communication score, edge cases, hire/no-hire decision.
- **Progress Tracker** - Saves all attempts to localStorage. Tracks weak topics, scores over time, and streaks.
- **Company Modes** - Amazon (LP + coding), Google (communication + optimal), Meta (speed + patterns).

---

## Tech Stack

- **Frontend**: React 18
- **AI**: Anthropic Claude API (claude-sonnet-4)
- **Storage**: localStorage (upgrade to Supabase/PostgreSQL for multi-device)
- **Styling**: Pure CSS (no framework needed)

---

## Streamlit Version (quickest to demo)

The `streamlit_app.py` file is a self-contained single-file version - great for demos and sharing.

### Run locally
```bash
pip install streamlit anthropic
export ANTHROPIC_API_KEY=sk-ant-...
streamlit run streamlit_app.py
```

### Deploy to Streamlit Cloud (free)
1. Push the repo to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io) -> New app -> select your repo
3. Set `streamlit_app.py` as the main file
4. Under **Advanced settings -> Secrets**, add:
   ```toml
   ANTHROPIC_API_KEY = "sk-ant-your-key-here"
   ```
5. Deploy - your app gets a public URL instantly

---

## React Version (full featured)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/practiceleet.git
cd practiceleet
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add your Anthropic API key

```bash
cp .env.example .env
# Edit .env and add your key from https://console.anthropic.com
```

### 4. Run

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
  components/
    SetupScreen.jsx       - Company / topic / difficulty picker
    InterviewScreen.jsx   - Split-panel interview room
    ChatPanel.jsx         - AI interviewer chat
    CodePanel.jsx         - Code editor + test runner
    FeedbackScreen.jsx    - Post-interview scorecard
    ProgressDashboard.jsx - Historical attempts + weak topics
  hooks/
    useTimer.js           - Interview timer
    useProgress.js        - localStorage read/write
    useClaude.js          - Gemini API calls
  utils/
    prompts.js            - All system prompts
    companyModes.js       - Company-specific interview styles
    storage.js            - localStorage helpers
  pages/
    App.jsx               - Root router / screen switcher
  index.js
  index.css
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `REACT_APP_ANTHROPIC_API_KEY` | Your Anthropic API key |

> **Security note**: This app calls the Anthropic API directly from the browser. For production, proxy API calls through your own backend so the key is never exposed to clients.

---

## Roadmap

- [ ] Voice mock interview (Web Speech API)
- [ ] Resume-based question selection
- [ ] Hint ladder with increasing specificity
- [ ] Streak tracker
- [ ] Weak-topic dashboard with spaced repetition
- [ ] Replay past attempts
- [ ] Backend + auth (Supabase)
- [ ] Docker sandbox for real code execution

---

## License

MIT
