# Phase 10: Relationship-Aware Prompt Routing & State Machine Guard

## Objective
Update the LLM prompt builder and state machine so that persona/tone and funnel behavior are driven by `relationshipType`.

## Steps

### 10.1 — Add Relationship Prompt Map to `src/lib/promptBuilder.ts`
```ts
const RELATIONSHIP_PROMPTS: Record<RelationshipType, string> = {
  DATING_PIPELINE: "", // Falls through to existing state-based prompts
  STUDENT_LEAD: "I am a professional piano teacher. Tone is warm but professional. Goal is to answer questions, quote $80/hr, and offer a 30-min trial lesson on Tuesday/Wednesday.",
  ACTIVE_STUDENT: "This is an active student. Tone is encouraging and supportive. Handle scheduling, lesson notes, and practice reminders.",
  FRIEND: "Tone is incredibly casual. No agenda, just match their energy. Never try to force a schedule.",
  VIP: "This is a VIP contact. Tone is warm, attentive, and high-priority. Be responsive and accommodating.",
  COWORKER: "Tone is professional and brief. Acknowledge data, confirm receipt of files.",
  HIRED_HELP: "Tone is direct and transactional. Acknowledge updates, answer clarifying questions cleanly.",
};
```

### 10.2 — Update `buildSystemPrompt()` Signature
```ts
export function buildSystemPrompt(
  state: ConversationState,
  relationshipType: RelationshipType
): string
```
- For `DATING_PIPELINE`: Use existing state-based prompts (BANTER/LOGISTICS_PIVOT/SCHEDULING)
- For all other types: Use the relationship-specific prompt, ignore state appendage

### 10.3 — Guard State Machine Transitions in `src/lib/stateMachine.ts`
Update `evaluateTransition()` to accept `relationshipType`:
- Pivot trigger (BANTER → LOGISTICS_PIVOT) only fires for `DATING_PIPELINE` and `STUDENT_LEAD`
- All other relationship types stay in `BANTER` perpetually (no forced funnel)

### 10.4 — Update Route Handlers
- `generateDraft/route.ts`: Pass `convo.relationshipType` to `buildSystemPrompt()`
- `webhooks/incoming/route.ts`: Pass `relationshipType` to `evaluateTransition()`

## Acceptance Criteria
- [ ] `buildSystemPrompt("BANTER", "FRIEND")` returns base + friend-specific tone
- [ ] `buildSystemPrompt("BANTER", "DATING_PIPELINE")` returns base + banter state append
- [ ] `evaluateTransition("BANTER", 5, msg, "FRIEND")` stays `BANTER` (no pivot)
- [ ] `evaluateTransition("BANTER", 5, msg, "DATING_PIPELINE")` returns `LOGISTICS_PIVOT`
- [ ] `evaluateTransition("BANTER", 5, msg, "STUDENT_LEAD")` returns `LOGISTICS_PIVOT`
