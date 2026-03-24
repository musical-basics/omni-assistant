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
