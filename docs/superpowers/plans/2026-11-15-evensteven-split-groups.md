# Evensteven in ViWallet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Evensteven's group expense splitting, deterministic cent rounding, debt simplification, and activity ledger into ViWallet while removing route latency and overhauling the UI/UX.

**Architecture:** Async React Server Components (RSC) for instant page rendering; server-side math engine for exact integer minor-unit splits; ledger-derived balances; greedy min-flow debt simplification; Prisma ORM with Supabase/PostgreSQL.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Prisma ORM, PostgreSQL (Supabase), Tailwind CSS v4, Jest.

**Spec:** `docs/superpowers/specs/2026-11-15-evensteven-split-groups-design.md`

## Global Constraints

- Store all monetary values as integer minor units (cents) in one group currency.
- Require split shares to sum exactly to the expense amount ($\sum \text{shares} \equiv \text{total}$), with remainder cents assigned deterministically.
- Derive all balances from active expenses (`deletedAt IS NULL`) and settlements; no mutable running balance column.
- Debt simplification must output the minimal number of transfers between members without moving real money.
- Use cryptographically unguessable invite tokens (`uuid`) for group links.
- Preserve full audit trail via append-only activity logs; soft-delete expenses without deleting historical shares.
- Keep group cost-sharing ledger independent of personal Cash/Bank wallet balances (Option A).

## Review Focus

1. **Uneven Split Cent Drift:** A 100.00 expense split 3 ways must produce exactly 3334, 3333, 3333 cents without losing or inventing 1 cent.
2. **Settlement Clearing:** Recording transfers matching the debt simplification plan must bring all member net balances to exactly 0.
3. **Soft-Deleted Expense Ledger Recomputation:** Deleting an expense must immediately recalculate balances excluding that expense, retain activity log diffs, and leave no orphaned foreign keys.
4. **Ghost Member Claiming Collision:** Claiming a placeholder member on invite accept must safely attach the user's `userId` while respecting `@@unique([groupId, userId])`.
5. **Zero Division & Invalid Split Weights:** Submitting 0% percentages, 0 share weights, or empty member lists must be rejected with clean validation errors.

---

### Task 1: Performance Foundation — Eliminate Route Transition Lag

**Files:**
- Modify: `app/(app)/template.tsx:1-17`

**Interfaces:**
- Consumes: Next.js App Router layout hierarchy.
- Produces: Instant page switching without artificial framer-motion opacity/transform delays.

- [ ] **Step 1: Write test verifying template renders children directly without delay**
  Ensure `__tests__/components/template.test.tsx` verifies children mount without motion delays.

- [ ] **Step 2: Run test to observe baseline**
  Run: `npm test -- template.test.tsx`

- [ ] **Step 3: Update `app/(app)/template.tsx` to render children without artificial transition delay**
  Replace delayed motion wrapper with direct children render (or zero-delay spring).

- [ ] **Step 4: Run test to verify it passes**
  Run: `npm test -- template.test.tsx`

- [ ] **Step 5: Commit**
  ```bash
  git add app/(app)/template.tsx __tests__/components/template.test.tsx
  git commit -m "perf(layout): remove artificial page transition delay in template.tsx"
  ```

---

### Task 2: Core Domain Logic — Cent-Exact Split Calculations (TDD)

**Files:**
- Create: `lib/split/calculator.ts`
- Create: `__tests__/lib/split/calculator.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export type SplitMode = 'EQUAL' | 'PERCENTAGE' | 'SHARES' | 'EXACT';
  export interface SplitInput {
    amount: number; // in cents
    memberIds: string[];
    mode: SplitMode;
    values?: Record<string, number>; // percentages, shares (weights), or exact cents
  }
  export interface SplitResult {
    shares: Record<string, number>; // memberId -> cents
    total: number;
  }
  export function calculateSplits(input: SplitInput): SplitResult;
  ```

- [ ] **Step 1: Write failing unit tests for all 4 split modes and edge cases**
  Test 1: 10000 cents split EQUAL across 3 members = [3334, 3333, 3333] (sum 10000).
  Test 2: PERCENTAGE split (50%, 25%, 25% of 10000 = 5000, 2500, 2500).
  Test 3: PERCENTAGE split with rounding (33.33%, 33.33%, 33.34% of 10000).
  Test 4: SHARES split with weights (2 shares, 1 share, 1 share of 10000 = 5000, 2500, 2500).
  Test 5: EXACT split verifying exact total equality, throwing if sum != total.
  Test 6: Rejecting non-positive amounts, empty members, or mismatching percentages.

