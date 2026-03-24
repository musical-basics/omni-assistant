# Phase 5: Webhook Ingestion Endpoint

## Objective
Implement `POST /api/webhooks/incoming` — the entry point for all inbound messages from Beeper/Matrix or generic webhook sources.

## Steps

### 5.1 — Define Incoming Payload Type (`src/types/index.ts`)

```ts
export interface IncomingMessagePayload {
  chatId: string;          // Unique conversation identifier from the platform
  platform: string;        // 'iMessage', 'Hinge', 'WhatsApp', etc.
  contactName: string;
  sender: "me" | "them";
  content: string;
  timestamp?: string;      // ISO 8601; defaults to now if missing
}
```

### 5.2 — Implement Route Handler (`src/app/api/webhooks/incoming/route.ts`)

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { evaluateTransition } from "@/lib/stateMachine";
import type { IncomingMessagePayload } from "@/types";

export async function POST(req: NextRequest) {
  const body: IncomingMessagePayload = await req.json();
  const { chatId, platform, contactName, sender, content } = body;

  // 1. Upsert conversation
  const existing = await db.query.conversations.findFirst({
    where: eq(conversations.id, chatId),
  });

  const newCount = (existing?.messageCount ?? 0) + (sender === "them" ? 1 : 0);

  if (existing) {
    const nextState = evaluateTransition(existing.state, newCount, content);
    await db
      .update(conversations)
      .set({
        messageCount: newCount,
        state: nextState,
        lastUpdated: new Date(),
      })
      .where(eq(conversations.id, chatId));
  } else {
    await db.insert(conversations).values({
      id: chatId,
      platform,
      contactName,
      state: "BANTER",
      messageCount: sender === "them" ? 1 : 0,
      lastUpdated: new Date(),
    });
  }

  // 2. Insert message
  await db.insert(messages).values({
    id: uuidv4(),
    conversationId: chatId,
    sender,
    content,
    isDraft: false,
    createdAt: new Date(),
  });

  // 3. Trigger draft generation if message is from contact & not LOCKED
  const convo = await db.query.conversations.findFirst({
    where: eq(conversations.id, chatId),
  });

  if (sender === "them" && convo?.state !== "LOCKED") {
    // Fire-and-forget call to draft generation
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai/generateDraft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: chatId }),
    }).catch(console.error);
  }

  return NextResponse.json({ success: true });
}
```

### 5.3 — Install UUID
```bash
pnpm add uuid
pnpm add -D @types/uuid
```

## Acceptance Criteria
- [ ] Endpoint accepts a valid `IncomingMessagePayload`
- [ ] Upserts conversation row correctly (insert on first message, update thereafter)
- [ ] Increments `messageCount` only for `sender === "them"`
- [ ] State transition fires on upsert
- [ ] Draft generation is triggered for inbound contact messages (state ≠ LOCKED)
