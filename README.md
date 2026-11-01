# CI Intelligence — Starter MVP

เว็บแอปต้นแบบสำหรับ Project Continuous Improvement Intelligence พัฒนาด้วย React + Vite และเตรียมจุดเชื่อมต่อ Supabase

## ฟังก์ชันในชุดนี้

- Executive Dashboard: KPI, สถานะโครงการ, Benefit realization และ Loss distribution
- Project Management: ค้นหา/กรองโครงการ, เพิ่มโครงการ, เปลี่ยนสถานะ
- CI Knowledge Hub: ค้นหากรณีศึกษาและกรองตาม Kaizen / SGA / FI
- CI Analytics: วิเคราะห์โครงการตาม Loss category และ Department
- AI CI Co-pilot: แชตค้นหาจากกรณีศึกษาตัวอย่าง (ยังไม่ใช่ LLM/RAG จริง)
- Predictive Intelligence: แสดงตัวอย่างสัญญาณเตือนแบบ Rule-based
- Notifications & Tasks และ Administration (โครงหน้าเริ่มต้น)
- Demo Mode: ใช้งานได้ทันทีและบันทึกข้อมูลใน Browser localStorage
- Supabase: มี schema.sql และการโหลด/บันทึกข้อมูลโครงการเมื่อกำหนด Environment Variables

> ข้อมูลเริ่มต้นทั้งหมดเป็นข้อมูลตัวอย่าง (Demo Data) ไม่ใช่ข้อมูลจริงขององค์กร และห้ามใช้ตัวเลขตัวอย่างเพื่อรายงานผลการดำเนินงานจริง

## 1. Run ในเครื่อง

ติดตั้ง Node.js LTS ก่อน จากนั้นเปิด Terminal ในโฟลเดอร์โปรเจกต์

```bash
npm install
npm run dev
```

เปิด URL ที่ Vite แสดง เช่น `http://localhost:5173`

ทดสอบ build:

```bash
npm run build
npm run preview
```

## 2. Deploy ผ่าน GitHub + Vercel

1. สร้าง Repository ใหม่ใน GitHub
2. Upload ไฟล์ทั้งหมดในโฟลเดอร์นี้ หรือใช้ Git:

```bash
git init
git add .
git commit -m "Initial CI Intelligence MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ci-intelligence.git
git push -u origin main
```

3. เข้า Vercel → Add New → Project → Import Git Repository
4. Framework Preset: Vite
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. กด Deploy

## 3. Deploy ผ่าน Netlify

1. เข้า Netlify → Add new site → Import an existing project
2. เลือก GitHub Repository
3. Build command: `npm run build`
4. Publish directory: `dist`
5. กด Deploy

หรือใช้ไฟล์ `netlify.toml` ที่แนบมา

## 4. เชื่อมต่อ Supabase (Optional)

1. สร้าง Project ใน Supabase
2. เปิด SQL Editor แล้ว Run ไฟล์ `supabase/schema.sql`
3. ไปที่ Project Settings → API
4. คัดลอก Project URL และ anon/public key
5. สร้างไฟล์ `.env` จาก `.env.example` แล้วกำหนดค่า:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

6. Restart dev server หรือกำหนด Environment Variables เดียวกันใน Vercel/Netlify แล้ว Redeploy

**ข้อควรระวัง:** schema นี้เปิด RLS ไว้ แต่ยังไม่ได้เปิด policy สำหรับ production จึงต้องกำหนด Authentication, Role และ RLS policy ให้ตรงกับโครงสร้างองค์กรก่อนใช้งานจริง ห้ามนำ `service_role` key ไปใส่ใน Frontend

## 5. ขอบเขตที่ยังต้องพัฒนาก่อน Production

- Login / SSO และ Role-based access control (Admin, CI Manager, Project Owner, Viewer)
- CRUD เต็มรูปแบบของ Knowledge Hub, Project milestones, approvals และ benefit validation
- AI Co-pilot เชื่อม LLM + RAG/Vector Search พร้อมแสดงแหล่งอ้างอิง
- Predictive Intelligence เชื่อมข้อมูล Production / Quality / Maintenance และ validate rule/model
- Notification ผ่าน Email / Teams / LINE หรือ n8n
- Audit trail, backup, error monitoring และ security review

## Architecture

```text
Browser (React + Vite)
        |
        +---- Demo Mode: Browser localStorage
        |
        +---- Supabase (Postgres + Auth + Storage)
        |
        +---- AI Service (LLM + RAG) [Next step]
        |
        +---- n8n integrations [Next step]
        |
        +---- Production / Quality / Maintenance data [Next step]
```

## Suggested release order

- MVP: Dashboard + Project Management + Knowledge Hub + local/Supabase data
- Release 2: Authentication, workflow approvals, AI Co-pilot with citations
- Release 3: Operational data integration, predictive signals, notifications