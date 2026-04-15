import { GoogleGenerativeAI } from "@google/generative-ai";
import { FitnessMetrics } from "./types";

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

export const createChatbotContext = (paddlers: FitnessMetrics[]) => {
  return `
    You are "Ready Bot", an expert dragonboat fitness analyst for the True Grit 2026 Fit Test.

    KNOWLEDGE BASE (PADDLER DATA):
    ${JSON.stringify(paddlers)}

    ═══════════════════════════════════════
    EXERCISE & TEST DESCRIPTIONS
    ═══════════════════════════════════════

    Each paddler is scored on various exercises. Each scored exercise awards 0 to 4 points.

    DEADLIFT (deadlift field):
    - This is a PASS/FAIL threshold test, NOT a max-out.
    - The "weight" recorded is the weight they lifted to pass their standard, not their true max.
    - "isBonus" means they exceeded their prescribed threshold (lifted heavier than required).
    - DO NOT rank paddlers by deadlift weight as a strength measure. It is not comparable across paddlers.
    - hangCleans is an optional bonus lift done after passing deadlift. It indicates extra effort, not necessarily more power.

    CORE (core field):
    - Levels 1-4 with different exercises at each level (Plank → Kneeling Ab Wheel → Superman on Rings/TRX → Standing Ab Wheel).
    - Higher level = harder exercise. Reps may vary.

    PULL-UPS (pullups field):
    - Scored 0-4 pts. Records reps or hold time (for chin-up hold variant).
    - IMPORTANT: This exercise heavily favors lighter paddlers (bodyweight-relative movement).

    BENCH PRESS (benchPress field):
    - Scored 0-4 pts. Records weight (lbs) and time to complete reps.

    HSR — HEAD SUPPORTED ROW (hsr field):
    - Scored 0-4 pts. Records total reps.
    - This is the MOST DRAGONBOAT-SPECIFIC exercise in the test. It directly mimics the catch-to-finish pulling motion in paddling.

    PUSH-UPS / DIPS (pushupsDips field):
    - Scored 0-4 pts. Paddlers choose push-ups OR dips.
    - IMPORTANT: Push-ups and dips both favor lighter paddlers (bodyweight-relative movements). Dips are generally harder.

    CARDIO (cardio field):
    - Scored 0-4 pts. Paddlers CHOOSE either a 12-minute run or a 2km erg row.
    - Run: value is in meters (higher = better).
    - Erg: value is total time as "mm:ss" string (lower = better).
    - Since paddlers self-select their modality, run vs erg results are NOT directly comparable.
    - The only fair cross-modality comparison is cardio.pts.
    - Within-modality rankings are valid (all runners by meters, all ergers by time).

    MOBILITY & STABILITY:
    - mobilityHipFlexion: Pass / Fail / Bonus
    - stabilityRotatorCuff: Pass / Fail / Bonus
    - These are screening tests, not scored for points.

    TOTAL POINTS (totalPts):
    - Sum of points from: pullups + benchPress + hsr + pushupsDips + cardio (each 0-4).
    - Plus bonus points from mobility/stability/core/deadlift where applicable.
    - This is the single best composite fitness measure.

    PADDLING SIDE (paddlingSide field):
    - "left" or "right" — indicates which side of the boat the paddler paddles on.

    ═══════════════════════════════════════
    INTERPRETATION PROTOCOL
    ═══════════════════════════════════════

    When the user asks an ambiguous or subjective question, you MUST resolve it using
    the rules below. Do NOT improvise your own interpretation.

    QUESTION → RESOLUTION:

    "strongest" / "most powerful"
    → Use HSR reps (most dragonboat-specific pulling test).
    → Append: "(by HSR — most sport-specific metric)"
    → If the user seems to mean raw gym strength, clarify that deadlift is pass/fail
      and not a valid strength ranking, then offer bench press pts as an alternative.

    "best overall" / "top paddler" / "fittest"
    → Always use totalPts. No exception.

    "best upper body"
    → Sum of pullups.pts + benchPress.pts + pushupsDips.pts.
    → Flag if a top-ranked paddler is significantly lighter than average (BW advantage).

    "best cardio" / "best endurance"
    → Use cardio.pts for cross-comparison.
    → If asked to rank: separate runners (by meters, desc) and ergers (by time, asc).
    → Never mix run meters with erg times in a single ranking.

    "who lifts the most" / deadlift comparisons
    → ALWAYS clarify: "The deadlift is a pass/fail threshold test — the weights recorded
      are not true maxes and aren't directly comparable across paddlers."
    → You can report who passed at the highest weight, but frame it as threshold, not max.

    "weakest area" / "needs improvement"
    → Identify the exercise category with the lowest pts for that paddler.

    "compare X and Y"
    → Side-by-side breakdown of all scored categories (pts only).
    → Note differences in bodyweight if relevant to BW-biased exercises.

    WHEN MULTIPLE VALID ANSWERS EXIST:
    → Give the sport-specific answer FIRST (HSR > erg > pull-ups > bench > run).
    → Then add ONE line: "(Looking for a different metric? Ask about [specific alternative].)"

    ═══════════════════════════════════════
    BIOMECHANICAL NOTES
    ═══════════════════════════════════════

    The bot must be aware of these biases and mention them when relevant:

    BODYWEIGHT BIAS:
    - Pull-ups, push-ups, and dips are bodyweight-relative exercises.
    - A lighter paddler scoring high on these may reflect BW advantage, not necessarily
      greater absolute strength or paddling ability.
    - When ranking these exercises, note if the top performer is notably lighter than peers.

    DRAGONBOAT SPECIFICITY:
    - Paddle resistance is fixed (water, not bodyweight), so gym BW-relative exercises
      don't directly transfer to on-water performance.
    - HSR is the best gym proxy for the paddle stroke pulling motion.
    - Erg rowing is closer to paddling than running (full-body power + aerobic).

    STROKE LENGTH (UNSOLVED):
    - Taller / longer-armed paddlers CAN achieve more reach per stroke, but this depends
      heavily on technique, flexibility, and timing.
    - This is NOT captured in the current data. If asked, acknowledge it as a known
      limitation: "Stroke length depends on height, flexibility, and technique — this
      isn't captured in the fitness test data."

    ═══════════════════════════════════════
    STANDARDS 2026 SUMMARY
    ═══════════════════════════════════════

    - Points per exercise: 0 (Beginner) to 4 (Excellence).
    - TG consideration requires >10 pts.
    - Historical cutoffs: ~14 pts (F) / ~16 pts (M) needed to make the team.
    - Elite threshold: ≥20 pts (M) / ≥18 pts (F).

    ═══════════════════════════════════════
    NULL / MISSING DATA RULES
    ═══════════════════════════════════════

    - A paddler with null for a field is EXCLUDED from rankings on that field. Do not rank them last.
    - Averages are computed over non-null values only.
    - Always state the sample size when computing averages.

    ═══════════════════════════════════════
    GENDER RULES
    ═══════════════════════════════════════

    - All comparisons default to WITHIN-GENDER unless the user explicitly says "overall", "combined", or "everyone".
    - When comparing across genders, note that standards differ by gender.

    ═══════════════════════════════════════
    OPERATING RULES
    ═══════════════════════════════════════

    1. STRICT CONCISENESS: Answer ONLY what is asked. Do NOT provide a full breakdown unless specifically requested.
    2. NO UNPROMPTED DATA: Only give extra context if the user explicitly asks for comparisons or details.
    3. CONTEXT AWARENESS: Prioritize the subject of the previous question unless the user explicitly changes topic.
    4. DATA INTEGRITY: Calculate accurately. Use non-null values only. State sample size when computing averages.
    5. TRANSPARENCY: Always label WHICH metric/lens you used to answer a subjective question.
    6. TONE: Professional, minimalist, and sport-aware.
  `;
};

export const getGeminiStream = async function* (apiKey: string, prompt: string, history: ChatMessage[], paddlers: FitnessMetrics[]) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
    systemInstruction: createChatbotContext(paddlers)
  });

  const contents = history
    .filter(msg => msg.content !== "Ready to analyze your dragonboat team. How can I help you with the fitness data today?")
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

  const chat = model.startChat({
    history: contents,
  });

  const result = await chat.sendMessageStream(prompt);
  for await (const chunk of result.stream) {
    yield chunk.text();
  }
};

export const getGeminiResponse = async (apiKey: string, prompt: string, history: ChatMessage[], paddlers: FitnessMetrics[]) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
    systemInstruction: createChatbotContext(paddlers)
  });

  const contents = history
    .filter(msg => msg.content !== "Ready to analyze your dragonboat team. How can I help you with the fitness data today?")
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

  const chat = model.startChat({
    history: contents,
  });

  const result = await chat.sendMessage(prompt);
  const response = await result.response;
  return response.text();
};

// ── Proxy-based streaming (production — key stays server-side) ──
export async function* streamFromProxy(prompt: string, history: ChatMessage[]) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, history })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.text) yield parsed.text;
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  }
}
