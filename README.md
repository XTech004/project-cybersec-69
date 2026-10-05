# IT Service Desk & Incident Ticket API (project-cybersec-69)

ระบบแจ้งซ่อมและขอความช่วยเหลือด้านไอทีภายในองค์กร พัฒนาตามสถาปัตยกรรมระดับ Enterprise ของ **Amplication (NestJS + Prisma ORM + PostgreSQL + pgAdmin)** โดยจัดโครงสร้างโปรเจกต์และการทดสอบแบบเดียวกับ `69-s1-cybersec`

---

## 👥 การแบ่งหน้าที่ในทีม 3 คน (Team Roles)

| สมาชิก | บทบาท / ตำแหน่ง | Branch ที่รับผิดชอบ | ชิ้นงานหลัก (Deliverables) |
| :--- | :--- | :--- | :--- |
| **สมาชิกคนที่ 1 (คุณ)** | **Database & Admin Lead** | `feat/db`<br>`feat/admin` | `docker-compose.yaml` (db, pgadmin), `schema.prisma`, `seed.ts`, `.env.simple` |
| **สมาชิกคนที่ 2** | **App Core & Auth Lead** | `feat/app` | โครงสร้าง NestJS Core, Service `app`, Auth Module (JWT + Login/Register) |
| **สมาชิกคนที่ 3** | **REST API & Testing Lead** | `feat/rest` | CRUD Controllers (Tickets, Categories, Comments), ไฟล์ `api.http.simple` |

---

## 🌿 โครงสร้าง Git Branches

1. `main` : Branch หลักสำหรับรวบรวมงานทั้งหมด
2. `feat/db` : **(ส่วนที่ 1)** ติดตั้ง PostgreSQL ใน Docker Compose + ออกแบบ Prisma Schema & Seed
3. `feat/admin` : **(ส่วนที่ 1)** ติดตั้ง pgAdmin 4 ใน Docker Compose + Prisma Studio
4. `feat/app` : **(ส่วนที่ 2 - เพื่อนทำต่อ)** พัฒนาระบบ NestJS Core และระบบยืนยันตัวตน (JWT Authentication)
5. `feat/rest` : **(ส่วนที่ 3 - เพื่อนทำต่อ)** พัฒนา REST CRUD Endpoints และไฟล์ `api.http.simple`

---

## 🚀 เอกสารข้อกำหนดโครงการ (Project Specification)
- [เอกสารข้อกำหนดโครงการฉบับเต็ม (PDF)](./IT_Service_Desk_Project_Specification.pdf)
- [เอกสารข้อกำหนดโครงการ (HTML Source)](./project_specification.html)