- [ ] **Step 2: Run tests to verify failure**
  Run: `npm test -- calculator.test.ts`
  Expected: FAIL (Cannot find module `lib/split/calculator`)

- [ ] **Step 3: Implement `calculateSplits` in `lib/split/calculator.ts`**
  Implement exact integer minor unit division with deterministic remainder cent distribution sorted by `memberId`.

- [ ] **Step 4: Run tests to verify all pass**
  Run: `npm test -- calculator.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add lib/split/calculator.ts __tests__/lib/split/calculator.test.ts
  git commit -m "feat(split): implement exact integer minor-unit split calculator with deterministic rounding"
  ```

---

### Task 3: Core Domain Logic — Ledger Balances & Minimized Debt Simplification (TDD)

**Files:**
- Create: `lib/split/balances.ts`
- Create: `lib/split/simplifier.ts`
- Create: `__tests__/lib/split/balances.test.ts`
- Create: `__tests__/lib/split/simplifier.test.ts`

**Interfaces:**
- Consumes: `SplitResult` from `lib/split/calculator.ts`.
- Produces:
  ```typescript
  export interface ExpenseItem {
    id: string;
    paidByMemberId: string;
    amount: number;
    deletedAt?: Date | null;
    shares: { memberId: string; shareAmount: number }[];
  }
  export interface SettlementItem {
    id: string;
    payerMemberId: string;
    payeeMemberId: string;
    amount: number;
  }
  export interface MemberBalance {
    memberId: string;
    paid: number;
    owed: number;
    net: number; // positive = owed money, negative = owes money
  }
  export interface SuggestedTransfer {
    fromMemberId: string; // debtor
    toMemberId: string;   // creditor
    amount: number;       // cents
  }
  export function computeMemberBalances(memberIds: string[], expenses: ExpenseItem[], settlements: SettlementItem[]): Record<string, MemberBalance>;
  export function simplifyDebts(balances: Record<string, MemberBalance>): SuggestedTransfer[];
  ```

- [ ] **Step 1: Write failing unit tests for balances and debt simplification**
  Test 1: Member pays 6000 cents split equally among 3 members -> Payer net +4000, others -2000 each.
  Test 2: Soft-deleted expenses (`deletedAt` set) are ignored in balance calculation.
  Test 3: Recording a settlement of 2000 from debtor to payer reduces debtor net to 0.
  Test 4: Simplifier takes circular or multi-member debts and reduces them to the minimum number of transfers ($M - 1$ max).
  Test 5: Verifying all balances reach zero after applying suggested transfers.

