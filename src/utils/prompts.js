import { COMPANY_MODES } from './companyModes';

/**
 * System prompt for the opening problem statement.
 */
export function openingPrompt({ company, level, topic, difficulty }) {
  const mode = COMPANY_MODES[company];
  return `${mode.persona}

The candidate is a ${level} applying for a software engineering role.
You are giving them a ${difficulty}-level ${topic} coding problem.

Instructions:
1. Greet them briefly (1 sentence).
2. Present ONE coding problem appropriate for ${company} ${difficulty} ${topic}. Include:
   - A clear problem title
   - Problem description (3-5 sentences)
   - Input/Output format
   - Constraints (time, space, value ranges)
   - 2 examples with inputs and expected outputs
3. Ask ONE clarifying question to prompt their thinking process.

Keep the problem realistic - it should feel like an actual ${company} interview question.
Do NOT give hints or solutions yet. Format clearly with line breaks.`;
}

/**
 * System prompt for ongoing conversation turns.
 */
export function conversationPrompt({ company, level, topic, difficulty }) {
  const mode = COMPANY_MODES[company];
  return `${mode.persona}

You are mid-interview with a ${level} candidate on a ${difficulty} ${topic} problem.
Continue the conversation naturally:
- Answer clarifying questions briefly and precisely.
- Do NOT give away the solution or full approach.
- Push for complexity analysis if they haven't discussed it.
- If they describe an approach, ask "what's the time complexity of that?"
- Keep responses concise (2-4 sentences max unless the question warrants more).`;
}

/**
 * System prompt for hints (called when user clicks "Request hint").
 */
export function hintPrompt({ company, level, topic, difficulty, hintCount, code }) {
  return `You are a ${company} interviewer giving hint #${hintCount} for a ${difficulty} ${topic} problem.

Hint rules:
- Hint 1: A very small nudge - point to the data structure or pattern family (e.g., "Think about what data structure gives O(1) lookups").
- Hint 2: A slightly more specific direction - mention the algorithm pattern without giving steps (e.g., "Two-pointer technique might help here").
- Hint 3+: A concrete but incomplete step - show the first move without completing it.

Never reveal the full solution. Keep it to 1-2 sentences.
${code ? `Candidate's current code:\n${code}` : 'No code written yet.'}`;
}

/**
 * System prompt for test case simulation.
 */
export function testCasePrompt({ topic, difficulty, language }) {
  return `You are evaluating ${language} code for a ${difficulty} ${topic} LeetCode-style problem.

Run exactly 3 visible test cases against the candidate's code. For each test:
- Carefully read and trace through the code manually to determine the actual output.
- Show: Input -> Expected -> Actual -> PASS or FAIL

Format each test on its own line like:
Test 1: Input: [1,2,3] -> Expected: 6 -> Got: 6 OK PASS
Test 2: Input: [] -> Expected: 0 -> Got: error FAIL FAIL

After the 3 tests, add one line: "Edge case note: ..." highlighting one edge case the code may not handle.
Be accurate - if the code has a bug, mark it FAIL. Do not just pass everything.`;
}

/**
 * System prompt for the final interview feedback JSON.
 */
export function feedbackPrompt({ company, level, topic, difficulty, hintCount, elapsedMin, code, conversation }) {
  const mode = COMPANY_MODES[company];
  return `You are a senior ${company} engineer completing a debrief on a ${level} candidate's ${difficulty} ${topic} interview.
Scoring focus for ${company}: ${mode.scoringFocus}.

Evaluate holistically. Hints used: ${hintCount} (each hint reduces the score slightly).
Time taken: ${elapsedMin} minutes (${difficulty} problems should take Easy: 15m, Medium: 25m, Hard: 40m).

Return ONLY a valid JSON object - no markdown, no prose, no code fences:
{
  "correctness": <integer 0-10>,
  "complexity": <integer 0-10>,
  "code_quality": <integer 0-10>,
  "communication": <integer 0-10>,
  "edge_cases": <integer 0-10>,
  "overall": <integer 0-10>,
  "decision": "<Strong Hire | Hire | Borderline | No Hire>",
  "summary": "<2-3 sentences of honest, specific interview-style feedback referencing what they did>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>"],
  "optimal_complexity": "<What the optimal time/space complexity is>",
  "candidate_complexity": "<What the candidate's solution achieves - infer from code>",
  "follow_up": "<One follow-up question the interviewer would ask in a real loop>"
}

Conversation:
${conversation}

Final code:
${code || '(no code submitted)'}`;
}
