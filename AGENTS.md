# AGENTS.md — Lagos Business Outreach Tool

This file guides AI agents (Claude, Cursor, Copilot, etc.) working on this codebase.
Read it fully before making any changes.

---

## Project Summary

A local full-stack tool for Toyosi Adekanmbi to find Lagos businesses without proper websites
via Google Places API, manage leads through an approval workflow, and send personalized cold
outreach emails. Supports phone contact tracking as a parallel outreach channel.
Runs entirely on the developer's local machine — no cloud deployment, no auth, single user.

---

## Domain Language

See `CONTEXT.md` for the canonical glossary. Key terms:

- **Lead** — a business discovered via Places API that lacks a proper website
- **Approved Lead** — user intends to contact (email optional at approval time)
- **Contacted** — any lead that received outreach (email or phone)
- **Template** — reusable email body per business type, selected per-lead at send time
- **Note** — immutable, timestamped activity log entry on a lead

---

## Monorepo Structure

```
outreach-tool/
├── CONTEXT.md                 # Domain glossary
├── AGENTS.md                  # This file
├── aboutme.md                 # User profile (reference only)
├── PRD.md                     # Product requirements
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── leads.ts       # CRUD + status transitions + email/phone tracking
│   │   │   ├── fetch.ts       # Trigger Google Places fetch
│   │   │   ├── email.ts       # Send email, preview, templates CRUD
│   │   │   └── settings.ts    # Default fetch values
│   │   ├── services/
│   │   │   ├── placesService.ts   # Google Places API integration
│   │   │   └── emailService.ts    # Nodemailer + template rendering
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── types.ts           # Shared TypeScript types
│   │   └── index.ts           # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Single source of truth for DB schema
│   │   └── dev.db             # SQLite database (do not commit)
│   ├── .env                   # Secrets (do not commit)
│   ├── .env.example           # Committed env template
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── FetchLeads.tsx     # Filter form + manual fetch trigger
    │   │   ├── LeadsQueue.tsx     # Review fetched leads, approve/reject
    │   │   ├── ApprovedLeads.tsx  # Add email, preview, tweak, send one-at-a-time
    │   │   ├── Contacted.tsx      # Track emailed/replied + phone-contacted leads
    │   │   └── Settings.tsx       # Default values + email template management
    │   ├── components/            # Shared UI components
    │   ├── api/
    │   │   └── client.ts          # fetch-based HTTP client (not Axios)
    │   └── App.tsx
    └── package.json
```

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Backend runtime | Node.js + TypeScript | Use strict mode |
| Web framework | Express.js | No NestJS, no Fastify |
| ORM | Prisma | SQLite adapter |
| Database | SQLite | Single `dev.db` file, local only |
| Frontend | React + Vite (TypeScript) | No Next.js |
| Styling | Tailwind CSS | Utility classes only |
| HTTP client | fetch (native) | Wrapped in `src/api/client.ts` |
| Email | Nodemailer | Gmail SMTP with app password |
| Places data | Google Places API (New) | `searchNearby` endpoint |
| State | React Query (`@tanstack/react-query`) | No v5 scheduler — manual fetch only |

---

## Environment Variables

All secrets live in `backend/.env`. Never hardcode them.

```env
# Google Places
GOOGLE_PLACES_API_KEY=

# Gmail SMTP
GMAIL_USER=
GMAIL_APP_PASSWORD=

# Sender identity (used in email signature)
SENDER_NAME=
SENDER_PHONE=
SENDER_PORTFOLIO=

# Server
PORT=3001
```

---

## Database Schema

Defined in `backend/prisma/schema.prisma`. Do not edit the DB directly.
Always use `npx prisma migrate dev` after schema changes.

### Lead model

```prisma
model Lead {
  id              String     @id @default(uuid())
  placeId         String     @unique          // Google Place ID — deduplication key
  name            String
  address         String
  phone           String?
  rating          Float?
  mapsUrl         String
  onlinePresence  String?                     // Raw websiteUri from Places API (may be social URL or null)
  businessType    String
  location        String
  status          String     @default("FETCHED")  // LeadStatus values
  email           String?                     // Manually added by user before sending
  phoneContactedAt DateTime?                  // When user marked phone contact
  emailSentAt     DateTime?
  notes           Note[]                      // Immutable activity log entries
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}
```

### Note model

```prisma
model Note {
  id        String   @id @default(uuid())
  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  text      String
  createdAt DateTime @default(now())
}
```

### Template model

```prisma
model Template {
  id           String   @id @default(uuid())
  businessType String   @unique          // One template per business type
  subject      String
  body         String
  updatedAt    DateTime @updatedAt
}
```

### Settings model

```prisma
model Settings {
  id              Int      @id @default(1)   // Singleton row
  defaultBizType  String   @default("restaurant")
  defaultLocation String   @default("Victoria Island, Lagos")
  defaultRadius   Int      @default(2000)    // metres
  updatedAt       DateTime @updatedAt
}
```

---

## Lead Status Rules

Status is stored as a String field. Agents must respect these transitions.
Never skip steps or go backwards.

```
FETCHED --> APPROVED   (user clicks Approve)
FETCHED --> REJECTED   (user clicks Reject)
APPROVED --> EMAILED   (email sent successfully)
EMAILED --> REPLIED    (user manually marks replied)
```

