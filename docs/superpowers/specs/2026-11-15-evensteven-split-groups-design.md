# Evensteven in ViWallet: Unified Split & Debts Hub Design Spec

- **Author:** Antigravity Agent
- **Date:** 2026-11-15
- **Branch:** feat/evensteven-split-groups
- **Status:** Approved by User

---

## 1. Intent & Context

ViWallet (`vichanwallet.xyz`) is a personal finance app built on Next.js 16, React 19, Prisma, PostgreSQL (Supabase), Tailwind CSS v4, and Motion. While it has single-user wallets, budgets, and 1-on-1 bilateral debts, users currently lack a true multi-party group cost-sharing engine for housemates and trips.

Furthermore, the existing UI suffers from sluggish interactions:
1. **Client-side Fetch Waterfalls:** Pages like `/debts` and `/trips/[id]` use `'use client'` + `useEffect()` to fetch data on mount, triggering blank skeleton flashes on every route navigation.
2. **Page Transition Stutter:** A global `template.tsx` motion wrapper fades and slides during fetch latency, giving an ungrounded, laggy feel.
3. **Flat Visuals:** Repetitive muted cards without strong visual contrast or tactile feedback.

This specification defines the integration of **Evensteven** into ViWallet: creating a unified **"Split & Debts"** hub (`/split`) with a multi-user ledger, 4 split modes, exact integer minor-unit arithmetic, debt simplification, and an instantaneous, server-rendered UX.

---

## 2. Key Product & Architectural Decisions

1. **Standalone Cost-Sharing Ledger (Option A):**  
   Group expenses and settlements live exclusively in the group ledger (Splitwise model). Paying a group expense tracks who owes what inside the group without altering personal Cash/Bank wallet totals or introducing cross-currency conversion complexities.
2. **Ghost / Placeholder Members & Claiming:**  
   Creators can add placeholder member names (e.g. "Alice", "Bob") before those people register. When an invited friend opens `/split/invite/[token]`, they can either claim an existing placeholder name or join as a new member.
3. **Navigation & Debts Consolidation:**  
   In `Sidebar.tsx` and `BottomNav.tsx`, the existing "Debts" item is upgraded to **"Split & Debts"** (`/split`), housing both multi-party split groups and personal 1-on-1 debts. Multi-currency balances are grouped by currency (e.g. `+$50.00 USD`, `-250,000 VND`) without forced conversions.
4. **Open Trust & Audit History:**  
   Aligned with Splitwise and the product brief, any group member can add, edit, or soft-delete expenses. Edits dynamically recompute balances from the active ledger and record structured before/after diffs in the append-only activity feed.
5. **Instant Server Components (RSC):**  
   The new `/split` hub is built on async React Server Components with instant server rendering (zero client fetch waterfalls). The artificial motion delay in `template.tsx` is removed to ensure snappy navigation across the entire app.

---

## 3. Goals, Non-Goals & Anti-Goals

### Goals
- **Multi-user Group Cost Sharing:** Support housemates and travel groups sharing expenses under a unified group entity.
- **4 Deterministic Split Modes:** Equal, Percentage, Shares/Weights, and Exact Amounts, computed strictly in integer minor units (cents) with zero cent drift ($sum 	ext{shares} equiv 	ext{total}$).
- **Ledger-Derived Balances:** All member balances are computed dynamically from immutable expense shares and recorded settlements.
- **Minimized Settlement Plan (Debt Simplification):** Compute the minimal set of transfers between members using a greedy min-flow algorithm.
- **Append-Only Activity Feed:** Track expenses created, edited, deleted, and settlements recorded with before/after diffs.
- **Unguessable Invite Links:** Allow frictionless onboarding via a cryptographically random token (`/split/invite/[token]`).
- **Performance & UI/UX Transformation:**
  - Shift all pages to Next.js Server Components with instant server rendering.
  - Remove route transition delay in `template.tsx`.
  - Introduce crisp typography, clear contrast, tactile action sheets, and mobile-friendly responsive navigation.
- **Seamless Vercel Deployment:** Maintain full compatibility with the existing Supabase Postgres database and Vercel pipeline.

