# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Daily Note** is an offline-first Progressive Web Application (PWA) for municipal council members (สมาชิกสภาเทศบาล) to record community issues, activities, field work status, and expenses. The UI is Thai-first.

The full system specification lives in `daily-note-system-context.md`.

## Planned Tech Stack

- **Frontend**: Next.js, Tailwind CSS, shadcn/ui, Lucide icons
- **PWA / Offline**: Workbox (service worker), Dexie.js (IndexedDB wrapper)
- **Auth**: Google OAuth
- **Backend**: REST API or GraphQL
- **Database**: PostgreSQL
- **Storage**: S3-compatible object storage

## Architecture

```
Client PWA (Next.js)
  ├── IndexedDB (Dexie.js) — primary local storage (no localStorage for data)
  ├── Service Worker (Workbox) — offline caching
  ├── Sync Queue — queues mutations made offline
  └── Google Auth

Backend API
  ├── Auth verification
  ├── CRUD endpoints
  ├── Sync endpoints (conflict strategy: Last Write Wins)
  ├── Analytics / dashboard endpoints
  └── File upload endpoints

PostgreSQL
  └── Users, Records, Community Details, Expenses, Updates, Tags, Villages
```

## Key Constraints

- **Offline-first**: all writes go to IndexedDB first; sync to server when online. Never use `localStorage` for main data storage.
- **Multi-tenant / user isolation**: backend must validate ownership on every request. Users see only their own data.
- **Sync metadata on every record**: `local_id`, `server_id`, `sync_status`, `last_synced_at`, `device_updated_at`.
- **Audit fields on every record**: `created_by`, `assigned_to`, `updated_by`, `created_at`, `updated_at`.
- **Performance targets**: first load ≤ 3 s, offline open ≤ 1 s.
- **Security**: HTTPS only, secure token handling, no sensitive data in client storage beyond what is needed for offline use.

## User Roles

| Role  | Capabilities |
|-------|-------------|
| Admin | Full access to own account's data, dashboard/analytics, all record management |
| Staff | Create/edit/update records under the same Admin account |

## Core Features

- **Record management**: create/edit/delete with images, location, tags, status, urgency
- **Community detail**: funeral, wedding, religious, visit, other — with host, conversation, and needs fields
- **Expense module**: multiple expenses per record, receipt upload
- **Follow-up log**: timeline updates, status history
- **Dashboard**: total/pending records, counts by type/village, monthly expense summary
- **Export**: Excel (.xlsx), PDF summary report, backup/restore
- **Offline UX**: online/offline indicator, sync status badge, last-synced time, manual sync button

## UI Direction

- Modern, minimal, professional (government/corporate style)
- Use icons (Lucide), not emoji
- Thai font-friendly, responsive (mobile-first)