- [ ] **Step 2: Run tests to verify failure**
  Run: `npm test -- balances.test.ts simplifier.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implement `computeMemberBalances` and `simplifyDebts`**
  Implement ledger arithmetic and greedy min-flow transfer pairing.

- [ ] **Step 4: Run tests to verify all pass**
  Run: `npm test -- balances.test.ts simplifier.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add lib/split/balances.ts lib/split/simplifier.ts __tests__/lib/split/
  git commit -m "feat(split): implement dynamic ledger balance computation and debt simplification"
  ```

---

### Task 4: Database Schema & Migration for Evensteven Models

**Files:**
- Modify: `prisma/schema.prisma:1-267`

**Interfaces:**
- Produces: Prisma Client types for `SplitGroup`, `GroupMember`, `GroupExpense`, `ExpenseShare`, `Settlement`, `ActivityLog`.

- [ ] **Step 1: Add SplitGroup models to `prisma/schema.prisma`**
  Add `SplitMode`, `GroupMemberRole`, `ActivityAction` enums, and `SplitGroup`, `GroupMember`, `GroupExpense`, `ExpenseShare`, `Settlement`, `ActivityLog` models with foreign keys and indexes.

- [ ] **Step 2: Generate Prisma client and validate schema**
  Run: `npx prisma validate && npx prisma generate`

- [ ] **Step 3: Push / migrate schema to database**
  Run: `npx prisma db push`

- [ ] **Step 4: Write a schema smoke test verifying models and relations**
  Test in `__tests__/prisma/schema-smoke.test.ts` querying models via Prisma client.

- [ ] **Step 5: Commit**
  ```bash
  git add prisma/schema.prisma __tests__/prisma/
  git commit -m "feat(db): add Evensteven split group and ledger models to Prisma schema"
  ```

---

### Task 5: Server Actions & Data Layer — Groups, Invites & Member Claiming

**Files:**
- Create: `lib/split/group-actions.ts`
- Create: `__tests__/lib/split/group-actions.test.ts`

**Interfaces:**
- Consumes: Prisma client, `getUser` from `lib/auth.ts`.
- Produces:
  ```typescript
  export async function createGroupAction(formData: FormData): Promise<{ success: boolean; groupId?: string; error?: string }>;
  export async function joinGroupAction(formData: FormData): Promise<{ success: boolean; groupId?: string; error?: string }>;
  export async function getGroupData(groupId: string, userId: string);
  export async function getGroupByInviteToken(token: string);
  ```

- [ ] **Step 1: Write integration tests for group creation and invite joining**
  Test 1: Creator creates group with initial placeholder member names; creator is assigned `ADMIN` role.
  Test 2: Invitee visits invite token, claims existing placeholder name, attaches `userId`.
  Test 3: Invitee joins as new member if not claiming placeholder.
  Test 4: Non-members cannot query group data (authorization check).

- [ ] **Step 2: Run tests to verify failure**
  Run: `npm test -- group-actions.test.ts`

- [ ] **Step 3: Implement `lib/split/group-actions.ts`**
  Handle group creation with unguessable `inviteToken` (`crypto.randomUUID()`), membership verification, and placeholder claiming in an atomic Prisma transaction.

- [ ] **Step 4: Run tests to verify all pass**
  Run: `npm test -- group-actions.test.ts`

- [ ] **Step 5: Commit**
  ```bash
  git add lib/split/group-actions.ts __tests__/lib/split/group-actions.test.ts
  git commit -m "feat(split): implement group creation, invite tokens, and member claiming actions"
  ```

---

### Task 6: Server Actions & Data Layer — Expenses, Settlements & Activity Log

**Files:**
- Create: `lib/split/expense-actions.ts`
- Create: `lib/split/settle-actions.ts`
- Create: `__tests__/lib/split/expense-actions.test.ts`

**Interfaces:**
- Consumes: `calculateSplits`, `computeMemberBalances`, Prisma client.
- Produces:
  ```typescript
  export async function createExpenseAction(formData: FormData);
  export async function updateExpenseAction(formData: FormData);
  export async function deleteExpenseAction(formData: FormData);
  export async function recordSettlementAction(formData: FormData);
  ```

- [ ] **Step 1: Write integration tests for expense and settlement lifecycle**
  Test 1: Add expense with shares -> writes `GroupExpense`, `ExpenseShare`, and `ActivityLog`.
  Test 2: Update expense amount -> replaces shares, recalculates, writes diff in `ActivityLog`.
  Test 3: Soft-delete expense -> sets `deletedAt`, retains shares for audit, writes `ActivityLog`.
  Test 4: Record settlement -> ensures payer != payee, writes `Settlement` and `ActivityLog`.

- [ ] **Step 2: Run tests to verify failure**
  Run: `npm test -- expense-actions.test.ts`

- [ ] **Step 3: Implement `lib/split/expense-actions.ts` and `settle-actions.ts`**
  Use Prisma transactions for all multi-record mutations; enforce group membership checks.

- [ ] **Step 4: Run tests to verify all pass**
  Run: `npm test -- expense-actions.test.ts`

- [ ] **Step 5: Commit**
  ```bash
  git add lib/split/expense-actions.ts lib/split/settle-actions.ts __tests__/lib/split/expense-actions.test.ts
  git commit -m "feat(split): implement expense CRUD, settlements, and append-only activity logging"
  ```

---

### Task 7: UI Overhaul — Navigation & Unified Split & Debts Hub (`/split`)

**Files:**
- Modify: `components/layout/Sidebar.tsx`
- Modify: `components/layout/BottomNav.tsx`
- Create: `app/(app)/split/page.tsx`
- Create: `components/split/GroupCard.tsx`
- Create: `components/split/DebtsSummaryCard.tsx`
- Create: `components/split/CreateGroupModal.tsx`

**Interfaces:**
- Consumes: Server-side `getSplitHubData(userId)`.
- Produces: Instant Server Component rendered dashboard with group list and 1-on-1 debts overview.

- [ ] **Step 1: Update navigation items in Sidebar and BottomNav**
  Replace `/debts` with `/split` ("Split & Debts") using the `Users` / `Split` icon.

- [ ] **Step 2: Implement async Server Component `app/(app)/split/page.tsx`**
  Fetch active groups, net balances grouped by currency, and summary of 1-on-1 debts directly on server.

- [ ] **Step 3: Build `GroupCard.tsx` and `DebtsSummaryCard.tsx` with polished visual tokens**
  High-contrast typography, clear balance indicators (green for positive, coral for negative), and tactile buttons.

- [ ] **Step 4: Verify rendering and build**
  Run: `npm test && npm run build`

- [ ] **Step 5: Commit**
  ```bash
  git add components/layout/ app/(app)/split/ components/split/
  git commit -m "feat(ui): add unified Split & Debts hub and update main navigation"
  ```

---

### Task 8: UI — Group Detail, Expense Form & Settle Up

**Files:**
- Create: `app/(app)/split/[id]/page.tsx` (Overview)
- Create: `app/(app)/split/[id]/expenses/new/page.tsx` (Add Expense form with live remainder check)
- Create: `app/(app)/split/[id]/expenses/[expenseId]/edit/page.tsx` (Edit/Delete Expense)
- Create: `app/(app)/split/[id]/balances/page.tsx` (Balances & Minimized settlement plan)
- Create: `app/(app)/split/[id]/settle/page.tsx` (Record Payment modal/page)
- Create: `app/(app)/split/[id]/activity/page.tsx` (Audit feed)
- Create: `app/(app)/split/invite/[token]/page.tsx` (Invite accept & placeholder claiming)

**Interfaces:**
- Consumes: Server actions from Tasks 5 & 6; domain math from Tasks 2 & 3.
- Produces: Complete responsive, accessible screens for all required journeys.

- [ ] **Step 1: Build Group Overview (`/split/[id]/page.tsx`)**
  Header with group name, currency, invite link copy button, quick balance summary, suggested settlements, and recent ledger items.

- [ ] **Step 2: Build Expense Form with 4 Split Modes & Live Remainder Check**
  Client interactive split selector (Equal, %, Shares, Exact) with live calculation bar showing remaining unallocated cents.

- [ ] **Step 3: Build Balances & Settlement Plan view (`/split/[id]/balances/page.tsx`)**
  Displays each member's net balance, minimized transfer suggestions with a 1-click "Record Payment" button.

- [ ] **Step 4: Build Settle-Up Form & Activity Feed**
  Pre-filled settle-up form; append-only audit feed with user, timestamp, and diff descriptions.

- [ ] **Step 5: Build Invite & Claiming View (`/split/invite/[token]/page.tsx`)**
  Allows visiting users to claim a placeholder name or join as a new member.

- [ ] **Step 6: Verify all screens compile and render**
  Run: `npm run build`

- [ ] **Step 7: Commit**
  ```bash
  git add app/(app)/split/
  git commit -m "feat(ui): implement group overview, expense split form, balances, settle up, and activity feed"
  ```

---

### Task 9: End-to-End Verification, Acceptance Scenarios & Vercel Readiness

**Files:**
- Create: `__tests__/e2e/evensteven-journeys.test.ts`

**Interfaces:**
- Verifies all 3 core user journeys and 3 acceptance scenarios.

- [ ] **Step 1: Write and run end-to-end journey tests**
  - Journey 1: Create group, invite member, add uneven grocery expense, verify balances.
  - Journey 2: Follow suggested who-pays-whom transfer, record settle payment, verify balances reach 0.
  - Journey 3: Edit expense amount, verify balance recomputation and activity log entry.

- [ ] **Step 2: Run complete test suite**
  Run: `npm test`
  Expected: All unit, integration, and E2E tests pass.

- [ ] **Step 3: Run production build check**
  Run: `npm run build`
  Expected: Clean Next.js production build with 0 TypeScript/ESLint errors.

- [ ] **Step 4: Commit**
  ```bash
  git add __tests__/e2e/
  git commit -m "test(e2e): verify all Evensteven end-to-end user journeys and acceptance scenarios"
  ```
