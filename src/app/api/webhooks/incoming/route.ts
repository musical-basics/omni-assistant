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
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    fetch(`${baseUrl}/api/ai/generateDraft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: chatId }),
    }).catch(console.error);
  }

  return NextResponse.json({ success: true });
}
