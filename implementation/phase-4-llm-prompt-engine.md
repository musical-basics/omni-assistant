# Phase 4: LLM Prompting Engine

## Objective
Build the dynamic prompt assembler in `src/lib/promptBuilder.ts` that constructs system prompts based on the current conversation state, and the LLM call wrapper.

## Steps

### 4.1 — Base System Prompt

```ts
const ownerName = process.env.OWNER_NAME || "the owner";

const BASE_PROMPT = `You are drafting text messages for ${ownerName}. Be concise, use lowercase formatting mostly, avoid emojis unless mirroring the sender. Do not sound enthusiastic or like a customer service bot. Keep it dry but polite.`;
```

### 4.2 — State-Specific Prompt Appends

```ts
const STATE_PROMPTS: Record<ConversationState, string> = {
  BANTER:
    "Acknowledge what they said. Ask one light question to keep the conversation going. Keep it under 2 sentences.",

  LOGISTICS_PIVOT:
    "Acknowledge their last message briefly. Then, immediately propose meeting up. Offer exactly two options: Drinks this Thursday at [Venue A] or Coffee this Sunday at [Venue B]. Be direct.",

  SCHEDULING:
    "They have shown interest in meeting. Cross-reference their response with these rules: [Rule 1: I am free Thurs after 7PM. Rule 2: I am free Sunday 1PM-4PM]. Suggest a specific time based on these rules.",

  LOCKED:
    "", // No prompt needed — drafts are not generated in this state
};
```

> **Note**: Venue names and availability rules should eventually be configurable. For MVP, hardcode per the PRD.

### 4.3 — Prompt Builder Function

```ts
import type { ConversationState } from "./stateMachine";

export function buildSystemPrompt(state: ConversationState): string {
  const stateAppend = STATE_PROMPTS[state];
  if (!stateAppend) return BASE_PROMPT;
  return `${BASE_PROMPT}\n\n${stateAppend}`;
}
```

### 4.4 — LLM Call Wrapper

```ts
import OpenAI from "openai";

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
```

## Acceptance Criteria
- [ ] `buildSystemPrompt("BANTER")` returns base + banter append
- [ ] `buildSystemPrompt("LOCKED")` returns only the base prompt
- [ ] `generateReply` calls OpenAI and returns a trimmed string
- [ ] API key is loaded from env — never hardcoded
