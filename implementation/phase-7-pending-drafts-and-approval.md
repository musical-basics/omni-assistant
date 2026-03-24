# Phase 7: Pending Drafts & Approval Endpoints

## Objective
Implement the two UI-facing endpoints:
1. `GET /api/ui/pendingDrafts` — fetch all conversations with unapproved drafts
2. `POST /api/messages/approve` — approve (optionally edit) a draft and send it

## Steps

### 7.1 — Pending Drafts Endpoint (`src/app/api/ui/pendingDrafts/route.ts`)

```ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  // Find all draft messages
  const drafts = await db
    .select({
      draftId: messages.id,
      draftContent: messages.content,
      draftCreatedAt: messages.createdAt,
      conversationId: messages.conversationId,
      contactName: conversations.contactName,
      platform: conversations.platform,
      state: conversations.state,
      lastUpdated: conversations.lastUpdated,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(eq(messages.isDraft, true))
    .orderBy(desc(conversations.lastUpdated));

  return NextResponse.json({ drafts });
}
```

### 7.2 — Approve Endpoint (`src/app/api/messages/approve/route.ts`)

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendMessageViaPlatform } from "@/lib/beeperClient";

interface ApprovePayload {
  draftId: string;
  editedContent?: string; // If the user manually edited the draft in the UI
}

export async function POST(req: NextRequest) {
  const { draftId, editedContent }: ApprovePayload = await req.json();

  // 1. Fetch the draft
  const draft = await db.query.messages.findFirst({
    where: eq(messages.id, draftId),
  });

  if (!draft || !draft.isDraft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const finalContent = editedContent?.trim() || draft.content;

  // 2. Mark as approved (no longer a draft)
  await db
    .update(messages)
    .set({
      isDraft: false,
      content: finalContent,
    })
    .where(eq(messages.id, draftId));

  // 3. Send via Beeper / platform API
  try {
    await sendMessageViaPlatform(draft.conversationId, finalContent);
  } catch (err) {
    console.error("Failed to send message via platform:", err);
    return NextResponse.json(
      { error: "Draft approved but failed to send" },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, sentContent: finalContent });
}
```

## Acceptance Criteria
- [ ] `GET /api/ui/pendingDrafts` returns all unapproved drafts joined with conversation metadata
- [ ] Results are sorted by `lastUpdated` descending
- [ ] `POST /api/messages/approve` marks the draft as sent
- [ ] Supports optional `editedContent` override
- [ ] Calls Beeper/platform API to deliver the message
- [ ] Returns 502 with explanation if platform send fails (draft is still approved)
