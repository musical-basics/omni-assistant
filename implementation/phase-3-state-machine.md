# Phase 3: State Machine Logic

## Objective
Implement the conversation state transition engine in `src/lib/stateMachine.ts`. This is the core decision engine that moves conversations through the BANTER → LOGISTICS_PIVOT → SCHEDULING → LOCKED funnel.

## Steps

### 3.1 — Define State Type & Transitions

```ts
export type ConversationState = "BANTER" | "LOGISTICS_PIVOT" | "SCHEDULING" | "LOCKED";

const PIVOT_THRESHOLD = 4; // Trigger pivot after 4 inbound messages
```

### 3.2 — Implement `evaluateTransition()`

```ts
/**
 * Evaluates the current conversation state and returns the next state
 * based on messageCount and any scheduling confirmation signals.
 */
export function evaluateTransition(
  currentState: ConversationState,
  messageCount: number,
  latestMessage: string
): ConversationState {
  switch (currentState) {
    case "BANTER":
      if (messageCount >= PIVOT_THRESHOLD) return "LOGISTICS_PIVOT";
      return "BANTER";

    case "LOGISTICS_PIVOT":
      // If the contact shows interest in meeting, advance to SCHEDULING
      if (detectSchedulingIntent(latestMessage)) return "SCHEDULING";
      return "LOGISTICS_PIVOT";

    case "SCHEDULING":
      // If a plan is confirmed, lock the conversation
      if (detectConfirmation(latestMessage)) return "LOCKED";
      return "SCHEDULING";

    case "LOCKED":
      return "LOCKED"; // Terminal state — no more auto-drafts
  }
}
```

### 3.3 — Implement Intent Detection Helpers

```ts
function detectSchedulingIntent(message: string): boolean {
  const positiveSignals = [
    "sure", "sounds good", "down", "let's do", "i'm free",
    "works for me", "let's meet", "yeah", "yes",
  ];
  const lower = message.toLowerCase();
  return positiveSignals.some((signal) => lower.includes(signal));
}

function detectConfirmation(message: string): boolean {
  const confirmSignals = [
    "see you", "confirmed", "perfect", "it's a date",
    "locked in", "bet", "can't wait",
  ];
  const lower = message.toLowerCase();
  return confirmSignals.some((signal) => lower.includes(signal));
}
```

### 3.4 — Double-Text Grouping Utility

```ts
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Fetches consecutive unread messages from the contact (no owner reply in between)
 * and concatenates them into a single context string.
 */
export async function groupConsecutiveInbound(conversationId: string): Promise<string> {
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
      break; // Stop when we hit an owner message
    }
  }
  return grouped.join("\n");
}
```

## Acceptance Criteria
- [ ] `evaluateTransition` returns correct next state for every state/threshold combo
- [ ] `detectSchedulingIntent` catches common positive replies
- [ ] `detectConfirmation` catches common confirmation phrases
- [ ] `groupConsecutiveInbound` concatenates double-texts correctly
