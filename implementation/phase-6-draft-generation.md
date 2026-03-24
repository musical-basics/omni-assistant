# Phase 6: Draft Generation Endpoint

## Objective
Implement `POST /api/ai/generateDraft` — pulls conversation context, assembles the prompt, calls the LLM, and saves the draft.

## Steps

### 6.1 — Implement Route Handler (`src/app/api/ai/generateDraft/route.ts`)

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { buildSystemPrompt } from "@/lib/promptBuilder";
import { generateReply } from "@/lib/promptBuilder";
import { groupConsecutiveInbound } from "@/lib/stateMachine";

export async function POST(req: NextRequest) {
  const { conversationId } = await req.json();

  // 1. Fetch conversation state
  const convo = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });

  if (!convo) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Don't generate drafts for LOCKED conversations
  if (convo.state === "LOCKED") {
    return NextResponse.json({ skipped: true, reason: "LOCKED" });
  }

  // 2. Pull last 10 messages for context
  const recentMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(10);

  // Reverse to chronological order
  const history = recentMessages.reverse().map((msg) => ({
    role: msg.sender === "me" ? ("assistant" as const) : ("user" as const),
    content: msg.content,
  }));

  // 3. Handle double-text grouping
  const groupedInbound = await groupConsecutiveInbound(conversationId);
  if (groupedInbound && history.length > 0) {
    // Replace the last user entries with the grouped version
    const lastUserIdx = history.findLastIndex((m) => m.role === "user");
    if (lastUserIdx !== -1) {
      // Collapse consecutive user messages at the end
      while (history.length > 0 && history[history.length - 1].role === "user") {
        history.pop();
      }
      history.push({ role: "user", content: groupedInbound });
    }
  }

  // 4. Build prompt and call LLM
  const systemPrompt = buildSystemPrompt(convo.state);
  const draftContent = await generateReply(systemPrompt, history);

  if (!draftContent) {
    return NextResponse.json({ error: "LLM returned empty response" }, { status: 500 });
  }

  // 5. Save draft
  await db.insert(messages).values({
    id: uuidv4(),
    conversationId,
    sender: "me",
    content: draftContent,
    isDraft: true,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true, draft: draftContent });
}
```

## Key Design Decisions
- Last 10 messages provide sufficient context without exceeding token limits
- Double-text grouping collapses consecutive inbound messages into one LLM context entry
- Drafts are always saved with `isDraft: true` and `sender: "me"`

## Acceptance Criteria
- [ ] Returns 404 for unknown `conversationId`
- [ ] Skips draft generation for `LOCKED` conversations
- [ ] Pulls ≤10 messages in chronological order
- [ ] Groups consecutive inbound messages before prompting
- [ ] Saves LLM response as a draft message in the database
