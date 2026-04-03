# Support Inbox Triage Automation
### N8N Automation Specialist Assessment — Purple Merit Technologies
**Author:** Mashooque | mashooque.automation@gmail.com

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Classification Rules](#3-classification-rules)
4. [How to Run (Docker)](#4-how-to-run-docker)
5. [Install the Custom Node](#5-install-the-custom-node)
6. [Set Up Credentials](#6-set-up-credentials)
7. [Import Workflows](#7-import-workflows)
8. [Google Sheet Setup](#8-google-sheet-setup)
9. [Replay Sample Payloads](#9-replay-sample-payloads)
10. [API Reference](#10-api-reference)
11. [Error Handling](#11-error-handling)
12. [Daily Summary](#12-daily-summary)
13. [Unit Tests](#13-unit-tests)

---

## 1. Project Overview

An n8n automation that ingests support tickets via Webhook, validates input, deduplicates by `ticketId`, classifies each ticket using a custom `TicketClassifierNode`, sends an email notification, and logs every ticket to Google Sheets. A separate Cron workflow delivers a daily summary report.

**Notification channel used:** Gmail (Slack equivalent — no paid Slack plan required)

---

## 2. Architecture

```
POST /webhook/support-ticket
        │
        ▼
┌─────────────────────┐
│  Validate Input     │  → 400 if fields missing / bad email
└────────┬────────────┘
         │ valid
         ▼
┌─────────────────────┐
│  Sheets: Read Log   │  Read existing ticketIds
└────────┬────────────┘
         ▼
┌─────────────────────┐
│  Check Duplicate    │  Compare incoming ticketId
└────────┬────────────┘
    ┌────┴────┐
    │ dup     │ new
    ▼         ▼
duplicate   ┌──────────────────────┐
_ignored    │ TicketClassifierNode │  (custom node)
            └────────┬─────────────┘
                     ▼
            ┌──────────────────────┐
            │ Build Notification   │  emoji + formatted text
            └────────┬─────────────┘
                     ▼
            ┌──────────────────────┐
            │ Gmail: Send Email    │  to NOTIFY_EMAIL
            └────────┬─────────────┘
                     ▼
            ┌──────────────────────┐
            │ Sheets: Log Ticket   │  append row
            └────────┬─────────────┘
                     ▼
                 200 processed
```

---

## 3. Classification Rules

### Category (checked in this order)
| Category | Keywords matched in subject + message |
|---|---|
| `billing` | invoice, payment, charge, refund, billing, subscription, fee, overcharge, receipt, transaction, price, plan, paid |
| `bug` | error, bug, crash, broken, not working, fail, exception, glitch, freeze, cannot, can't, 500, 404, issue, wrong |
| `feature_request` | feature, request, suggest, would like, enhance, improvement, add, wish, proposal, idea, implement, new feature |
| `general` | **fallback** — no keywords matched |

### Priority (checked independently)
| Priority | Keywords |
|---|---|
| `high` | urgent, critical, asap, immediately, emergency, cannot login, can't access, data loss, production down, blocked, severe, outage |
| `medium` | problem, broken, not working, error, failing, wrong, incorrect, slow, delay |
| `low` | **fallback** — no high/medium keywords |

### Routing by notification subject line
- `billing + high` → subject tagged `[HIGH] 💳 billing`
- `bug + high` → subject tagged `[HIGH] 🐛 bug`
- All others → priority + category clearly labeled

---

## 4. How to Run (Docker)

**Prerequisites:** Docker Desktop installed and running.

```bash
# 1. Clone / unzip project
cd n8n-support-triage-mashooque

# 2. Copy and fill env file
cp .env.example .env
# Edit .env: set GOOGLE_SHEET_ID and NOTIFY_EMAIL

# 3. Start n8n
docker compose up -d

# 4. Open n8n
# http://localhost:5678
```

**Stop:**
```bash
docker compose down
```

---

## 5. Install the Custom Node

The `TicketClassifierNode` is mounted directly into n8n via Docker volume (see `docker-compose.yml`). No manual npm install required when using Docker.

**Manual install (if running n8n without Docker):**
```bash
cd ~/.n8n/nodes
mkdir -p node_modules/n8n-nodes-ticket-classifier
cp -r /path/to/custom-node/* node_modules/n8n-nodes-ticket-classifier/

# Restart n8n
```

**Build from TypeScript source:**
```bash
cd custom-node
npm install
npm run build
```

---

## 6. Set Up Credentials

In n8n UI → **Settings → Credentials → Add Credential**:

| Credential | Type | Used by |
|---|---|---|
| Google Sheets (OAuth2) | `googleSheetsOAuth2Api` | Read/Append ticket log |
| Gmail (OAuth2) | `gmailOAuth2` | Send notifications & summary |

After adding, open each workflow and assign the credentials to the relevant nodes.

**Environment variables required in `.env`:**
```
GOOGLE_SHEET_ID=1abc...xyz   # from your Sheet URL
NOTIFY_EMAIL=you@gmail.com   # receives all ticket alerts
```

---

## 7. Import Workflows

1. In n8n UI → **Workflows → Import from File**
2. Import `workflows/main_workflow.json`
3. Import `workflows/daily_summary_workflow.json`
4. Assign credentials to Google Sheets and Gmail nodes in both workflows
5. **Activate** both workflows (toggle in top-right)

---

## 8. Google Sheet Setup

Create a Google Sheet with **two tabs**:

### Tab 1: `ticket_log`
Columns (Row 1 headers):
```
ticketId | name | email | subject | message | source | category | priority | reason | tags | createdAt | status
```

### Tab 2: `failures`
Columns (Row 1 headers):
```
failedAt | node | message | ticketId
```

Share the sheet with your Google service account email (from OAuth2 credentials).

---

## 9. Replay Sample Payloads

**Option A — Shell script:**
```bash
chmod +x samples/replay.sh
./samples/replay.sh http://localhost:5678/webhook/support-ticket
```

**Option B — Individual curl commands:**
```bash
WEBHOOK="http://localhost:5678/webhook/support-ticket"

# Billing #1 — overcharge refund
curl -X POST $WEBHOOK -H "Content-Type: application/json" \
  -d '{"ticketId":"TCK_2001","name":"Ahmed Khan","email":"ahmed.khan@example.com","subject":"Incorrect charge on my invoice","message":"I was overcharged $49 on my invoice. Please issue a refund.","source":"website"}'

# Bug #1 — crash (HIGH priority)
curl -X POST $WEBHOOK -H "Content-Type: application/json" \
  -d '{"ticketId":"TCK_2003","name":"Usman Ali","email":"usman.ali@techcorp.io","subject":"App crashes on login – urgent","message":"Getting a 500 error, cannot access account at all. Critical issue!","source":"chat"}'

# Feature request #1
curl -X POST $WEBHOOK -H "Content-Type: application/json" \
  -d '{"ticketId":"TCK_2005","name":"Bilal Hussain","email":"bilal.h@agency.com","subject":"Feature request: dark mode","message":"Would like to suggest adding a dark mode option.","source":"website"}'

# General #1
curl -X POST $WEBHOOK -H "Content-Type: application/json" \
  -d '{"ticketId":"TCK_2007","name":"Hassan Qureshi","email":"hassan.q@gmail.com","subject":"General inquiry","message":"Just signed up and want to understand the features.","source":"chat"}'

# DUPLICATE — same TCK_2007 → should return duplicate_ignored
curl -X POST $WEBHOOK -H "Content-Type: application/json" \
  -d '{"ticketId":"TCK_2007","name":"Hassan Qureshi","email":"hassan.q@gmail.com","subject":"General inquiry","message":"Just signed up and want to understand the features.","source":"chat"}'
```

**Option C — Postman**

Import any of the JSON files in `/samples` as request bodies with:
- Method: `POST`
- URL: `http://localhost:5678/webhook/support-ticket`
- Header: `Content-Type: application/json`

---

## 10. API Reference

### POST `/webhook/support-ticket`

**Request body:**
```json
{
  "ticketId": "TCK_1001",
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Cannot login to my account",
  "message": "I keep getting a 500 error when I try to log in. Urgent!",
  "source": "website"
}
```

**Success response (200):**
```json
{
  "accepted": true,
  "ticketId": "TCK_1001",
  "status": "processed",
  "category": "bug",
  "priority": "high"
}
```

**Duplicate response (200):**
```json
{
  "accepted": true,
  "ticketId": "TCK_1001",
  "status": "duplicate_ignored"
}
```

**Validation error response (400):**
```json
{
  "accepted": false,
  "error": "Missing or empty required fields: email, subject",
  "fields": ["email", "subject"]
}
```

---

## 11. Error Handling

- If **Gmail send** fails → error is caught (via `onError: continueErrorOutput`) and logged to the `failures` tab in Google Sheets
- If **Google Sheets append** fails → same pattern, logged to `failures` tab
- The `failures` tab schema: `failedAt | node | message | ticketId`
- The webhook **always returns a response** — it never hangs on downstream failures

---

## 12. Daily Summary

The `daily_summary_workflow.json` runs every day at **8:00 AM (Asia/Karachi)**. It:

1. Reads all rows from `ticket_log`
2. Filters rows from the last 24 hours by `createdAt`
3. Computes: total count, breakdown by category, breakdown by priority, top 3 keywords
4. Sends a formatted email to `NOTIFY_EMAIL`

Sample summary email:
```
📊 DAILY SUPPORT SUMMARY – Wed Apr 02 2026
=============================================

📨 Total Tickets (last 24h): 7

📂 By Category:
   • billing: 2
   • bug: 2
   • feature_request: 2
   • general: 1

⚡ By Priority:
   • high: 1
   • medium: 3
   • low: 3

🔑 Top 3 Keywords:
   • "error" (3)
   • "refund" (2)
   • "login" (2)
```

---

## 13. Unit Tests

```bash
cd custom-node
npm install
npm test
```

Tests cover: billing/high, bug, feature_request, general/low fallback, high priority, medium priority, billing+high combo, empty source, tags array.
