import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { RelationshipType } from "@/types";

export type ConversationState =
  | "BANTER"
  | "LOGISTICS_PIVOT"
  | "SCHEDULING"
  | "LOCKED";

const PIVOT_THRESHOLD = 4;

// Only these relationship types go through the forced funnel
const FUNNEL_TYPES: RelationshipType[] = ["DATING_PIPELINE", "STUDENT_LEAD"];

/**
 * Evaluates the current conversation state and returns the next state.
 * The pivot trigger only applies to DATING_PIPELINE and STUDENT_LEAD.
 * All other relationship types stay in BANTER permanently.
 */
export function evaluateTransition(
  currentState: ConversationState,
  messageCount: number,
  latestMessage: string,
  relationshipType: RelationshipType
): ConversationState {
  // Non-funnel types never transition — stay in perpetual BANTER
  if (!FUNNEL_TYPES.includes(relationshipType)) {
    return currentState;
  }

  switch (currentState) {
    case "BANTER":
      if (messageCount >= PIVOT_THRESHOLD) return "LOGISTICS_PIVOT";
      return "BANTER";

    case "LOGISTICS_PIVOT":
      if (detectSchedulingIntent(latestMessage)) return "SCHEDULING";
      return "LOGISTICS_PIVOT";

    case "SCHEDULING":
      if (detectConfirmation(latestMessage)) return "LOCKED";
      return "SCHEDULING";

    case "LOCKED":
      return "LOCKED";
  }
}

function detectSchedulingIntent(message: string): boolean {
  const positiveSignals = [
    "sure",
    "sounds good",
    "down",
    "let's do",
    "i'm free",
    "works for me",
    "let's meet",
    "yeah",
    "yes",
  ];
  const lower = message.toLowerCase();
  return positiveSignals.some((signal) => lower.includes(signal));
}

function detectConfirmation(message: string): boolean {
  const confirmSignals = [
    "see you",
    "confirmed",
    "perfect",
    "it's a date",
    "locked in",
    "bet",
    "can't wait",
  ];
  const lower = message.toLowerCase();
  return confirmSignals.some((signal) => lower.includes(signal));
}

/**
 * Fetches consecutive unread messages from the contact (no owner reply in between)
 * and concatenates them into a single context string for double-text handling.
 */
export async function groupConsecutiveInbound(
  conversationId: string
): Promise<string> {
  const recentMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(20);

  const grouped: string[] = [];
  for (const msg of recentMessages) {
    if (msg.sender === "them") {
      grouped.unshift(msg.content);
    } else {
      break;
    }
  }
  return grouped.join("\n");
}
