import React, { useState, useRef, useEffect } from 'react';
import { useClaude } from '../hooks/useClaude';
import { conversationPrompt, hintPrompt } from '../utils/prompts';
import styles from './ChatPanel.module.css';

export default function ChatPanel({ messages, setMessages, config, hintCount, onHint, code, ready }) {
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(!ready);
  const bottomRef = useRef(null);
  const { chat, ask } = useClaude();

  // Track ready changes
  useEffect(() => {
    if (ready) setLoading(false);
  }, [ready]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);

    const sys = conversationPrompt(config);
    try {
      const reply = await chat(sys, newMessages, 700);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: `Warning: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function requestHint() {
    if (loading) return;
    onHint();
    const newHintCount = hintCount + 1;
    const hintMsg = { role: 'user', content: `[Requested hint #${newHintCount}]` };
    const newMessages = [...messages, hintMsg];
    setMessages(newMessages);
    setLoading(true);

    const sys = hintPrompt({ ...config, hintCount: newHintCount, code });
    try {
      const reply = await ask(sys, `Give hint #${newHintCount}.`, 400);
      setMessages([...newMessages, { role: 'assistant', content: ` Hint #${newHintCount}: ${reply}` }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: `Warning: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Filter out the seed message
  const displayMessages = messages.filter(
    m => !(m.role === 'user' && m.content === 'Begin the interview.')
  );

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>AI Interviewer</span>
        <span className={styles.headerSub}>{config.company} - {config.difficulty}</span>
      </div>

      <div className={styles.chatArea}>
        {!ready && displayMessages.length === 0 && (
          <div className={styles.initMsg}>
            <div className={styles.avatar}>AI</div>
            <div className={styles.bubble}>
              <div className="dots"><span /><span /><span /></div>
            </div>
          </div>
        )}

        {displayMessages.map((m, i) => (
          <div key={i} className={`${styles.msg} ${m.role === 'user' ? styles.userMsg : ''}`}>
            <div className={`${styles.avatar} ${m.role === 'user' ? styles.userAvatar : styles.aiAvatar}`}>
              {m.role === 'user' ? 'You' : 'AI'}
            </div>
            <div className={`${styles.bubble} ${m.role === 'user' ? styles.userBubble : ''}`}>
              {m.content.split('\n').map((line, j) => (
                <React.Fragment key={j}>{line}{j < m.content.split('\n').length - 1 && <br />}</React.Fragment>
              ))}
            </div>
          </div>
        ))}

        {loading && displayMessages.length > 0 && (
          <div className={styles.msg}>
            <div className={`${styles.avatar} ${styles.aiAvatar}`}>AI</div>
            <div className={styles.bubble}>
              <div className="dots"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.controls}>
        <button
          className={styles.hintBtn}
          onClick={requestHint}
          disabled={loading}
          title="Request a hint (costs points)"
        >
           Hint {hintCount > 0 ? `(${hintCount} used)` : ''}
        </button>
      </div>

      <div className={styles.inputRow}>
        <textarea
          className={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask a clarifying question... (Enter to send, Shift+Enter for newline)"
          rows={2}
          disabled={loading || !ready}
        />
        <button
          className={styles.sendBtn}
          onClick={sendMessage}
          disabled={loading || !ready || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
