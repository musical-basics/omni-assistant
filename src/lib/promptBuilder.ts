import OpenAI from "openai";
import type { ConversationState } from "./stateMachine";
import type { RelationshipType } from "@/types";

const ownerName = process.env.OWNER_NAME || "the owner";

const BASE_PROMPT = `You are drafting text messages for ${ownerName}. Be concise, use lowercase formatting mostly, avoid emojis unless mirroring the sender. Do not sound enthusiastic or like a customer service bot. Keep it dry but polite.`;

// State-based prompts (used only for DATING_PIPELINE funnel)
const STATE_PROMPTS: Record<ConversationState, string> = {
  BANTER:
    "Acknowledge what they said. Ask one light question to keep the conversation going. Keep it under 2 sentences.",

  LOGISTICS_PIVOT:
    "Acknowledge their last message briefly. Then, immediately propose meeting up. Offer exactly two options: Drinks this Thursday at [Venue A] or Coffee this Sunday at [Venue B]. Be direct.",

  SCHEDULING:
    "They have shown interest in meeting. Cross-reference their response with these rules: [Rule 1: I am free Thurs after 7PM. Rule 2: I am free Sunday 1PM-4PM]. Suggest a specific time based on these rules.",

  LOCKED: "",
};

// Relationship-based persona prompts
const RELATIONSHIP_PROMPTS: Record<RelationshipType, string> = {
  DATING_PIPELINE: "", // Falls through to state-based prompts above
  STUDENT_LEAD:
    "I am a professional piano teacher. Tone is warm but professional. Goal is to answer questions, quote $80/hr, and offer a 30-min trial lesson on Tuesday/Wednesday.",
  ACTIVE_STUDENT:
    "This is an active student. Tone is encouraging and supportive. Handle scheduling, lesson notes, and practice reminders.",
  FRIEND:
    "Tone is incredibly casual. No agenda, just match their energy. Never try to force a schedule.",
  VIP:
    "This is a VIP contact. Tone is warm, attentive, and high-priority. Be responsive and accommodating.",
  COWORKER:
    "Tone is professional and brief. Acknowledge data, confirm receipt of files.",
  HIRED_HELP:
    "Tone is direct and transactional. Acknowledge updates, answer clarifying questions cleanly.",
};

/**
 * Builds the system prompt based on relationship type and conversation state.
 * - DATING_PIPELINE uses the state-based funnel prompts (BANTER/LOGISTICS_PIVOT/SCHEDULING).
 * - All other types use their relationship-specific persona prompt.
 */
export function buildSystemPrompt(
  state: ConversationState,
  relationshipType: RelationshipType
): string {
  // For DATING_PIPELINE, use the existing state-based funnel
  if (relationshipType === "DATING_PIPELINE") {
    const stateAppend = STATE_PROMPTS[state];
    if (!stateAppend) return BASE_PROMPT;
    return `${BASE_PROMPT}\n\n${stateAppend}`;
  }

  // For STUDENT_LEAD in funnel states, combine relationship persona + state prompt
  if (relationshipType === "STUDENT_LEAD" && state !== "BANTER") {
    const relationshipAppend = RELATIONSHIP_PROMPTS[relationshipType];
    const stateAppend = STATE_PROMPTS[state];
    const parts = [BASE_PROMPT, relationshipAppend, stateAppend].filter(Boolean);
    return parts.join("\n\n");
  }

  // For all other types, use the relationship-specific persona only
  const relationshipAppend = RELATIONSHIP_PROMPTS[relationshipType];
  if (!relationshipAppend) return BASE_PROMPT;
  return `${BASE_PROMPT}\n\n${relationshipAppend}`;
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
