PRD: AI-Powered Personal Command Center (Backend)
1. Project Objective
Build a headless TypeScript backend that intercepts incoming messages from various chat platforms (via Beeper Desktop API/Matrix), tracks conversational state in a serverless database, and uses an LLM to automatically generate and stage draft responses based on a predefined "Banter-to-Logistics" funnel. The system is designed for a single tenant (the owner) to minimize context-switching and automate 95% of messaging logic.

2. Tech Stack
Language: TypeScript (Strict mode enabled)

Runtime/Framework: Node.js (via Next.js API Routes or Express)

Database: Neon (Serverless Postgres)

ORM: Drizzle ORM

AI Integration: OpenAI SDK (or Anthropic SDK)

Ingestion: Beeper Desktop Local API (or generic webhooks)

3. Core Data Architecture (Drizzle + Neon)
The system relies on two primary tables and an Enum for the state machine.

conversation_state (Enum):

BANTER: Casual conversation, purely conversational AI.

LOGISTICS_PIVOT: Threshold met. AI must attempt to pivot to scheduling a meetup/call.

SCHEDULING: Negotiating exact time/place based on hardcoded owner availability.

LOCKED: Plan confirmed. AI stops generating drafts to avoid messing up real-world plans.

conversations (Table):

id (String, PK - Chat ID)

platform (String - e.g., 'iMessage', 'Hinge')

contactName (String)

state (Enum, default: BANTER)

messageCount (Int, default: 0)

lastUpdated (Timestamp)

messages (Table):

id (String, PK)

conversationId (FK -> conversations.id)

sender (String - 'me' | 'them')

content (Text)

isDraft (Boolean - True if AI generated but not approved)

createdAt (Timestamp)

4. State Machine Logic & Triggers
The core engine of the app tracks the messageCount for messages received from a specific contact.

The Pivot Trigger: If state === 'BANTER' and messageCount >= 4, automatically update state to LOGISTICS_PIVOT.

Double-Text Handling: If the contact sends multiple messages in a row before a reply is sent, group them into a single context window for the LLM rather than generating multiple drafts.

5. LLM Prompting Strategy (The Brain)
The system prompt passed to the LLM must be dynamically assembled based on the conversation's current state.

Base Prompt (Always Included): "You are drafting text messages for [My Name]. Be concise, use lowercase formatting mostly, avoid emojis unless mirroring the sender. Do not sound enthusiastic or like a customer service bot. Keep it dry but polite."

State Append: BANTER: "Acknowledge what they said. Ask one light question to keep the conversation going. Keep it under 2 sentences."

State Append: LOGISTICS_PIVOT: "Acknowledge their last message briefly. Then, immediately propose meeting up. Offer exactly two options: Drinks this Thursday at [Venue A] or Coffee this Sunday at [Venue B]. Be direct."

State Append: SCHEDULING: "They have shown interest in meeting. Cross-reference their response with these rules: [Rule 1: I am free Thurs after 7PM. Rule 2: I am free Sunday 1PM-4PM]. Suggest a specific time based on these rules."

6. Required API Endpoints/Functions
POST /api/webhooks/incoming:

Receives payload from chat client.

Upserts conversations table, inserts messages row.

Triggers the generateDraft background worker.

POST /api/ai/generateDraft:

Pulls last 10 messages of context.

Checks current state.

Calls LLM and saves response to messages table with isDraft = true.

GET /api/ui/pendingDrafts:

Fetches all conversations that have an unapproved draft, sorted by lastUpdated. (For the UI dashboard).

POST /api/messages/approve:

Takes the drafted text (and any manual edits made in the UI).

Updates messages table isDraft to false.

Fires the API call back to Beeper/Chat network to actually send the message.