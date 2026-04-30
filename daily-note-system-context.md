# System Generation Context – Daily Note

## Project Overview

สร้างระบบ Web Application ชื่อ **Daily Note**  
สำหรับบันทึกงานสมาชิกสภาเทศบาลในลักษณะ **Offline-First Progressive Web Application (PWA)**  
รองรับการใช้งานทั้ง Mobile และ Desktop โดยเน้น Mobile เป็นหลัก

ระบบต้องสามารถใช้งานได้แม้ไม่มี Internet และซิงก์ข้อมูลขึ้น Server อัตโนมัติเมื่อกลับมาออนไลน์

## Core Objective

ใช้สำหรับ:

- บันทึกปัญหาที่ประชาชนแจ้ง
- บันทึกกิจกรรมชุมชน
- ติดตามสถานะงานภาคสนาม
- บันทึกค่าใช้จ่ายที่เกี่ยวข้อง
- แสดง Dashboard สรุปข้อมูลและสถิติ

## User Roles

### Admin
- สมาชิกสภาเทศบาล
- เข้าถึงข้อมูลทั้งหมดในบัญชีตนเอง
- ดู Dashboard / Analytics
- จัดการงานทั้งหมด

### Staff
- ผู้ช่วยของ Admin
- สร้าง/แก้ไข/อัปเดตงานภายใต้บัญชีเดียวกัน

## Authentication / Authorization

- ใช้ Google OAuth Login
- ข้อมูลต้องแยกตามบัญชีผู้ใช้ (Multi-tenant / User Isolation)
- User เห็นเฉพาะข้อมูลของตนเอง
- Backend ต้อง Validate Ownership ทุก Request

## Platform / Technical Requirements

### Frontend
- PWA Installable
- รองรับ Mobile / Tablet / Desktop
- Responsive Design
- Thai-First Interface

### Offline First
- ใช้งานได้แม้ไม่มี Internet
- เก็บข้อมูล Local ด้วย IndexedDB
- ห้ามใช้ localStorage สำหรับ main storage
- Sync ข้อมูลขึ้น Server เมื่อ Online

### Online Database
- ใช้ PostgreSQL เป็นฐานข้อมูลหลัก

## UI / Design Direction

- Modern Professional
- Minimal / Clean
- Government / Corporate Style
- ใช้ Icon แทน Emoji
- Thai Font Friendly

## Main Features

### Record Management
- Create / Edit / Delete Record
- Images / Location / Tags / Status / Urgency

### Community Detail
- Funeral / Wedding / Religious / Visit / Other
- Host / Conversation / Needs

### Expense Module
- Multiple Expenses per Record
- Receipt Upload

### Follow-up Log
- Timeline Updates / Status History

## Audit Fields

- created_by
- assigned_to
- updated_by
- created_at
- updated_at

## Sync Metadata

- local_id
- server_id
- sync_status
- last_synced_at
- device_updated_at

Conflict Strategy: Last Write Wins

## Pages / Screens

1. Create Record
2. List / Filter / Search
3. Dashboard

## Dashboard Metrics

- Total Records
- Pending Records
- Count by Type
- Count by Village
- Monthly Expense Summary

## Offline UX Requirements

- Online / Offline Indicator
- Sync Status Badge
- Last Synced Time
- Manual Sync Button

## Performance Requirements

- First Load ≤ 3 sec
- Offline Open ≤ 1 sec
- Fast Mobile Experience

## Security Requirements

- HTTPS Only
- Secure Token Handling
- Ownership Validation
- Data Isolation per User

## Export / Reporting

- Excel Export (.xlsx)
- PDF Summary Report
- Backup / Restore

## Recommended Tech Stack

- Frontend: Next.js, Tailwind CSS, shadcn/ui
- PWA: Workbox, Dexie.js
- Icons: Lucide
- Backend: REST API / GraphQL
- Database: PostgreSQL
- Storage: S3 Compatible Object Storage

## Suggested Architecture

Client PWA
- IndexedDB
- Service Worker
- Sync Queue
- Google Auth
- Responsive UI

Backend API
- Auth Verification
- CRUD Endpoints
- Sync Endpoints
- Analytics Endpoints
- File Upload Endpoints

PostgreSQL
- Users
- Records
- Community Details
- Expenses
- Updates
- Tags
- Villages
- Sync Metadata
