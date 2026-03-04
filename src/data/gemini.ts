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

    STANDARDS 2026 SUMMARY:
    - Points: 0 (Beginner) to 4 (Excellence).
    - Thresholds: TG consideration requires >10 pts. History shows 14(F)/16(M) needed to pass.
    
    OPERATING RULES:
    1. STRICT CONCISENESS: Answer ONLY what is asked. If asked for an average, give just the number and what it is (e.g., "The average is 22.6"). Do NOT provide a full breakdown (sample size, top/bot, benchmarks) unless specifically requested.
    2. NO UNPROMPTED DATA: Avoid information flooding. Only give extra context (like top performers or outliers) if the user's question explicitly asks for a comparison or details.
    3. CONTEXT AWARENESS: Always prioritize the subject of the previous question unless the user explicitly changes the topic.
    4. DATA INTEGRITY: Calculate averages accurately based on gender and exercise type. Mention the total count only if it adds necessary context to the answer.
    5. TONE: Professional and minimalist.
  `;
};

export const getGeminiResponse = async (apiKey: string, prompt: string, history: ChatMessage[], paddlers: FitnessMetrics[]) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    systemInstruction: createChatbotContext(paddlers)
  });

  // Convert app history format to Gemini history format
  // Note: We skip the very first 'bot' greeting usually, and Gemini history should start with 'user' or 'model'
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
