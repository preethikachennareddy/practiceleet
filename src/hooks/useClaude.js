import { useCallback, useRef } from 'react';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL   = 'claude-sonnet-4-20250514';

/**
 * Hook that wraps the Anthropic Claude API.
 * Exposes two functions:
 *   - ask(system, userMessage)              -> single-turn
 *   - chat(system, messagesArray)           -> multi-turn (full history)
 *
 * The API key is read from REACT_APP_ANTHROPIC_API_KEY.
 *
 * NOTE: For production, proxy these calls through your own backend
 * so the API key is never exposed to the client.
 */
export function useClaude() {
  const abortRef = useRef(null);

  const callAPI = useCallback(async ({ system, messages, maxTokens = 1000 }) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error('Missing API key. Add REACT_APP_ANTHROPIC_API_KEY to your .env file.');
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      signal: abortRef.current.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text ?? '';
  }, []);

  /**
   * Single-turn: one system prompt + one user message.
   */
  const ask = useCallback(
    (system, userMessage, maxTokens = 1000) =>
      callAPI({ system, messages: [{ role: 'user', content: userMessage }], maxTokens }),
    [callAPI]
  );

  /**
   * Multi-turn: full conversation history.
   * `messages` should be an array of { role: 'user'|'assistant', content: string }.
   */
  const chat = useCallback(
    (system, messages, maxTokens = 700) =>
      callAPI({ system, messages, maxTokens }),
    [callAPI]
  );

  /**
   * Cancel any pending request.
   */
  const cancel = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
  }, []);

  return { ask, chat, cancel };
}
