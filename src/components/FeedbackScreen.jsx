import React from 'react';
import styles from './FeedbackScreen.module.css';

const DECISION_STYLE = {
  'Strong Hire': { color: 'var(--green)',  bg: 'var(--green-bg)' },
  'Hire':        { color: 'var(--green)',  bg: 'var(--green-bg)' },
  'Borderline':  { color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
  'No Hire':     { color: 'var(--red)',    bg: 'var(--red-bg)' },
};

function ScoreBar({ label, value }) {
  const pct = (value / 10) * 100;
  const color = value >= 8 ? 'var(--green)' : value >= 6 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div className={styles.scoreBar}>
      <span className={styles.scoreLabel}>{label}</span>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.scoreNum} style={{ color }}>{value}/10</span>
    </div>
  );
}

export default function FeedbackScreen({ result, onRetry, onViewProgress }) {
  const {
    company, level, topic, difficulty, language,
    correctness, complexity, code_quality, communication, edge_cases,
    overall, decision, summary,
    strengths = [], improvements = [],
    optimal_complexity, candidate_complexity, follow_up,
    elapsedSec, hintCount,
  } = result;

  const decStyle = DECISION_STYLE[decision] || DECISION_STYLE['Borderline'];
  const elapsedMin = Math.floor((elapsedSec || 0) / 60);
  const elapsedS   = (elapsedSec || 0) % 60;

  const overallColor = overall >= 8 ? 'var(--green)' : overall >= 6 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.title}>Interview complete</h2>
            <p className={styles.sub}>{company} - {level} - {difficulty} {topic} - {language}</p>
          </div>
          <span
            className={styles.decisionBadge}
            style={{ color: decStyle.color, background: decStyle.bg }}
          >
            {decision}
          </span>
        </div>

        {/* Top metric strip */}
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <span className={styles.metricVal} style={{ color: overallColor }}>{overall}/10</span>
            <span className={styles.metricLabel}>Overall</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricVal}>{elapsedMin}m {elapsedS}s</span>
            <span className={styles.metricLabel}>Time</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricVal}>{hintCount}</span>
            <span className={styles.metricLabel}>Hints used</span>
          </div>
        </div>

        {/* Score bars */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Dimension scores</h3>
          <ScoreBar label="Correctness"    value={correctness}   />
          <ScoreBar label="Complexity"     value={complexity}    />
          <ScoreBar label="Code quality"   value={code_quality}  />
          <ScoreBar label="Communication"  value={communication} />
          <ScoreBar label="Edge cases"     value={edge_cases}    />
        </div>

        {/* Summary */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Summary</h3>
          <p className={styles.bodyText}>{summary}</p>
        </div>

        {/* Complexity */}
        {(optimal_complexity || candidate_complexity) && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Complexity analysis</h3>
            <div className={styles.complexityRow}>
              <div className={styles.complexityCell}>
                <span className={styles.complexityLabel}>Optimal</span>
                <span className={styles.complexityVal}>{optimal_complexity}</span>
              </div>
              <div className={styles.complexityCell}>
                <span className={styles.complexityLabel}>Your solution</span>
                <span className={styles.complexityVal}>{candidate_complexity}</span>
              </div>
            </div>
          </div>
        )}

        {/* Strengths & improvements */}
        <div className={styles.twoCol}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Strengths</h3>
            <ul className={styles.list}>
              {(Array.isArray(strengths) ? strengths : [strengths]).map((s, i) => (
                <li key={i} className={styles.listItem}>OK {s}</li>
              ))}
            </ul>
          </div>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Areas to improve</h3>
            <ul className={styles.list}>
              {(Array.isArray(improvements) ? improvements : [improvements]).map((s, i) => (
                <li key={i} className={styles.listItem}>-> {s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Follow-up question */}
        {follow_up && follow_up !== 'N/A' && (
          <div className={styles.followUp}>
            <span className={styles.followUpLabel}>Follow-up the interviewer would ask:</span>
            <p className={styles.followUpText}>"{follow_up}"</p>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.progressBtn} onClick={onViewProgress}>
            View progress ->
          </button>
          <button className={styles.retryBtn} onClick={onRetry}>
            New interview
          </button>
        </div>
      </div>
    </div>
  );
}
