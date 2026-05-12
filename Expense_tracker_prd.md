# PRD — Expense Tracker
**Version:** 1.0  
**Status:** Draft  
**Last Updated:** May 2026

---

## 1. Overview

A minimal, offline-first personal expense tracker built as a single-page web application. No auth, no backend, no cloud sync. All data lives in `localStorage`. The experience is premium and keyboard-friendly, presented in a bento grid layout with black-and-white aesthetics and smooth Motion transitions.

---

## 2. Goals & Non-Goals

### Goals
- Fast, frictionless expense entry
- Meaningful spending insights via dashboard charts and cards
- Budget category management with limit tracking
- Export data as PDF or CSV
- Fully client-side — no server, no login

### Non-Goals
- OCR / receipt scanning
- AI-powered suggestions
- Bank / card integrations
- Push notifications
- Authentication or multi-user support
- Remote database or cloud sync

---

## 3. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **React 18** (Vite) | Fast DX, component model |
| UI Components | **shadcn/ui** | Accessible, unstyled-first primitives |
| Styling | **Tailwind CSS** | Utility-first, pairs with shadcn |
| Animation | **Motion (Framer Motion)** | Smooth layout & mount transitions |
| Charts | **Recharts** | Composable, React-native charts |
| PDF Export | **jsPDF + html2canvas** | Client-side PDF generation |
| CSV Export | **PapaParse** | Lightweight CSV serialisation |
| State Management | **Zustand** | Minimal global store, easy persistence |
| Persistence | **localStorage** via Zustand middleware | Zero-backend persistence |
| Font | **Consolas** (monospace system font) | Premium, developer-aesthetic |
| Icons | **Lucide React** | Clean, consistent icon set |

---

## 4. User Flow

```
App Load
  └─► Hydrate store from localStorage
        │
        ├─► [Dashboard]  ← Default view
        │     ├─ Summary cards (Total Spent, Top Category, Over-Budget alerts)
        │     ├─ Spending trend chart (filterable: 7D / 14D / 1M / 3M)
        │     └─ Budget vs. Spent per category (progress bars)
        │
        ├─► [Expenses]
        │     ├─ Expense list (sortable, filterable by category/date)
        │     ├─ Add Expense → Modal/Drawer
        │     │     Fields: Date, Vendor, Category, Amount (₦), Note (optional)
        │     ├─ Edit Expense → Pre-filled Modal
        │     └─ Delete Expense → Confirm popover
        │
        ├─► [Budgets]
        │     ├─ List of budget categories with limit & spend
        │     ├─ Add Category → Modal (name, monthly limit ₦)
        │     ├─ Edit Category limit
        │     └─ Delete Category (warns if expenses exist under it)
        │
        └─► [Export]  (accessible from Dashboard & Expenses)
              ├─ Choose format: PDF | CSV
              ├─ Choose date range
              └─ Download triggered client-side
```

---

## 5. Data Model

All data is stored in a single `localStorage` key: `expensetracker_v1`.

### 5.1 `Expense`

```ts
interface Expense {
  id:         string;       // uuid v4
  date:       string;       // ISO 8601 — "2026-05-08"
  vendor:     string;       // e.g. "Shoprite"
  categoryId: string;       // FK → Category.id
  amount:     number;       // In Naira (₦), stored as integer kobo or float
  note?:      string;       // Optional free text
  createdAt:  string;       // ISO 8601 timestamp
  updatedAt:  string;       // ISO 8601 timestamp
}
```

### 5.2 `Category`

```ts
interface Category {
  id:          string;    // uuid v4
  name:        string;    // e.g. "Food & Dining"
  icon:        string;    // Lucide icon name e.g. "UtensilsCrossed"
  budgetLimit: number;    // Monthly budget cap in ₦ (0 = no limit)
  createdAt:   string;
}
```

### 5.3 `AppStore` (Zustand shape)

```ts
interface AppStore {
  expenses:   Expense[];
  categories: Category[];

  // Expense actions
  addExpense:    (e: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Category actions
  addCategory:    (c: Omit<Category, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
}
```

### 5.4 Seed / Default Categories

Shipped on first load if no data exists in localStorage:

| Name | Icon | Default Limit |
|---|---|---|
| Food & Dining | `UtensilsCrossed` | ₦0 |
| Transport | `Car` | ₦0 |
| Shopping | `ShoppingBag` | ₦0 |
| Health | `HeartPulse` | ₦0 |
| Entertainment | `Tv` | ₦0 |
| Utilities | `Zap` | ₦0 |
| Other | `MoreHorizontal` | ₦0 |

---

## 6. UI Layout — Bento Grid

```
┌──────────────────────────────────────────────────────────┐
│  HEADER: Logo · Nav (Dashboard / Expenses / Budgets)     │
│          + Add Expense CTA (top right)                   │
├──────────────┬───────────────────┬───────────────────────┤
│  Total Spent │  Transactions     │  Top Category         │
│  (card)      │  Count (card)     │  (card)               │
├──────────────┴───────────────────┴───────────────────────┤
│  Spending Trend (Line/Bar Chart)          [7D 14D 1M 3M] │
│                                                          │
├──────────────────────────┬───────────────────────────────┤
│  Budget vs. Spent        │  Recent Expenses              │
│  (category progress bars)│  (compact list, last 5)       │
└──────────────────────────┴───────────────────────────────┘
```

Each bento tile animates in on mount with `motion.div` using staggered `initial → animate` opacity + `y` translate. Hover states on cards use a subtle `scale(1.01)` spring.

---

## 7. Key Screens & Components

| Screen | Key Components |
|---|---|
| Dashboard | `SummaryCard`, `SpendingChart`, `BudgetProgress`, `RecentExpenses` |
| Expenses | `ExpenseTable`, `ExpenseForm` (modal), `DeleteConfirm` (popover) |
| Budgets | `CategoryCard`, `CategoryForm` (modal) |
| Shared | `Header`, `FilterBar`, `ExportMenu`, `EmptyState` |

---

## 8. Export Spec

### CSV
Columns: `Date, Vendor, Category, Amount (₦), Note`  
Library: PapaParse `unparse()`  
Trigger: `<a>` tag with `data:text/csv` href

### PDF
Layout: Title + date range + table of expenses + summary totals  
Library: jsPDF (table via `jspdf-autotable`)  
Trigger: `jsPDF.save('expenses-[range].pdf')`

---

## 9. Constraints & Assumptions

- Currency is fixed to **Nigerian Naira (₦)**; no multi-currency support
- Budget limits are evaluated on a **rolling calendar month** basis
- `localStorage` cap is ~5MB; sufficient for thousands of expense records
- No undo/redo — delete is permanent after confirmation
- Responsive down to **375px** (mobile-first grid collapses to single column)
- No dark mode toggle — design is fixed black-and-white

---

## 10. Milestones

| # | Milestone | Scope |
|---|---|---|
| M1 | Scaffolding | Vite + React + Tailwind + shadcn + Zustand + routing |
| M2 | Data Layer | Store, localStorage persistence, seed data |
| M3 | Expense CRUD | List, Add, Edit, Delete with modal/drawer |
| M4 | Dashboard | Cards + Recharts trend chart + period filter |
| M5 | Budgets | Category management + budget progress UI |
| M6 | Export | CSV + PDF export with date range picker |
| M7 | Polish | Motion animations, empty states, responsive tuning |
