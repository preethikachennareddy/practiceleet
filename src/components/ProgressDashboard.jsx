import React, { useState } from 'react';
import styles from './ProgressDashboard.module.css';

const DIFF_COLOR = {
  Easy:   'var(--green)',
  Medium: 'var(--yellow)',
  Hard:   'var(--red)',
};

const DECISION_COLOR = {
  'Strong Hire': 'var(--green)',
  'Hire':        'var(--green)',
  'Borderline':  'var(--yellow)',
  'No Hire':     'var(--red)',
};

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ProgressDashboard({ attempts, stats, onClear, onBack }) {
  const [confirmClear, setConfirmClear] = useState(false);

  if (!attempts.length) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyIcon}></p>
        <h2>No attempts yet</h2>
        <p className={styles.emptySub}>Complete your first interview to start tracking progress.</p>
        <button className={styles.backBtn} onClick={onBack}>Start an interview -></button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h2 className={styles.title}>Progress</h2>
            <p className={styles.sub}>{stats.totalAttempts} interview{stats.totalAttempts !== 1 ? 's' : ''} completed</p>
          </div>
          <button className={styles.backBtn} onClick={onBack}><- New interview</button>
        </div>

        {/* Stats grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statVal}>{stats.avgScore}/10</span>
            <span className={styles.statLabel}>Average score</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statVal}>{stats.streak}</span>
            <span className={styles.statLabel}>Day streak</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statVal}>{stats.totalAttempts}</span>
            <span className={styles.statLabel}>Total attempts</span>
          </div>
          {stats.topicAverages[0] && (
            <div className={styles.statCard}>
              <span className={styles.statVal} style={{ color: 'var(--red)', fontSize: 14 }}>
                {stats.topicAverages[0].topic}
              </span>
              <span className={styles.statLabel}>Weakest topic ({stats.topicAverages[0].avg}/10)</span>
            </div>
          )}
        </div>

        {/* Topic breakdown */}
        {stats.topicAverages.length > 1 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Topic averages</h3>
            <div className={styles.topicBars}>
              {stats.topicAverages.map(({ topic, avg, count }) => {
                const pct = (avg / 10) * 100;
                const color = avg >= 8 ? 'var(--green)' : avg >= 6 ? 'var(--yellow)' : 'var(--red)';
                return (
                  <div key={topic} className={styles.topicRow}>
                    <span className={styles.topicName}>{topic}</span>
                    <div className={styles.track}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
                    </div>
                    <span className={styles.topicScore} style={{ color }}>{avg}</span>
                    <span className={styles.topicCount}>×{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Attempts history */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent attempts</h3>
          <div className={styles.attemptList}>
            {attempts.slice(0, 50).map(a => (
              <div key={a.id} className={styles.attemptRow}>
                <div className={styles.attemptLeft}>
                  <span className={styles.attemptScore} style={{ color: (a.scores?.overall >= 8 ? 'var(--green)' : a.scores?.overall >= 6 ? 'var(--yellow)' : 'var(--red)') }}>
                    {a.scores?.overall ?? '?'}/10
                  </span>
                  <div className={styles.attemptMeta}>
                    <span>{a.company} - {a.topic}</span>
                    <span style={{ color: DIFF_COLOR[a.difficulty] }}>{a.difficulty}</span>
                  </div>
                </div>
                <div className={styles.attemptRight}>
                  {a.decision && (
                    <span style={{ color: DECISION_COLOR[a.decision] ?? 'var(--text-2)', fontSize: 12 }}>
                      {a.decision}
                    </span>
                  )}
                  <span className={styles.attemptDate}>{fmt(a.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clear data */}
        <div className={styles.dangerZone}>
          {confirmClear ? (
            <div className={styles.confirmRow}>
              <span className={styles.confirmText}>Delete all {attempts.length} attempts?</span>
              <button className={styles.confirmBtn} onClick={() => { onClear(); setConfirmClear(false); }}>Yes, delete</button>
              <button className={styles.cancelBtn} onClick={() => setConfirmClear(false)}>Cancel</button>
            </div>
          ) : (
            <button className={styles.clearBtn} onClick={() => setConfirmClear(true)}>
              Clear all progress
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
