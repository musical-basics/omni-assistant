# Phase 1: Project Scaffolding & Configuration

## Objective
Initialize the Next.js TypeScript project with strict mode, install all core dependencies, and configure the project structure.

## Steps

### 1.1 — Initialize Next.js Project
```bash
npx -y create-next-app@latest ./ --typescript --eslint --app --src-dir --no-tailwind --import-alias "@/*"
```

### 1.2 — Enable TypeScript Strict Mode
Ensure `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 1.3 — Install Core Dependencies
```bash
pnpm add drizzle-orm @neondatabase/serverless openai dotenv
pnpm add -D drizzle-kit @types/node tsx
```

### 1.4 — Establish Folder Structure
```
src/
├── app/
│   └── api/
│       ├── webhooks/
│       │   └── incoming/route.ts
│       ├── ai/
│       │   └── generateDraft/route.ts
│       ├── ui/
│       │   └── pendingDrafts/route.ts
│       └── messages/
│           └── approve/route.ts
├── db/
│   ├── index.ts          # Neon client + Drizzle instance
│   └── schema.ts         # Drizzle table/enum definitions
├── lib/
│   ├── stateMachine.ts   # State transition logic
│   ├── promptBuilder.ts  # Dynamic LLM prompt assembly
│   └── beeperClient.ts   # Outgoing message sender
└── types/
    └── index.ts          # Shared TypeScript types
```

### 1.5 — Create `.env.local` Template
```env
# Database
DATABASE_URL=

# AI Provider (fill one)
OPENAI_API_KEY=
# ANTHROPIC_API_KEY=

# Beeper / Chat API
BEEPER_API_URL=
BEEPER_API_TOKEN=

# Owner identity
OWNER_NAME=
```

### 1.6 — Create `drizzle.config.ts`
```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

## Acceptance Criteria
- [ ] `pnpm dev` starts without errors
- [ ] Strict TypeScript compiles cleanly
- [ ] All folders and placeholder files exist
- [ ] `.env.local` created (user fills in keys)
