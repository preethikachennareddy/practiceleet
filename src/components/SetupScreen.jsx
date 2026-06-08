import React, { useState } from 'react';
import { COMPANIES, LEVELS, TOPICS, DIFFICULTIES, LANGUAGES, COMPANY_MODES } from '../utils/companyModes';
import styles from './SetupScreen.module.css';

export default function SetupScreen({ onStart, stats }) {
  const [company,    setCompany]    = useState('Amazon');
  const [level,      setLevel]      = useState('New Grad');
  const [topic,      setTopic]      = useState('Arrays');
  const [difficulty, setDifficulty] = useState('Medium');
  const [language,   setLanguage]   = useState('Python');

  function handleStart() {
    onStart({ company, level, topic, difficulty, language });
  }

  const mode = COMPANY_MODES[company];

  const diffColor = {
    Easy:   'var(--green)',
    Medium: 'var(--yellow)',
    Hard:   'var(--red)',
  }[difficulty];

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>PracticeLeet</h1>
          <p className={styles.sub}>AI-powered mock technical interviews. Choose your target and start coding.</p>
        </div>

        {/* Stats strip */}
        {stats && (
          <div className={styles.statsStrip}>
            <div className={styles.stat}>
              <span className={styles.statVal}>{stats.totalAttempts}</span>
              <span className={styles.statLabel}>Attempts</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statVal}>{stats.avgScore}/10</span>
              <span className={styles.statLabel}>Avg score</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statVal}>{stats.streak}</span>
              <span className={styles.statLabel}>Day streak</span>
            </div>
            {stats.topicAverages[0] && (
              <div className={styles.stat}>
                <span className={styles.statVal} style={{ color: 'var(--red)' }}>
                  {stats.topicAverages[0].topic}
                </span>
                <span className={styles.statLabel}>Weakest topic</span>
              </div>
            )}
          </div>
        )}

        {/* Company selector */}
        <div className={styles.section}>
          <label className={styles.label}>Target company</label>
          <div className={styles.companyGrid}>
            {COMPANIES.map(c => (
              <button
                key={c}
                className={`${styles.companyBtn} ${company === c ? styles.companyActive : ''}`}
                onClick={() => setCompany(c)}
              >
                {c}
              </button>
            ))}
          </div>
          {mode && (
            <p className={styles.modeHint}>
              {company === 'Amazon' && ' Includes Leadership Principle question after coding.'}
              {company === 'Google' && ' Focus on optimal complexity and communication.'}
              {company === 'Meta'   && ' Speed and pattern recognition emphasized.'}
              {company === 'Microsoft' && ' Collaborative style - adapts mid-problem.'}
              {company === 'Apple' && ' Code quality and testing mindset.'}
            </p>
          )}
        </div>

        {/* Grid selectors */}
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>Level</label>
            <select value={level} onChange={e => setLevel(e.target.value)} className={styles.select}>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Topic</label>
            <select value={topic} onChange={e => setTopic(e.target.value)} className={styles.select}>
              {TOPICS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Difficulty</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className={styles.select}
              style={{ color: diffColor }}
            >
              {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className={styles.select}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <button className={styles.startBtn} onClick={handleStart}>
          Start Interview ->
        </button>

        <p className={styles.footnote}>
          Powered by Claude AI - Your code and conversation are processed by the Anthropic API
        </p>
      </div>
    </div>
  );
}
