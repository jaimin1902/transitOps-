# TransitOps — Production Build Plan
### Smart Transport Operations Platform — Next.js · Prisma · PostgreSQL · shadcn/ui

This turns the hackathon spec into a real, buildable, module-by-module production plan. Build order matches dependency order — each module unlocks the next.

---

## 1. Tech Stack & Architecture Decisions

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Server Components + Server Actions remove need for a separate API layer for most CRUD |
| DB | PostgreSQL | Relational integrity for status machines (vehicle/driver/trip) |
| ORM | Prisma | Type-safe queries, migrations, `$transaction` for atomic multi-table status updates |
| UI | shadcn/ui + Tailwind | Accessible primitives, fast to theme |
| Auth | Auth.js (NextAuth v5) — Credentials provider | Email/password + RBAC via JWT session callback |
| Validation | Zod | Shared schemas between client forms and server actions |
| Forms | React Hook Form + zodResolver | |
| Tables | TanStack Table | Sorting/filtering for Vehicle/Driver/Trip registries |
| Charts | Recharts | KPI + analytics visuals |
| Mutations | Server Actions (not REST) | Colocated, type-safe, less boilerplate than route handlers |
| CSV export | `papaparse` or manual CSV builder in a Route Handler (`/api/export/*`) | Needs a raw response stream, not a Server Action |
| Password hashing | `bcrypt` / `argon2` | |
| State machine logic | Centralized in `/lib/domain/*.ts` service functions, never in components | Single source of truth for business rules |

**Core architectural rule:** every status transition (Vehicle, Driver, Trip, Maintenance) happens inside a `prisma.$transaction` in a domain service function — never as a bare `update()` in a component or a scattered route. This is what prevents the classic bug class here: vehicle flips to `On Trip` but driver update fails, leaving inconsistent state.

---

## 2. Prisma Schema (complete)

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  FLEET_MANAGER
  DRIVER
  SAFETY_OFFICER
  FINANCIAL_ANALYST
  ADMIN
}

enum VehicleStatus {
  AVAILABLE
  ON_TRIP
  IN_SHOP
  RETIRED
}

enum DriverStatus {
  AVAILABLE
  ON_TRIP
  OFF_DUTY
  SUSPENDED
}

enum TripStatus {
  DRAFT
  DISPATCHED
  COMPLETED
  CANCELLED
}

enum MaintenanceStatus {
  OPEN
  CLOSED
}

enum ExpenseType {
  TOLL
  MAINTENANCE
  OTHER
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role
  createdAt    DateTime @default(now())
  driver       Driver?  // optional 1:1 if a Driver logs in themselves
}

model Vehicle {
  id                String        @id @default(cuid())
  registrationNumber String       @unique
  name              String
  type              String
  maxLoadCapacity   Float
  odometer          Float         @default(0)
  acquisitionCost   Float
  status            VehicleStatus @default(AVAILABLE)
  region            String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  trips             Trip[]
  maintenanceLogs   MaintenanceLog[]
  fuelLogs          FuelLog[]
  expenses          Expense[]

  @@index([status])
  @@index([type])
}

model Driver {
  id                String       @id @default(cuid())
  userId            String?      @unique
  user              User?        @relation(fields: [userId], references: [id])
  name              String
  licenseNumber     String       @unique
  licenseCategory   String
  licenseExpiryDate DateTime
  contactNumber     String
  safetyScore       Int          @default(100)
  status            DriverStatus @default(AVAILABLE)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  trips             Trip[]

  @@index([status])
}

model Trip {
  id             String     @id @default(cuid())
  source         String
  destination    String
  vehicleId      String
  driverId       String
  vehicle        Vehicle    @relation(fields: [vehicleId], references: [id])
  driver         Driver     @relation(fields: [driverId], references: [id])
  cargoWeight    Float
  plannedDistance Float
  actualDistance  Float?
  startOdometer   Float?
  endOdometer     Float?
  fuelConsumed    Float?
  status         TripStatus @default(DRAFT)
  createdById    String
  createdAt      DateTime   @default(now())
  dispatchedAt   DateTime?
  completedAt    DateTime?
  cancelledAt    DateTime?

  fuelLogs       FuelLog[]

  @@index([status])
  @@index([vehicleId])
  @@index([driverId])
}

model MaintenanceLog {
  id          String             @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle            @relation(fields: [vehicleId], references: [id])
  type        String
  description String?
  cost        Float              @default(0)
  status      MaintenanceStatus  @default(OPEN)
  startDate   DateTime           @default(now())
  endDate     DateTime?

  @@index([vehicleId, status])
}

