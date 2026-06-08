import React, { useState } from 'react';
import SetupScreen from '../components/SetupScreen';
import InterviewScreen from '../components/InterviewScreen';
import FeedbackScreen from '../components/FeedbackScreen';
import ProgressDashboard from '../components/ProgressDashboard';
import { useProgress } from '../hooks/useProgress';
import styles from './App.module.css';

/**
 * Screens:
 *   setup      -> user picks company / level / topic / difficulty
 *   interview  -> split-panel: AI chat + code editor
 *   feedback   -> post-interview scorecard
 *   progress   -> historical attempts + stats dashboard
 */
export default function App() {
  const [screen, setScreen] = useState('setup');
  const [config, setConfig] = useState(null);        // interview settings chosen at setup
  const [result, setResult] = useState(null);         // feedback data from completed interview
  const { attempts, stats, addAttempt, clearAll } = useProgress();

  function handleStartInterview(cfg) {
    setConfig(cfg);
    setScreen('interview');
  }

  function handleInterviewComplete(feedbackData, attemptMeta) {
    addAttempt(attemptMeta);
    setResult({ ...feedbackData, ...attemptMeta });
    setScreen('feedback');
  }

  function handleRetry() {
    setResult(null);
    setScreen('setup');
  }

  return (
    <div className={styles.app}>
      <nav className={styles.nav}>
        <span className={styles.logo} onClick={() => setScreen('setup')}>
           PracticeLeet
        </span>
        <div className={styles.navLinks}>
          <button
            className={screen === 'progress' ? styles.activeLink : styles.navLink}
            onClick={() => setScreen('progress')}
          >
            Progress {stats ? `- ${stats.totalAttempts}` : ''}
          </button>
        </div>
      </nav>

      <main className={styles.main}>
        {screen === 'setup' && (
          <SetupScreen onStart={handleStartInterview} stats={stats} />
        )}
        {screen === 'interview' && config && (
          <InterviewScreen
            config={config}
            onComplete={handleInterviewComplete}
            onAbort={() => setScreen('setup')}
          />
        )}
        {screen === 'feedback' && result && (
          <FeedbackScreen
            result={result}
            onRetry={handleRetry}
            onViewProgress={() => setScreen('progress')}
          />
        )}
        {screen === 'progress' && (
          <ProgressDashboard
            attempts={attempts}
            stats={stats}
            onClear={clearAll}
            onBack={() => setScreen('setup')}
          />
        )}
      </main>
    </div>
  );
}
