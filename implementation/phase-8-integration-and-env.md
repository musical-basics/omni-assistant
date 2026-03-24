# Phase 8: Integration Wiring & Environment Config

## Objective
Implement the Beeper/platform client, wire all modules together, add shared types, and finalize environment configuration.

## Steps

### 8.1 — Beeper Client (`src/lib/beeperClient.ts`)

```ts
/**
 * Sends a message back through the Beeper Desktop Local API (or generic webhook).
 * Replace the implementation below with the actual Beeper/Matrix API once available.
 */
export async function sendMessageViaPlatform(
  conversationId: string,
  content: string
): Promise<void> {
  const apiUrl = process.env.BEEPER_API_URL;
  const apiToken = process.env.BEEPER_API_TOKEN;

  if (!apiUrl || !apiToken) {
    throw new Error("Beeper API credentials not configured in .env.local");
  }

  const response = await fetch(`${apiUrl}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      chatId: conversationId,
      message: content,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Beeper API error (${response.status}): ${errorBody}`);
  }
}
```

### 8.2 — Shared Types (`src/types/index.ts`)

```ts
// Incoming webhook payload
export interface IncomingMessagePayload {
  chatId: string;
  platform: string;
  contactName: string;
  sender: "me" | "them";
  content: string;
  timestamp?: string;
}

// Draft generation request
export interface GenerateDraftRequest {
  conversationId: string;
}

// Approve request
export interface ApproveRequest {
  draftId: string;
  editedContent?: string;
}

// Pending draft response item
export interface PendingDraft {
  draftId: string;
  draftContent: string;
  draftCreatedAt: Date;
  conversationId: string;
  contactName: string;
  platform: string;
  state: string;
  lastUpdated: Date;
}
```

### 8.3 — Finalize `.env.local`
User must fill in these values:
```env
# -- Database --
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# -- AI Provider --
OPENAI_API_KEY=sk-...

# -- Beeper / Platform --
BEEPER_API_URL=http://localhost:8080
BEEPER_API_TOKEN=your-token-here

# -- App --
OWNER_NAME=YourName
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 8.4 — API Endpoint Summary

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/webhooks/incoming` | Ingest messages from chat platforms |
| `POST` | `/api/ai/generateDraft` | Generate an AI draft for a conversation |
| `GET` | `/api/ui/pendingDrafts` | List all conversations with unapproved drafts |
| `POST` | `/api/messages/approve` | Approve a draft and send it via platform |

### 8.5 — Smoke Test Script (`scripts/test-webhook.sh`)

```bash
#!/bin/bash
# Smoke test: send a fake incoming message
curl -X POST http://localhost:3000/api/webhooks/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "test-chat-001",
    "platform": "iMessage",
    "contactName": "Test User",
    "sender": "them",
    "content": "hey what are you up to this week?"
  }'
```

### 8.6 — Verification Checklist
After filling in `.env.local`:
1. Run `pnpm dev`
2. Execute the smoke test script
3. Check `GET /api/ui/pendingDrafts` — should show the generated draft
4. Call `POST /api/messages/approve` with the draft ID
5. Verify the Beeper API receives the outgoing message (or logs error if mock)

## Acceptance Criteria
- [ ] `beeperClient.ts` sends authenticated requests to the configured API URL
- [ ] All shared types are exported from `src/types/index.ts`
- [ ] `.env.local` template is complete with all required variables
- [ ] Smoke test script exercises the full flow end-to-end
- [ ] No hardcoded secrets anywhere in the codebase