### Non-Goals
- Payment processor integrations (Stripe, PayPal, MoMo, etc.) — payments are recorded as ledger facts; no real money moves.
- Bank feeds and receipt OCR scanning.
- In-group multi-currency conversion (each group is denominated in one base currency, e.g. USD or VND).

### Anti-Goals
- Storing mutable running balance columns that risk desynchronization.
- Hard deletes that destroy financial audit history.
- Blank skeleton flash on tab switching.

---

## 4. Data Model (Prisma / PostgreSQL)

We extend `prisma/schema.prisma` with the following relational models:

```prisma
enum SplitMode {
  EQUAL
  PERCENTAGE
  SHARES
  EXACT
}

enum GroupMemberRole {
  ADMIN
  MEMBER
}

enum ActivityAction {
  GROUP_CREATED
  MEMBER_JOINED
  EXPENSE_CREATED
  EXPENSE_UPDATED
  EXPENSE_DELETED
  SETTLEMENT_RECORDED
}

model SplitGroup {
  id           String         @id @default(uuid())
  name         String
  currency     String         @default("USD")
  inviteToken  String         @unique @default(uuid())
  createdById  String
  createdAt    DateTime       @default(now())
  archivedAt   DateTime?
  createdBy    User           @relation("CreatedSplitGroups", fields: [createdById], references: [id])
  members      GroupMember[]
  expenses     GroupExpense[]
  settlements  Settlement[]
  activityLogs ActivityLog[]

  @@index([createdById])
  @@index([inviteToken])
}

model GroupMember {
  id              String          @id @default(uuid())
  groupId         String
  userId          String?         // Nullable for placeholder/ghost members until claimed
  displayName     String
  role            GroupMemberRole @default(MEMBER)
  joinedAt        DateTime        @default(now())
  group           SplitGroup      @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user            User?           @relation(fields: [userId], references: [id], onDelete: SetNull)
  paidExpenses    GroupExpense[]  @relation("ExpensePayer")
  expenseShares   ExpenseShare[]
  paidSettlements Settlement[]    @relation("SettlementPayer")
  recvdSettlements Settlement[]   @relation("SettlementPayee")
  activityLogs    ActivityLog[]

  @@unique([groupId, userId])
  @@index([groupId])
  @@index([userId])
}

model GroupExpense {
  id                String         @id @default(uuid())
  groupId           String
  paidByMemberId    String
  amount            Int            // In minor units (cents)
  description       String
  splitMode         SplitMode      @default(EQUAL)
  expenseDate       DateTime
  createdById       String
  deletedAt         DateTime?      // Soft delete for immutable audit
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  group             SplitGroup     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  paidByMember      GroupMember    @relation("ExpensePayer", fields: [paidByMemberId], references: [id])
  createdBy         User           @relation(fields: [createdById], references: [id])
  shares            ExpenseShare[]

  @@index([groupId, deletedAt])
  @@index([paidByMemberId])
}

model ExpenseShare {
  id             String       @id @default(uuid())
  expenseId      String
  memberId       String
  shareAmount    Int          // In minor units (cents)
  rawSplitValue  String?      // e.g. "33.33%" or "2 shares" for display
  createdAt      DateTime     @default(now())
  expense        GroupExpense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  member         GroupMember  @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@index([expenseId])
  @@index([memberId])
}

model Settlement {
  id                  String      @id @default(uuid())
  groupId             String
  payerMemberId       String
  payeeMemberId       String
  amount              Int         // In minor units (cents)
  settlementDate      DateTime
  note                String?
  recordedById        String
  createdAt           DateTime    @default(now())
  group               SplitGroup  @relation(fields: [groupId], references: [id], onDelete: Cascade)
  payerMember         GroupMember @relation("SettlementPayer", fields: [payerMemberId], references: [id])
  payeeMember         GroupMember @relation("SettlementPayee", fields: [payeeMemberId], references: [id])
  recordedBy          User        @relation(fields: [recordedById], references: [id])

  @@index([groupId])
}

model ActivityLog {
  id             String         @id @default(uuid())
  groupId        String
  actorMemberId  String?
  actionType     ActivityAction
  entityId       String
  detailsJson    String         // Structured JSON diff
  createdAt      DateTime       @default(now())
  group          SplitGroup     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  actorMember    GroupMember?   @relation(fields: [actorMemberId], references: [id], onDelete: SetNull)

  @@index([groupId, createdAt(sort: Desc)])
}
```

