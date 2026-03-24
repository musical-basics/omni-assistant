import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendMessageViaPlatform } from "@/lib/beeperClient";

interface ApprovePayload {
  draftId: string;
  editedContent?: string;
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
