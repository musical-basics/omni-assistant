import { NextResponse } from "next/server";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  // Find all draft messages joined with conversation metadata
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
