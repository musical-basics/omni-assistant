# Phase 9: Schema Update — Relationship Type Enum & Column

## Objective
Expand the database schema to support relationship-based routing by adding a `relationship_type` enum and a `relationshipType` column to the `conversations` table.

## Steps

### 9.1 — Add `relationshipTypeEnum` to `src/db/schema.ts`
```ts
export const relationshipTypeEnum = pgEnum("relationship_type", [
  "DATING_PIPELINE",
  "STUDENT_LEAD",
  "ACTIVE_STUDENT",
  "FRIEND",
  "VIP",
  "COWORKER",
  "HIRED_HELP",
]);
```

### 9.2 — Add `relationshipType` Column to `conversations`
```ts
relationshipType: relationshipTypeEnum("relationship_type").default("FRIEND").notNull(),
```

### 9.3 — Export `RelationshipType` from `src/types/index.ts`
```ts
export type RelationshipType =
  | "DATING_PIPELINE"
  | "STUDENT_LEAD"
  | "ACTIVE_STUDENT"
  | "FRIEND"
  | "VIP"
  | "COWORKER"
  | "HIRED_HELP";
```

### 9.4 — Update `IncomingMessagePayload` to accept optional `relationshipType`
So that new conversations can be tagged on first contact.

### 9.5 — Update Webhook Route
Pass `relationshipType` from the payload when inserting new conversations.

### 9.6 — Migration
> User runs `pnpm drizzle-kit generate` then `pnpm drizzle-kit push` manually.

## Acceptance Criteria
- [ ] `relationship_type` enum exists with all 7 values
- [ ] `conversations.relationshipType` column defaults to `'FRIEND'`
- [ ] Webhook upsert passes `relationshipType` on insert
- [ ] Shared types export `RelationshipType`
