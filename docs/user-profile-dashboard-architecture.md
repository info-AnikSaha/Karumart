# User Profile Dashboard — Architecture

Design for the KaruMart **customer-facing** self-service dashboard (the buyer's
"My Account" area of the future storefront), plus notes on how it shares code with
the already-implemented **admin** user-detail page (`src/pages/UserProfile.jsx`).

> The admin panel in this repo implements the admin-side view today. The customer
> dashboard described here targets a separate storefront app but is designed to
> reuse this repo's data layer, hooks, and status components verbatim.

---

## 1. Goals

- Let a signed-in buyer view and manage their profile, browse order history, and
  **track any order's status in real time** without refreshing.
- Reuse a single source of truth for order status (labels, colors, transitions)
  and the same tracking UI the admin uses.
- Enforce strict data isolation: a buyer sees only their own orders.

---

## 2. System Components

```
CustomerDashboard (authenticated shell)
├── ProfileOverview        — avatar, name, contact, lifetime stats
├── MyOrders               — live list of the buyer's orders (+ filters)
│    └── OrderCard          — summary row → links to OrderTracking
├── OrderTracking          — single order: stepper + timeline + items (live)
├── Addresses              — saved shipping addresses (CRUD)
├── AccountSettings        — name / phone / password / preferences
└── Notifications          — status-change alerts (derived from realtime events)
```

| Component | Responsibility | Data source | Reuses |
|-----------|----------------|-------------|--------|
| `ProfileOverview` | Identity + KPI tiles (orders, spend, active) | `profiles`, derived from `orders` | Stat-tile pattern from `pages/UserProfile.jsx` |
| `MyOrders` | Buyer's orders, newest first, live-updating | `useRealtimeOrders({ customerId })` | **`hooks/useRealtimeOrders.js`**, `OrderStatusBadge` |
| `OrderTracking` | One order's lifecycle + audit trail, live | `useOrderTracking(orderId)` | **`hooks/useOrderTracking.js`**, `OrderStatusStepper`, `OrderStatusTimeline` |
| `Addresses` | Manage shipping addresses | `addresses` table (future) | — |
| `AccountSettings` | Edit profile / auth | `profiles`, `supabase.auth` | `AuthContext` pattern |
| `Notifications` | Surface status changes | Realtime `postgres_changes` events | Same channel subscription |

**Shared, framework-agnostic building blocks (already in this repo):**
- `src/lib/orders.js` — `ORDER_STATUSES`, `ORDER_FLOW`, `allowedNext`, `getStatus`, `summarizeItems`, and all data helpers.
- `src/lib/orderId.js` — parse / validate order numbers.
- `src/hooks/useRealtimeOrders.js`, `src/hooks/useOrderTracking.js`.
- `src/components/OrderStatusBadge.jsx`, `OrderStatusStepper.jsx`, `OrderStatusTimeline.jsx`.

The stepper, timeline, and badge are **presentational and role-agnostic** — the
customer dashboard imports them unchanged. Only the *write* affordances differ:
the admin can change status; the customer view is read-only tracking.

---

## 3. Data Flow

```
                        ┌────────────────────────────┐
   Buyer action ─────▶  │ Supabase (Postgres + RLS)  │
   (place order,        │  orders / order_status_    │
    admin updates)      │  history / profiles        │
                        └────────────┬───────────────┘
                                     │ logical replication
                        ┌────────────▼───────────────┐
                        │  Supabase Realtime          │
                        │  (postgres_changes, RLS-    │
                        │   scoped per JWT)           │
                        └────────────┬───────────────┘
              initial fetch          │ live INSERT/UPDATE
                     │               │
              ┌──────▼───────────────▼──────┐
              │  React hooks                 │
              │  useRealtimeOrders / …Track  │
              └──────────────┬───────────────┘
                             │ state
              ┌──────────────▼───────────────┐
              │  Components (stepper/timeline)│
              └───────────────────────────────┘
```

- **Reads**: hooks do one initial `fetch*` then subscribe to `postgres_changes`.
- **Writes**: customers create orders (checkout); status transitions are made by
  admin/logistics. The DB trigger logs every transition into `order_status_history`.
- **Order numbers**: assigned by the DB `BEFORE INSERT` trigger (`KM-YYMMDD-NNNN`).
  Clients never generate them; `orderId.js` only parses/validates.

---

## 4. Security & Access

Row Level Security (defined in `supabase/migrations/0001_orders_tracking.sql`):

- `orders_buyer_read` — `USING (auth.uid() = customer_id)`: a buyer can `SELECT`
  only their own orders.
- `osh_buyer_read` — buyer can read history rows for their own orders only.
- `orders_admin_all` / `osh_admin_all` — admins have full access via `is_admin()`.

**Realtime respects RLS**: the customer's socket only receives change events for
rows they can `SELECT`, so `useRealtimeOrders({ customerId })` in a buyer session
naturally receives only that buyer's events — no client-side filtering required for
security (the `customerId` filter in the hook is a UX optimization, not the
security boundary).

Denormalized `customer_name/email/phone/shipping_address` on `orders` mean neither
display nor realtime needs to join back to `profiles`, avoiding cross-table RLS
interactions.

---

## 5. Routing (proposed storefront)

```
/account                     → ProfileOverview
/account/orders              → MyOrders
/account/orders/:id          → OrderTracking
/account/addresses           → Addresses
/account/settings            → AccountSettings
```

Auth boundary mirrors this repo's `ProtectedRoute` in `src/App.jsx`, but gates on a
signed-in buyer (any authenticated user) instead of `profile.role === 'admin'`.

---

## 6. State Management

- **Server state**: the two realtime hooks own it (fetch + subscribe + reconcile).
  No global store needed; each page mounts the hook it requires.
- **Session/auth**: an `AuthContext` identical in shape to
  `src/context/AuthContext.jsx` (user + profile + `signIn`/`signOut`).
- **Local UI state**: `useState` within components (filters, selected order, modals).
- **Notifications**: a thin layer over the same realtime channel — push a toast
  when an `UPDATE` changes `status` for one of the buyer's orders.

---

## 7. Extension Points

- `addresses` table + `Addresses` component (add RLS `auth.uid() = user_id`).
- Push/email notifications via Supabase Edge Functions triggered on
  `order_status_history` inserts.
- Reorder / cancel actions from `OrderTracking` (respect `allowedNext`, e.g. a
  buyer may cancel only while `status IN ('pending','confirmed')`).
