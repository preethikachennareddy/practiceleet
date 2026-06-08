<div align="center">

# PracticeLeet

**AI-powered mock technical interview coach for Amazon, Google, Meta, Microsoft, and Apple**

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.0-4285F4?logo=google&logoColor=white)](https://aistudio.google.com)
[![Streamlit](https://img.shields.io/badge/Live%20Demo-Streamlit-FF4B4B?logo=streamlit&logoColor=white)](https://practiceleet-preethika.streamlit.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-2ecc71)](LICENSE)

### [View Live Demo](https://practiceleet-preethika.streamlit.app)

</div>

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
- **AI**: Google Gemini API (gemini-2.0-flash-lite)
- **Storage**: localStorage (upgrade to Supabase/PostgreSQL for multi-device)
- **Styling**: Pure CSS (no framework needed)

---

## Streamlit Version (quickest to demo)

The `streamlit_app.py` file is a self-contained single-file version - great for demos and sharing.

### Run locally
```bash
pip install streamlit google-generativeai
export GEMINI_API_KEY=your-gemini-key-here
streamlit run streamlit_app.py
```

### Deploy to Streamlit Cloud (free)
1. Push the repo to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io) -> New app -> select your repo
3. Set `streamlit_app.py` as the main file
4. Under **Advanced settings -> Secrets**, add:
   ```toml
   GEMINI_API_KEY = "your-gemini-key-here"
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
# Edit .env and add your key from https://aistudio.google.com/app/apikey
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