- Approval means "I want to contact this business" — email is NOT required at approval time.
- Only leads with status `APPROVED` may be emailed.
- Leads without an email address cannot be sent to (validated server-side).
- Once `EMAILED` or `REPLIED`, status must not be changed back.
- `REJECTED` leads are kept in the DB but never shown in the active queue.
- `phoneContactedAt` is an independent timestamp — does not affect email status.
- Notes are append-only and immutable — never edit or delete a note after creation.

---

## Places API Filtering Logic

- Use the **Places API (New)** — `POST https://places.googleapis.com/v1/places:searchNearby`
- Always include `X-Goog-FieldMask` header with required fields
- Filtering logic for `websiteUri`:
  - **Absent** (no website at all) → KEEP as lead
  - **Social URL** (`facebook.com`, `instagram.com`) → KEEP as lead (no real website)
  - **Real domain** (`business.com`, `business.ng`, etc.) → SKIP (already has website)
- The `onlinePresence` field stores the raw `websiteUri` for reference
- Always check `placeId` against existing DB records before inserting (deduplication)
- Log the number of raw results vs saved results after each fetch

---

## API Contract

Base URL: `http://localhost:3001/api`

### Leads

```
GET    /leads                  Query params: status, businessType, location
GET    /leads/:id              Returns lead with notes included
PATCH  /leads/:id/approve      Status: FETCHED → APPROVED
PATCH  /leads/:id/reject       Status: FETCHED → REJECTED
PATCH  /leads/:id/replied      Status: EMAILED → REPLIED
PATCH  /leads/:id/email        Body: { email: string }
PATCH  /leads/:id/phone-contacted  Sets phoneContactedAt to now
PATCH  /leads/:id/notes        Body: { text: string } — creates new immutable note
DELETE /leads/:id
```

### Fetch

```
POST   /fetch                  Body: FetchFilters
```

### Email

```
GET    /email/preview/:id      Returns rendered email subject + body for a lead
POST   /email/:id              Send email to one approved lead. Body: { customBody?: string }
GET    /email/templates        List all email templates
POST   /email/templates        Upsert template. Body: { businessType, subject, body }
DELETE /email/templates/:businessType
```

### Settings

```
GET    /settings
PUT    /settings               Body: Partial<Settings>
```

---

## Shared Types

Defined in `backend/src/types.ts`:

```typescript
export interface FetchFilters {
  businessType: string;
  location: string;
  lat: number;
  lng: number;
  radius: number;         // metres, max 50000
  minRating?: number;     // 1–5
  maxResults?: number;    // default 20, max 60
}

export type LeadStatus = 'FETCHED' | 'APPROVED' | 'REJECTED' | 'EMAILED' | 'REPLIED';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
```

---

## Email Rules

- Use `nodemailer` with Gmail SMTP (`smtp.gmail.com`, port 465, SSL)
- Use `GMAIL_APP_PASSWORD` — never the account password
- Template placeholders: `{{businessName}} {{businessType}} {{businessAddress}} {{businessPhone}}`
- Sender placeholders: `{{senderName}} {{senderPhone}} {{senderEmail}} {{senderPortfolio}}`
- Templates are managed per business type on the Settings page
- Always call preview logic server-side before sending
- On send failure, log the error and leave the lead status as `APPROVED` (do not mark as EMAILED)
- Never send to a lead that is not in `APPROVED` status — validate server-side
- No bulk sending in v1 — emails are sent one at a time with preview/edit first

---

## Frontend Conventions

- All API calls go through `src/api/client.ts` — uses native `fetch`, not Axios
- Use React Query (`@tanstack/react-query`) for data fetching and cache invalidation
- Page components live in `src/pages/`, reusable UI in `src/components/`
- Use Tailwind for all styling — no inline styles, no CSS modules
- Status badges use consistent colors:
  - `FETCHED` → gray
  - `APPROVED` → blue
  - `REJECTED` → red
  - `EMAILED` → yellow
  - `REPLIED` → green

---

## Backend Conventions

- All route handlers are thin — business logic lives in `services/`
- Return consistent JSON shapes:
  ```json
  { "data": ..., "error": null }
  { "data": null, "error": "message" }
  ```
- Use `try/catch` in every route handler — never let unhandled errors crash the server
- Log all fetch runs: timestamp, filters used, results count, saved count
- Log all email sends: timestamp, lead id, lead name, success/failure

---

## Running Locally

```bash
# Backend
cd backend
cp .env.example .env       # Fill in your keys
npm install
npx prisma migrate dev
npm run dev                # Starts on port 3001

# Frontend
cd frontend
npm install
npm run dev                # Starts on port 5173
```

---

## What Agents Should NOT Do

- Do not add authentication or session management — this is a local tool for one person
- Do not change the database from SQLite to PostgreSQL without explicit instruction
- Do not use `any` in TypeScript — use proper types or `unknown`
- Do not commit `.env` or `dev.db`
- Do not send emails to leads with status other than `APPROVED`
- Do not send to leads without an email address
- Do not modify `prisma/schema.prisma` without running `prisma migrate dev` afterward
- Do not edit or delete notes — they are append-only and immutable
- Do not add new npm packages without checking if an existing one already covers the need
- Do not create new API routes that bypass the lead status rules defined above
- Do not add scheduling/automation in v1 — all operations are manual
