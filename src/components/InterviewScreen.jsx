import React, { useState, useEffect, useRef } from 'react';
import ChatPanel from './ChatPanel';
import CodePanel from './CodePanel';
import { useTimer } from '../hooks/useTimer';
import { useClaude } from '../hooks/useClaude';
import { COMPANY_MODES } from '../utils/companyModes';
import { openingPrompt, feedbackPrompt } from '../utils/prompts';
import styles from './InterviewScreen.module.css';

export default function InterviewScreen({ config, onComplete, onAbort }) {
  const { company, level, topic, difficulty, language } = config;

  const [messages, setMessages]   = useState([]);   // { role, content }
  const [hintCount, setHintCount] = useState(0);
  const [code, setCode]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiReady, setAiReady]     = useState(false);

  const { elapsed, elapsedMin, formatted, start, stop } = useTimer();
  const { ask, cancel } = useClaude();
  const initDone = useRef(false);

  const mode = COMPANY_MODES[company];

  const diffBadge = { Easy: 'badge-green', Medium: 'badge-yellow', Hard: 'badge-red' }[difficulty];

  // Start the interview on mount
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    start();

    const sys = openingPrompt({ company, level, topic, difficulty });
    ask(sys, 'Begin the interview.', 1200).then(reply => {
      setMessages([
        { role: 'user',      content: 'Begin the interview.' },
        { role: 'assistant', content: reply },
      ]);
      setAiReady(true);
    }).catch(err => {
      setMessages([
        { role: 'assistant', content: `Warning: Error connecting to Claude: ${err.message}` },
      ]);
      setAiReady(true);
    });

    return () => cancel();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit() {
    if (submitting) return;
    stop();
    setSubmitting(true);

    const conv = messages
      .filter(m => m.role !== 'user' || m.content !== 'Begin the interview.')
      .map(m => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n\n');

    const sys = feedbackPrompt({ company, level, topic, difficulty, hintCount, elapsedMin, code, conversation: conv });

    let raw = '';
    try {
      raw = await ask(sys, 'Generate the feedback JSON.', 1400);
      // Strip potential markdown code fences
      raw = raw.replace(/```json|```/g, '').trim();
      const feedback = JSON.parse(raw);
      onComplete(feedback, {
        company, level, topic, difficulty, language,
        elapsedSec: elapsed, hintCount,
        scores: {
          overall: feedback.overall,
          correctness: feedback.correctness,
          complexity: feedback.complexity,
          code_quality: feedback.code_quality,
          communication: feedback.communication,
          edge_cases: feedback.edge_cases,
        },
        decision: feedback.decision,
        code,
      });
    } catch (err) {
      // Fallback if JSON parse fails
      onComplete(
        {
          correctness: 5, complexity: 5, code_quality: 5,
          communication: 5, edge_cases: 5, overall: 5,
          decision: 'Borderline',
          summary: raw || 'Could not parse feedback. Please try again.',
          strengths: ['Attempted a solution'],
          improvements: ['Try again for detailed feedback'],
          optimal_complexity: 'Unknown',
          candidate_complexity: 'Unknown',
          follow_up: 'N/A',
        },
        { company, level, topic, difficulty, language, elapsedSec: elapsed, hintCount, scores: { overall: 5 }, code }
      );
    }
  }

  function handleHint() {
    setHintCount(h => h + 1);
  }

  return (
    <div className={styles.screen}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <span className={`badge ${mode.badge}`}>{company}</span>
          <span className={`badge ${diffBadge}`}>{difficulty}</span>
          <span className="badge badge-gray">{topic}</span>
          <span className="badge badge-gray">{language}</span>
        </div>
        <div className={styles.topRight}>
          {hintCount > 0 && (
            <span className="badge badge-yellow"> {hintCount} hint{hintCount > 1 ? 's' : ''}</span>
          )}
          <span className={styles.timer}>{formatted}</span>
          <button className={styles.abortBtn} onClick={onAbort}>x End</button>
        </div>
      </div>

      {/* Split panels */}
      <div className={styles.split}>
        <ChatPanel
          messages={messages}
          setMessages={setMessages}
          config={config}
          hintCount={hintCount}
          onHint={handleHint}
          code={code}
          ready={aiReady}
        />
        <CodePanel
          code={code}
          setCode={setCode}
          language={language}
          config={config}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
