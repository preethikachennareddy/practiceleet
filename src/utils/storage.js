const STORAGE_KEY = 'practiceleet_progress';

/**
 * Load all saved attempts from localStorage.
 * @returns {Array} Array of attempt objects
 */
export function loadAttempts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save a completed attempt.
 * @param {Object} attempt
 */
export function saveAttempt(attempt) {
  try {
    const attempts = loadAttempts();
    attempts.unshift({ ...attempt, id: Date.now(), date: new Date().toISOString() });
    // Keep last 200 attempts
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts.slice(0, 200)));
  } catch {
    // Storage full or unavailable - silently ignore
  }
}

/**
 * Clear all saved progress.
 */
export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Compute aggregate stats from all attempts.
 * @returns {Object} Stats object
 */
export function computeStats(attempts) {
  if (!attempts.length) return null;

  const topicMap = {};
  const companyMap = {};
  let totalScore = 0;
  let streak = 0;
  let streakActive = true;

  // Sort attempts by date desc (already stored that way, but just in case)
  const sorted = [...attempts].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Streak: count consecutive days with at least one attempt
  const daysSeen = new Set();
  sorted.forEach(a => {
    const day = a.date.slice(0, 10);
    daysSeen.add(day);
  });

  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (daysSeen.has(key)) {
      if (streakActive) streak++;
    } else {
      streakActive = false;
    }
  }

  attempts.forEach(a => {
    totalScore += a.scores?.overall || 0;

    // Topic weak-point tracking
    if (a.topic) {
      if (!topicMap[a.topic]) topicMap[a.topic] = { total: 0, count: 0 };
      topicMap[a.topic].total += a.scores?.overall || 0;
      topicMap[a.topic].count += 1;
    }

    // Company tracking
    if (a.company) {
      if (!companyMap[a.company]) companyMap[a.company] = 0;
      companyMap[a.company] += 1;
    }
  });

  const avgScore = (totalScore / attempts.length).toFixed(1);

  // Build topic averages sorted worst first
  const topicAverages = Object.entries(topicMap)
    .map(([topic, { total, count }]) => ({
      topic,
      avg: parseFloat((total / count).toFixed(1)),
      count,
    }))
    .sort((a, b) => a.avg - b.avg);

  return {
    totalAttempts: attempts.length,
    avgScore: parseFloat(avgScore),
    streak,
    topicAverages,
    companyMap,
  };
}
