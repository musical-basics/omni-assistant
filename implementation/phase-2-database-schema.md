# Phase 2: Database Schema (Drizzle ORM + Neon)

## Objective
Define the Drizzle ORM schema with the two primary tables (`conversations`, `messages`) and the `conversation_state` enum. Set up the Neon database client.

## Steps

### 2.1 — Define Schema (`src/db/schema.ts`)

```ts
import { pgTable, pgEnum, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// State machine enum
export const conversationStateEnum = pgEnum("conversation_state", [
  "BANTER",
  "LOGISTICS_PIVOT",
  "SCHEDULING",
  "LOCKED",
]);

// Conversations table
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),                              // Chat ID from platform
  platform: text("platform").notNull(),                     // e.g. 'iMessage', 'Hinge'
  contactName: text("contact_name").notNull(),
  state: conversationStateEnum("state").default("BANTER").notNull(),
  messageCount: integer("message_count").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .references(() => conversations.id)
    .notNull(),
  sender: text("sender").notNull(),                         // 'me' | 'them'
  content: text("content").notNull(),
  isDraft: boolean("is_draft").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 2.2 — Initialize Neon Client (`src/db/index.ts`)

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### 2.3 — Generate & Push Migration
> **Note:** Do NOT run the migration automatically. Provide the command to the user.

```bash
# Generate migration SQL
pnpm drizzle-kit generate

# User should review then push manually:
pnpm drizzle-kit push
```

## Acceptance Criteria
- [ ] Schema file exports `conversations`, `messages`, and `conversationStateEnum`
- [ ] `db` export connects to Neon via env var
- [ ] Migration SQL generates without errors
- [ ] User runs push manually against their Neon database
