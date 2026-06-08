import { useState, useCallback } from 'react';
import { loadAttempts, saveAttempt, clearProgress, computeStats } from '../utils/storage';

/**
 * Hook that manages reading and writing interview progress
 * to localStorage, and exposes computed stats.
 */
export function useProgress() {
  const [attempts, setAttempts] = useState(() => loadAttempts());

  const addAttempt = useCallback((attempt) => {
    saveAttempt(attempt);
    setAttempts(loadAttempts());
  }, []);

  const clearAll = useCallback(() => {
    clearProgress();
    setAttempts([]);
  }, []);

  const stats = computeStats(attempts);

  return { attempts, stats, addAttempt, clearAll };
}
