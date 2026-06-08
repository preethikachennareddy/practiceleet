import React, { useState } from 'react';
import { useClaude } from '../hooks/useClaude';
import { testCasePrompt } from '../utils/prompts';
import styles from './CodePanel.module.css';

const STARTERS = {
  Python:     '# Write your solution here\n\ndef solution():\n    pass\n',
  Java:       '// Write your solution here\n\nclass Solution {\n    public void solve() {\n        // your code\n    }\n}\n',
  'C++':      '// Write your solution here\n\n#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solution() {\n    // your code\n}\n',
  JavaScript: '// Write your solution here\n\nfunction solution() {\n    // your code\n}\n',
  Go:         '// Write your solution here\n\npackage main\n\nfunc solution() {\n    // your code\n}\n',
};

export default function CodePanel({ code, setCode, language, config, onSubmit, submitting }) {
  const [testOutput, setTestOutput] = useState('');
  const [running, setRunning]       = useState(false);
  const { ask } = useClaude();

  // Initialize with starter if code is empty
  const displayCode = code || STARTERS[language] || '';

  async function runTests() {
    if (running || !displayCode.trim()) return;
    setRunning(true);
    setTestOutput('Running test cases...');
    const sys = testCasePrompt({ topic: config.topic, difficulty: config.difficulty, language });
    try {
      const result = await ask(sys, `Code:\n${displayCode}`, 800);
      setTestOutput(result);
    } catch (err) {
      setTestOutput(`Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  }

  function formatTestOutput(text) {
    return text.split('\n').map((line, i) => {
      const isPass = line.includes('PASS') || line.includes('OK');
      const isFail = line.includes('FAIL') || line.includes('FAIL');
      return (
        <div
          key={i}
          style={{ color: isPass ? 'var(--green)' : isFail ? 'var(--red)' : 'var(--text-2)' }}
        >
          {line || '\u00A0'}
        </div>
      );
    });
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Code Editor</span>
        <span className={styles.langTag}>{language}</span>
      </div>

      <textarea
        className={styles.editor}
        value={displayCode}
        onChange={e => setCode(e.target.value)}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        placeholder={`Write your ${language} solution here...`}
      />

      {testOutput && (
        <div className={styles.testOutput}>
          <div className={styles.testHeader}>Test results</div>
          <div className={styles.testLines}>{formatTestOutput(testOutput)}</div>
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.runBtn}
          onClick={runTests}
          disabled={running || submitting}
        >
          {running ? '... Running...' : ' Run tests'}
        </button>
        <button
          className={styles.submitBtn}
          onClick={onSubmit}
          disabled={submitting || running}
        >
          {submitting ? (
            <><span className="dots" style={{ display:'inline-flex', gap:3 }}><span/><span/><span/></span> Reviewing...</>
          ) : (
            'OK Submit & review'
          )}
        </button>
      </div>
    </div>
  );
}