---

## 5. Business Logic & Calculation Invariants

1. **Cent-Exact Split Distribution:**
   - All amounts are positive integers ($> 0$).
   - Sum of shares must equal the total: $sum_{i=1}^M 	ext{share}_i equiv 	ext{amount}$.
   - Remainder cents are distributed deterministically across members sorted by member ID:
     - Equal: $b = lfloor N / M floor$, $r = N pmod M$. First $r$ members receive $b + 1$ cents, remaining receive $b$ cents.
     - Percentage: Each share is $lfloor (P_i 	imes N) / 10000 floor$. Any rounding delta is assigned to the highest percentage holder.
     - Shares: Weights $w_i$, $W = sum w_i$. Base $lfloor (w_i 	imes N) / W floor$, remainders allocated by highest fractional remainder.
     - Exact: Server strictly asserts $sum 	ext{exact}_i = N$.
2. **Dynamic Balance Formula:**
   For each member $m$ in group $G$:
   $$	ext{Balance}(m) = sum 	ext{PaidExpenses}(m) - sum 	ext{OwedShares}(m) + sum 	ext{SettlementsReceived}(m) - sum 	ext{SettlementsPaid}(m)$$
   Soft-deleted expenses are filtered out (`deletedAt IS NULL`).
   Sum of all member balances is invariant: $sum_{m in G} 	ext{Balance}(m) = 0$.
3. **Debt Simplification Algorithm:**
   - Calculate net balances for all members.
   - Separate into Debtors ($	ext{balance} < 0$) and Creditors ($	ext{balance} > 0$).
   - Sort both descending by magnitude.
   - Greedily match the largest debtor with the largest creditor, creating a suggested transfer of $min(|	ext{debt}|, 	ext{credit})$.
   - Adjust remaining amounts and repeat. Result has at most $M - 1$ transfers.

---

## 6. UI Architecture & Routes

We introduce a unified **/split** navigation section:

| Route | Role | Rendering |
|---|---|---|
| `/split` | Hub dashboard: list of groups, overall net balance, 1-on-1 debts summary | Server Component (RSC) |
| `/split/new` | Create group (name, currency, initial members) | Interactive Client Modal/Sheet |
| `/split/invite/[token]` | Join group preview & placeholder claiming | Server Component |
| `/split/[id]` | Group Overview: member positions, minimized suggestions, recent expenses | Server Component |
| `/split/[id]/expenses/new` | Add expense with 4 split modes and live remainder check | Client Sheet with Server Action |
| `/split/[id]/expenses/[expenseId]/edit` | Edit / Delete expense with activity logging | Client Sheet with Server Action |
| `/split/[id]/balances` | Detailed member balances & minimized transfer plan with Settle Up triggers | Server Component |
| `/split/[id]/activity` | Append-only audit history with diff formatting | Server Component |

---

## 7. Performance & UX Overhaul Plan

1. **Server-Rendered Baseline:** Convert data-fetching pages from `'use client'` + `useEffect()` to async React Server Components. Pages fetch directly from Prisma in zero client roundtrips.
2. **Remove Template Delay:** Remove the artificial opacity/y transition in `template.tsx` to give instantaneous tab switching.
3. **Optimistic Feedback:** Use React 19 / Next.js Server Actions with `useActionState` or optimistic updates for form submissions.
4. **Visual Polish:** High-contrast tokens, tactile buttons, clean status badges, and mobile-optimized bottom navigation.

---

## 8. Testing & Verification

- **Unit Tests (`jest`):**
  - Minor-unit split math (100.00 across 3 people = 33.34, 33.33, 33.33).
  - Dynamic balance derivation with active and deleted expenses.
  - Minimized transfer simplification.
- **Integration Tests:**
  - Prisma schema validation and constraints.
  - Group invite join authorization.
  - Expense update and activity log diff generation.
- **End-to-End Validation:**
  - Journey 1: Create group, join via invite, post split expense, check balances.
  - Journey 2: Follow suggested settlement, record payment, verify zero balance.
  - Journey 3: Edit expense amount, verify balance recomputation and activity log.
