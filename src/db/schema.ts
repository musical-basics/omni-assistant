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

// Relationship type enum
export const relationshipTypeEnum = pgEnum("relationship_type", [
  "DATING_PIPELINE",
  "STUDENT_LEAD",
  "ACTIVE_STUDENT",
  "FRIEND",
  "VIP",
  "COWORKER",
  "HIRED_HELP",
]);

// Conversations table
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  platform: text("platform").notNull(),
  contactName: text("contact_name").notNull(),
  state: conversationStateEnum("state").default("BANTER").notNull(),
  relationshipType: relationshipTypeEnum("relationship_type").default("FRIEND").notNull(),
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
