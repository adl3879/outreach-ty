# Product Requirements Document
## Lagos Business Outreach Tool

**Version:** 1.0  
**Author:** Internal  
**Date:** June 2026  
**Status:** Draft

---

## 1. Overview

### 1.1 Purpose
A personal productivity tool that helps a freelance web developer identify Lagos-based businesses without websites, manage and approve leads, and send personalized cold outreach emails — all from a single dashboard.

### 1.2 Problem Statement
Manually finding businesses without websites, researching their contact details, and sending individual emails is time-consuming and inconsistent. There is no structured way to track which businesses have been contacted, approved, rejected, or have replied.

### 1.3 Goals
- Automate lead discovery from Google Places API based on configurable filters
- Provide a dashboard to review, approve, or reject leads before outreach
- Send personalized emails to approved leads and track their status
- Support both manual and scheduled lead fetching

### 1.4 Non-Goals
- This is not a CRM for managing long-term client relationships
- It does not scrape Instagram or other social platforms (out of scope for v1)
- It does not handle invoicing or contract management

---

## 2. Users

This tool has a single user — the developer running it locally. There is no multi-user or authentication requirement for v1.

---

## 3. System Architecture

### 3.1 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Express.js + TypeScript |
| Database | SQLite via Prisma ORM |
| Frontend | React + Vite (TypeScript) |
| Lead Source | Google Places API |
| Email | Nodemailer (Gmail SMTP) |
| Scheduler | node-cron |

### 3.2 High-Level Flow

```
Google Places API
      |
      v
  Fetcher Service  <-- triggered manually or by cron
      |
      v
  SQLite Database  (status: fetched)
      |
      v
  Dashboard (review leads)
      |
   Approve / Reject
      |
      v
  Email Service  (status: emailed)
      |
      v
  Track replies (status: replied) -- manual update in v1
```

---

## 4. Features

### 4.1 Lead Fetching

#### 4.1.1 Manual Fetch
The user can trigger a fetch from the dashboard by selecting filter parameters and clicking "Fetch Leads".

#### 4.1.2 Scheduled Fetch
The user can configure a cron schedule (e.g. daily at 8am) to automatically fetch new leads in the background using node-cron.

#### 4.1.3 Fetch Filters

| Filter | Type | Description |
|---|---|---|
| Business Type | String (dropdown) | e.g. restaurant, salon, clinic, hotel, school |
| Location | String (dropdown or text) | e.g. Victoria Island, Lekki, Ikeja, Surulere |
| Radius | Number (km) | Search radius from location center. Default: 2km |
| Minimum Rating | Number (1–5) | Optional. Filter out low-rated businesses |
| Exclude with website | Boolean | Always true by default — core filter |
| Max results per fetch | Number | Cap on results per run. Default: 20 |

#### 4.1.4 Deduplication
Before saving, the system checks if a Place ID already exists in the database. Duplicates are silently skipped.

---

### 4.2 Lead Data Model

Each lead stored in the database contains:

| Field | Type | Description |
|---|---|---|
| id | String (UUID) | Internal ID |
| placeId | String | Google Place ID (unique) |
| name | String | Business name |
| address | String | Full address |
| phone | String (nullable) | Phone number from Places API |
| rating | Float (nullable) | Google rating |
| mapsUrl | String | Direct Google Maps link |
| website | String (nullable) | Populated if found — used for filtering |
| businessType | String | Category used during fetch |
| location | String | Location label used during fetch |
| status | Enum | fetched, approved, rejected, emailed, replied |
| notes | String (nullable) | User-added notes |
| emailSentAt | DateTime (nullable) | Timestamp of email send |
| createdAt | DateTime | When the lead was fetched |
| updatedAt | DateTime | Last status change |

#### Lead Status Flow

```
fetched --> approved --> emailed --> replied
       \--> rejected
```

---

### 4.3 Dashboard — Leads Queue

Displays all leads with status `fetched`. For each lead the user can see:
- Business name
- Address
- Phone number
- Google Maps link (opens in new tab)
- Rating
- Business type and location label
- Action buttons: **Approve** | **Reject**

Supports filtering the queue by business type, location, and status.

---

### 4.4 Dashboard — Approved Leads

Displays all leads with status `approved`. For each lead the user can:
- View full details
- Preview the personalized email that will be sent
- Click **Send Email** to send to that lead individually
- Click **Send All** to send to all approved leads in bulk (with rate limiting)

---

### 4.5 Email System

#### 4.5.1 Email Template
A single configurable email template with dynamic placeholders:

```
Subject: Your business deserves a website, [Business Name]

Hi [Business Name],

I came across your business on Google Maps and noticed you don't have a website yet.

In Lagos today, most customers search online before visiting or calling a business.
Without a website, you're likely losing customers to competitors who have one.

I build clean, affordable websites for Lagos businesses — including restaurants,
salons, clinics, and more. Here are a few things I can offer:

- A professional website live in 5–7 days
- Mobile-friendly design
- WhatsApp chat button and Google Maps integration
- Affordable pricing with flexible payment

I'd love to show you some examples. Would you be open to a quick chat?

Best regards,
[Your Name]
[Your Phone]
[Your Website / Portfolio]
```

#### 4.5.2 Email Configuration
Stored in a local `.env` file:
- `GMAIL_USER` — sender Gmail address
- `GMAIL_APP_PASSWORD` — Gmail app password (not account password)
- `SENDER_NAME` — name shown in email signature
- `SENDER_PHONE` — phone number in signature
- `SENDER_PORTFOLIO` — portfolio URL in signature

#### 4.5.3 Rate Limiting
To avoid Gmail spam flags, emails are sent with a configurable delay between each send. Default: 30 seconds between emails.

#### 4.5.4 Tracking
After a successful send, the lead status is updated to `emailed` and `emailSentAt` is recorded.

---

### 4.6 Sent Leads View

Displays all leads with status `emailed` or `replied`. Shows:
- Business name, address, phone
- Date emailed
- Status badge (emailed / replied)
- Button to manually mark as **Replied**
- Notes field for adding context (e.g. "Called back, interested")

---

### 4.7 Scheduler Configuration

The user can configure the auto-fetch schedule from a Settings page:
- Enable/disable auto-fetch
- Set cron expression (with a human-readable preview, e.g. "Every day at 8:00 AM")
- Set default filters for scheduled fetches (business type, location, radius)

---

## 5. API Endpoints

### Leads

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/leads | Get all leads (with optional status filter) |
| GET | /api/leads/:id | Get a single lead |
| PATCH | /api/leads/:id/approve | Approve a lead |
| PATCH | /api/leads/:id/reject | Reject a lead |
| PATCH | /api/leads/:id/replied | Mark lead as replied |
| PATCH | /api/leads/:id/notes | Update notes on a lead |
| DELETE | /api/leads/:id | Delete a lead |

### Fetch

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/fetch | Trigger a manual fetch with filter params in body |
| GET | /api/fetch/status | Get status of last fetch (count, timestamp) |

### Email

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/email/:id | Send email to a single approved lead |
| POST | /api/email/bulk | Send emails to all approved leads |
| GET | /api/email/preview/:id | Preview personalized email for a lead |

### Settings

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/settings | Get current scheduler and template settings |
| PUT | /api/settings | Update settings |

---

## 6. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| Runtime | Runs locally on developer's machine |
| Performance | Fetch + save 20 leads in under 10 seconds |
| Reliability | Duplicate leads must never be inserted |
| Data Safety | SQLite file should be committed or backed up manually |
| Email Safety | Rate limiting must be enforced to avoid Gmail blocks |
| API Key Safety | Google Places API key stored in `.env`, never committed |

---

## 7. Out of Scope (v1)

- User authentication
- Instagram or social media scraping
- Automatic reply detection
- AI-generated email personalization per business
- Hosting / cloud deployment
- Payment or invoicing integration

---

## 8. Future Enhancements (v2+)

- AI-personalized email body per lead using Claude API (mention business name, location, niche-specific pain point)
- Instagram lead source integration
- Auto-detect replies via Gmail API
- Export leads to CSV
- Lead scoring based on rating, reviews count, niche
- Multi-template support per business type

---

## 9. Project Structure

```
outreach-tool/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── leads.ts
│   │   │   ├── fetch.ts
│   │   │   ├── email.ts
│   │   │   └── settings.ts
│   │   ├── services/
│   │   │   ├── placesService.ts
│   │   │   └── emailService.ts
│   │   ├── scheduler.ts
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── FetchLeads.tsx
    │   │   ├── LeadsQueue.tsx
    │   │   ├── ApprovedLeads.tsx
    │   │   ├── SentLeads.tsx
    │   │   └── Settings.tsx
    │   └── App.tsx
    └── package.json
```

---

## 10. Milestones

| Milestone | Deliverable |
|---|---|
| M1 | Prisma schema + SQLite setup |
| M2 | Google Places fetcher service with filters |
| M3 | REST API (leads, fetch, email endpoints) |
| M4 | React dashboard — Leads Queue + Approve/Reject |
| M5 | Email service + Send flow |
| M6 | Scheduler + Settings page |
| M7 | End-to-end test: fetch → approve → email |