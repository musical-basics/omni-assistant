import OpenAI from "openai";
import type { ConversationState } from "./stateMachine";

const ownerName = process.env.OWNER_NAME || "the owner";

const BASE_PROMPT = `You are drafting text messages for ${ownerName}. Be concise, use lowercase formatting mostly, avoid emojis unless mirroring the sender. Do not sound enthusiastic or like a customer service bot. Keep it dry but polite.`;

const STATE_PROMPTS: Record<ConversationState, string> = {
  BANTER:
    "Acknowledge what they said. Ask one light question to keep the conversation going. Keep it under 2 sentences.",

  LOGISTICS_PIVOT:
    "Acknowledge their last message briefly. Then, immediately propose meeting up. Offer exactly two options: Drinks this Thursday at [Venue A] or Coffee this Sunday at [Venue B]. Be direct.",

  SCHEDULING:
    "They have shown interest in meeting. Cross-reference their response with these rules: [Rule 1: I am free Thurs after 7PM. Rule 2: I am free Sunday 1PM-4PM]. Suggest a specific time based on these rules.",

  LOCKED: "",
};

export function buildSystemPrompt(state: ConversationState): string {
  const stateAppend = STATE_PROMPTS[state];
  if (!stateAppend) return BASE_PROMPT;
  return `${BASE_PROMPT}\n\n${stateAppend}`;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateReply(
  systemPrompt: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
    ],
    max_tokens: 150,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content?.trim() || "";
}
