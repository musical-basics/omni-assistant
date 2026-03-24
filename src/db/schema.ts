import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// State machine enum
export const conversationStateEnum = pgEnum("conversation_state", [
  "BANTER",
  "LOGISTICS_PIVOT",
  "SCHEDULING",
  "LOCKED",
]);

// Conversations table
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  platform: text("platform").notNull(),
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
  sender: text("sender").notNull(), // 'me' | 'them'
  content: text("content").notNull(),
  isDraft: boolean("is_draft").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