model FuelLog {
  id        String   @id @default(cuid())
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])
  tripId    String?
  trip      Trip?    @relation(fields: [tripId], references: [id])
  liters    Float
  cost      Float
  date      DateTime @default(now())

  @@index([vehicleId])
}

model Expense {
  id          String      @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle     @relation(fields: [vehicleId], references: [id])
  type        ExpenseType
  amount      Float
  date        DateTime    @default(now())
  description String?

  @@index([vehicleId])
}
```

---

## 3. Folder Structure

```
transitops/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                # sidebar + role-aware nav
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── vehicles/
│   │   │   │   ├── page.tsx              # registry table
│   │   │   │   └── [id]/page.tsx         # vehicle detail (trips/maint/fuel history)
│   │   │   ├── drivers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── trips/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── maintenance/page.tsx
│   │   │   ├── fuel-expenses/page.tsx
│   │   │   └── reports/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── export/
│   │   │       ├── vehicles/route.ts     # CSV stream
│   │   │       ├── trips/route.ts
│   │   │       └── reports/route.ts
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                           # shadcn primitives
│   │   ├── vehicles/                     # VehicleForm, VehicleTable, StatusBadge
│   │   ├── drivers/
│   │   ├── trips/                        # TripWizard, TripStatusTimeline
│   │   ├── maintenance/
│   │   ├── dashboard/                    # KpiCard, UtilizationChart
│   │   └── shared/                       # DataTable, ConfirmDialog, RoleGate
│   ├── lib/
│   │   ├── domain/                       # <-- business rules live here
│   │   │   ├── vehicle.service.ts
│   │   │   ├── driver.service.ts
│   │   │   ├── trip.service.ts           # dispatch/complete/cancel transactions
│   │   │   ├── maintenance.service.ts
│   │   │   ├── fuel-expense.service.ts
│   │   │   └── analytics.service.ts      # fuel efficiency, utilization, ROI
│   │   ├── auth.ts                       # NextAuth config + RBAC helpers
│   │   ├── prisma.ts                     # singleton client
│   │   ├── validations/                  # zod schemas per entity
│   │   └── rbac.ts                       # permission matrix
│   ├── actions/                          # 'use server' entry points calling domain services
│   │   ├── vehicle.actions.ts
│   │   ├── driver.actions.ts
│   │   ├── trip.actions.ts
│   │   ├── maintenance.actions.ts
│   │   └── fuel-expense.actions.ts
│   └── middleware.ts                     # route protection by role
├── .env
└── package.json
```

---

## 4. Module Plan

### Module 0 — Auth & RBAC (build first, everything depends on it)

**Schema:** `User`, `Role` enum.

**Permission matrix** (`lib/rbac.ts`):

| Action | Fleet Manager | Driver | Safety Officer | Financial Analyst |
|---|---|---|---|---|
| Manage vehicles | ✅ | ❌ | view only | view only |
| Manage drivers | ✅ | ❌ | ✅ (status/compliance) | view only |
| Create/dispatch trips | ✅ | ✅ | ❌ | ❌ |
| Maintenance logs | ✅ | ❌ | view only | view only |
| Fuel/expense entry | ✅ | ✅ (own trips) | ❌ | view only |
| Reports/analytics | ✅ | ❌ | partial (safety score) | ✅ full |

**Build:**
- `middleware.ts` guards `(dashboard)/*` routes — redirect to `/login` if no session.
- `auth.ts`: Credentials provider, `authorize()` checks bcrypt hash, session callback embeds `role` and `driverId` (if any) into JWT.
- `RoleGate` component: `<RoleGate allow={['FLEET_MANAGER','ADMIN']}>...</RoleGate>` wraps UI actions (buttons, forms) — but the *real* enforcement is server-side inside each Server Action (`assertRole(session, [...])` at the top of every action). Never trust the client-hidden button alone.
- Seed script creates one user per role for demo/testing.

---

### Module 1 — Vehicle Registry

**Rules:** unique registration number; status ∈ {Available, On Trip, In Shop, Retired}; Retired/In Shop vehicles excluded from dispatch pool.

**Server Actions (`vehicle.actions.ts` → `vehicle.service.ts`):**
- `createVehicle(data)` — Zod validate, unique constraint caught → friendly error "Registration number already exists".
- `updateVehicle(id, data)`
- `retireVehicle(id)` — only allowed if not currently `ON_TRIP`.
- `listAvailableVehiclesForDispatch()` — `where: { status: 'AVAILABLE' }`, used by Trip creation form.

**UI:**
- `/vehicles` — TanStack Table: Reg No, Model, Type, Status badge (color-coded), Odometer, Actions. Filters: type, status, region (matches dashboard filter spec 3.2).
- `VehicleForm` (create/edit) — RHF + Zod, shadcn `Form`, `Select` for type/status.
- `/vehicles/[id]` — tabs: Overview, Trip History, Maintenance History, Fuel Logs, Cost Summary (feeds Module 6).

---

### Module 2 — Driver Management

**Rules:** status ∈ {Available, On Trip, Off Duty, Suspended}; expired-license or Suspended drivers excluded from trip assignment.

**Server Actions:**
- `createDriver`, `updateDriver`
- `suspendDriver(id, reason)` — Safety Officer only
- `listEligibleDriversForDispatch()` — filters `status = AVAILABLE AND licenseExpiryDate > now()`

**Business-rule detail worth flagging in code comments:** license expiry must be checked **at dispatch time**, not just at driver-list-render time — a license can expire between page load and submit. Re-validate inside the `dispatchTrip` transaction (Module 3), not only in the picker.

**UI:**
- `/drivers` table with License Expiry column highlighted red/amber if <30 days (this also powers the bonus "email reminders" feature later).
- `DriverForm`.
- `/drivers/[id]` — Trip history + safety score trend.

---

### Module 3 — Trip Management (the core state machine)

This is the module where the mandatory business rules concentrate. Build `trip.service.ts` as the single place these run.

**Lifecycle:** `Draft → Dispatched → Completed / Cancelled`

**`createTrip(data)`**
1. Validate cargoWeight ≤ vehicle.maxLoadCapacity (Zod `.refine` cross-field, re-checked server-side against live vehicle row — don't trust client-cached capacity).
2. Insert as `DRAFT`. No status side-effects yet.

**`dispatchTrip(tripId)`** — wrapped in `prisma.$transaction`:
1. Re-fetch vehicle + driver fresh inside the transaction.
2. Assert vehicle.status === AVAILABLE, driver.status === AVAILABLE, driver license not expired, driver not SUSPENDED.
3. Assert cargoWeight ≤ vehicle.maxLoadCapacity (re-check, not just at creation).
4. Update trip → `DISPATCHED`, `dispatchedAt = now()`.
5. Update vehicle → `ON_TRIP`.
6. Update driver → `ON_TRIP`.
7. All four steps in one `$transaction` — if any assertion fails, throw before any writes so nothing partially commits.

**`completeTrip(tripId, { endOdometer, fuelConsumed })`**:
1. Trip must be `DISPATCHED`.
2. Update trip → `COMPLETED`, `completedAt`, `actualDistance = endOdometer - startOdometer`.
3. Update vehicle → `AVAILABLE`, `odometer = endOdometer`.
4. Update driver → `AVAILABLE`.
5. Optionally create a `FuelLog` row from `fuelConsumed` in the same transaction.

**`cancelTrip(tripId)`**:
1. Only valid from `DISPATCHED` (or `DRAFT`, trivially).
2. If was `DISPATCHED`: vehicle → `AVAILABLE`, driver → `AVAILABLE`.
3. Trip → `CANCELLED`, `cancelledAt`.

**UI:**
- `/trips/new` — a `TripWizard`: pick source/destination → pick vehicle (only `AVAILABLE` list) → pick driver (only eligible list) → enter cargo weight (live validation against selected vehicle's capacity, shadcn inline error) → planned distance.
- `/trips` — table filterable by status, with dispatch/complete/cancel actions rendered conditionally on current status (a small `TripStatusTimeline` badge component).
- `/trips/[id]` — full detail + action buttons gated by `RoleGate` (Fleet Manager, Driver).

---

### Module 4 — Maintenance

**Rule:** creating an *open* maintenance record flips vehicle → `IN_SHOP` (hidden from dispatch pool automatically since Module 1's `listAvailableVehiclesForDispatch` filters by status). Closing it restores vehicle → `AVAILABLE`, unless vehicle is `RETIRED`.

**Server Actions (`maintenance.service.ts`):**
- `createMaintenanceLog(vehicleId, data)` — transaction: insert log (`status: OPEN`) + vehicle.status → `IN_SHOP`. Reject if vehicle currently `ON_TRIP` (must complete/cancel trip first) or already `RETIRED`.
- `closeMaintenanceLog(id, { cost, endDate })` — transaction: log → `CLOSED`, vehicle → `AVAILABLE` **only if** `vehicle.status !== RETIRED`.

**UI:**
- `/maintenance` — table of logs (Open/Closed filter), "New Maintenance" dialog (vehicle picker excludes `ON_TRIP`/`RETIRED`).
- Vehicle detail page shows maintenance history tab (Module 1).

---

### Module 5 — Fuel & Expense Management

**Rules:** log fuel (liters, cost, date, optional trip link) and expenses (toll/maintenance/other). Auto-compute total operational cost per vehicle = Σ fuel.cost + Σ expense.amount (where `type = MAINTENANCE` reconciles with actual `MaintenanceLog.cost`, or treat `Expense` as the toll/misc bucket and `MaintenanceLog.cost` as the maintenance bucket — pick one source of truth, don't double count. **Recommendation:** operational cost = `Σ FuelLog.cost + Σ MaintenanceLog.cost + Σ Expense.amount(type != MAINTENANCE)`).

**Server Actions (`fuel-expense.service.ts`):**
- `logFuel(vehicleId, tripId?, liters, cost, date)`
- `logExpense(vehicleId, type, amount, date, description)`
- `getVehicleOperationalCost(vehicleId)` — aggregation query, used by Reports (Module 6) and Vehicle detail page.

**UI:**
- `/fuel-expenses` — two tabs (Fuel Logs, Expenses), each a table + "Add" dialog with vehicle picker.
- Cost summary card on Vehicle detail page.

---

### Module 6 — Dashboard (KPIs)

**KPIs (spec 3.2):** Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization %.

**`analytics.service.ts` — `getDashboardKpis(filters)`:**
```
activeVehicles     = count(Vehicle) where status != RETIRED
availableVehicles  = count(Vehicle) where status = AVAILABLE
inMaintenance      = count(Vehicle) where status = IN_SHOP
activeTrips        = count(Trip) where status = DISPATCHED
pendingTrips       = count(Trip) where status = DRAFT
driversOnDuty      = count(Driver) where status = ON_TRIP
fleetUtilization%  = (count Vehicle where status = ON_TRIP) / activeVehicles * 100
```
All queries accept `{ vehicleType?, status?, region? }` filters per spec — implement as a single `where` builder shared with the Vehicle Registry filter bar for consistency.

**UI:**
- `/dashboard` — `KpiCard` grid (shadcn `Card`), filter bar (type/status/region using shadcn `Select` + `DropdownMenu`), a Recharts bar/pie for utilization by type/region.

---

### Module 7 — Reports & Analytics

**Formulas (spec 3.8):**
```
Fuel Efficiency (per vehicle) = totalDistance / totalFuelLiters
Fleet Utilization             = (as above, dashboard-level or per-period)
Operational Cost (per vehicle)= Fuel + Maintenance (+ non-maintenance expenses)
Vehicle ROI                   = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
```
`Revenue` isn't in the spec's entity list — treat as a derived/optional input: either (a) add a `revenue` field to `Trip` if the org bills per trip, or (b) let Financial Analyst manually enter per-vehicle revenue for the ROI calc. Flag this explicitly to the user building it — the spec has a gap here, decide before coding Module 7.

**`analytics.service.ts` additions:**
- `getFuelEfficiencyReport()` — group by vehicle.
- `getOperationalCostReport()` — group by vehicle, date range filter.
- `getRoiReport()` — needs the revenue decision above.

**UI:**
- `/reports` — tabbed report views, each with a shadcn `DataTable` + Recharts visualization + "Export CSV" button.
- **CSV export** — implement as a Route Handler (`/api/export/reports/route.ts`) returning `Content-Type: text/csv` with a `Content-Disposition: attachment` header, since Server Actions can't stream file downloads directly. Build CSV rows server-side from the same query functions as the on-screen report so numbers never drift between UI and export.

---

### Module 8 — Vehicle Document Management (bonus, but design it properly)

Spec deliverable, no schema given — add one:

```prisma
model VehicleDocument {
  id         String   @id @default(cuid())
  vehicleId  String
  vehicle    Vehicle  @relation(fields: [vehicleId], references: [id])
  type       String   // Registration, Insurance, Permit, PUC, etc.
  fileUrl    String   // S3 / R2 / Vercel Blob URL
  expiryDate DateTime?
  uploadedAt DateTime @default(now())
}
```
- Upload via signed URL (Vercel Blob, S3, or Cloudflare R2) — never store binary in Postgres.
- Same expiry-highlight pattern as Driver license (red/amber badge if `expiryDate` is within 30 days) — reuse the component.
- Shown as a tab on `/vehicles/[id]`.

### Module 9 — License / Document Expiry Reminders (bonus)

- Add `NotificationLog` table (`id, type, referenceId, sentAt`) so a daily cron doesn't re-send the same reminder every run.
- Implement as a Route Handler (`/api/cron/expiry-check`) triggered by Vercel Cron (or any scheduler) — not a Server Action, since nothing calls it from the UI.
- Query: drivers with `licenseExpiryDate` within 30 days AND no `NotificationLog` entry for today; same for `VehicleDocument.expiryDate`.
- Send via Resend/SendGrid; log the send.

### Module 10 — Safety & Compliance View (Safety Officer's dedicated module)

The spec gives Safety Officer a distinct job description ("ensures driver compliance, tracks license validity, monitors safety scores") that the original plan only handled as scattered view-only permissions. Give it a real screen:

- `/compliance` — table of all drivers sorted by soonest license expiry, with a safety-score column and a "Suspend" action (writes `Driver.status = SUSPENDED`, Safety Officer only — already in the RBAC matrix, just needed a home).
- `updateSafetyScore(driverId, delta, reason)` action — Safety Officer only, logs the change (ties into the audit log below).

### Module 11 — Global Search

- One search bar in the dashboard layout header, debounced, hitting a `globalSearch(query)` server action that does three lightweight `findMany` queries (vehicle reg number, driver name/license, trip source/destination) and renders a grouped dropdown of results.
- Per-table column search/sort already comes from TanStack Table — this is the additional cross-entity search the deliverables list calls for.

---

## 5. Cross-Cutting Concerns (production, not hackathon)

- **Responsive design** — explicit mandatory deliverable, not optional polish. Build every table view with a card-list fallback below `md` breakpoint (Tailwind), and test the Trip Wizard and KPI grid at mobile width, not just desktop.
- **PDF export (optional per spec)** — CSV is mandatory and built above; if you add PDF later, generate it server-side in the same Route Handler pattern using `@react-pdf/renderer` or Puppeteer against the same query functions as CSV — don't build a second data path.
- **Users/Roles as data, not just an enum** — the spec's entity list (section 6) names Users and Roles separately. The enum in this plan is the fast path; if you want roles to be configurable without a redeploy, replace the `Role` enum with a `Role` model + a join table and keep `lib/rbac.ts`'s permission matrix keyed by role name instead of a TS enum. Decide this before Module 0, since it's a schema shape choice, not a later refactor.
- **Audit log** — not in the spec, but four roles mutate shared vehicle/driver/trip state; add an `AuditLog(id, userId, action, entityType, entityId, at)` row written inside the same `$transaction` as every dispatch/complete/cancel/suspend/close-maintenance call, so "who did this and when" is answerable.
- **Pagination, loading, empty states** — every TanStack Table needs server-side pagination once seed data grows past a page; every async action needs a pending/skeleton state (shadcn `Skeleton`) and an explicit empty state, not a blank table.

- **Validation:** one Zod schema per entity in `lib/validations/`, imported by both the RHF form (`zodResolver`) and the Server Action (re-validate server-side — never trust client validation alone).
- **Optimistic concurrency:** trip dispatch/cancel/complete should re-fetch inside the transaction (shown above) to avoid race conditions from two managers acting on the same trip simultaneously.
- **Error handling:** domain services throw typed errors (e.g., `class BusinessRuleError extends Error`); Server Actions catch and return `{ error: string }` to the form instead of a raw stack trace.
- **Testing:** unit-test `trip.service.ts` and `maintenance.service.ts` first — this is where the mandatory business rules live and where regressions hurt most. Use a test Postgres schema + Prisma's `--preview-feature` migrate reset, or mock the Prisma client.
- **Migrations:** `prisma migrate dev` locally, `prisma migrate deploy` in CI/CD before app start.
- **Env:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
- **Deployment:** Vercel (Next.js) + managed Postgres (Neon/Supabase/RDS). Run migrations as a build/release step, not on every cold start.

---

## 6. Suggested Build Order

1. Prisma schema + migrate + seed (decide enum-vs-Role-table now) → 2. Auth/RBAC → 3. Vehicle Registry CRUD → 4. Driver Management CRUD → 5. Trip creation (Draft only) → 6. Trip dispatch/complete/cancel transactions, with audit log writes (the hard part) → 7. Maintenance workflow → 8. Fuel & Expense logging → 9. Dashboard KPIs → 10. Reports + CSV export → 11. Safety & Compliance view (Module 10) → 12. Global search (Module 11) → 13. Vehicle documents (Module 8) → 14. Expiry email reminders (Module 9) → 15. Responsive pass + pagination/loading/empty states across all tables → 16. Dark mode, PDF export if time allows.

This order means every module you finish is independently demoable, and the trickiest transactional logic (Module 3) gets built once vehicle/driver data actually exists to test against. Responsive design is pushed to step 15 here for sequencing, but treat it as a constraint you build *into* every component from step 3 onward, not a retrofit — the spec lists it first for a reason.
