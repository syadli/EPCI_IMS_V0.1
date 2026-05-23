Buatkan aplikasi web enterprise bernama **EPCI Interface Management System (IMS)** untuk mengelola Interface Request (IR) antar kontraktor pada proyek EPCI skala besar.

Aplikasi digunakan untuk mengatur pertukaran informasi/data antar kontraktor (Kon1, Kon2, Kon3, dst.) yang memerlukan validasi Client pada setiap tahap workflow.

## 🏗️ Tech Stack yang Digunakan (Implemented):

* **Frontend**: React/Next.js 16 (App Router) + TypeScript + Tailwind CSS ✅ Implemented
* **CSS**: Tailwind CSS plus Vanilla CSS Variables for Enterprise Theming ✅ Implemented
* **Backend**: NestJS 11 + Prisma ORM 6.2 + PostgreSQL 15 + Multer file upload ✅ Fully Implemented
* **Database**: PostgreSQL 15 + Docker Compose ✅ Containerized
* **State Management**: Context API (Auth, Theme, Project) ✅ Implemented
* **Authentication**: JWT with Passport.js + Granular RBAC ✅ Implemented
* **API Documentation**: Swagger/OpenAPI auto-generated ✅ Available at /docs
* **Icons**: Lucide React ✅ Implemented
* **Database ORM**: Prisma Client 6.2 with full schema ✅ Implemented

Role user (Granular RBAC):

* **Super User** (Global Admin): Otoritas tertinggi untuk mengonfigurasi proyek baru, menentukan kontraktor yang terlibat dalam setiap proyek, dan mengelola akses global.
* **Project Admin**: Admin khusus tingkat proyek. Mengelola user dalam satu proyek, meng-assign tipe user, dan memiliki otoritas untuk mengedit IR dalam proyek tersebut.
* **Manager**: Authorize submit request/response, melakukan delegasi otoritas tugas.
* **Technical User**: Create/edit draft IR, memberikan input teknis jika diminta.
* **Client / Owner**: Validation, close out, recycle approval.

Workflow IR:

1. **Request Submission**
   * Auto generate IR ID format: IR-requestor-responder-0001
   * Input: project, responder, title, description, priority (critical/non-critical), due date, attachment
   * Due date default 14 hari

2. **Request Validation (Client/Manager)**
   * Manager memberikan otorisasi sebelum dikirim ke Client
   * Client melakukan validasi teknis (Approve/Reject)

3. **Response (Responder)**
   * Responder mengisi detail jawaban dan upload dokumen pendukung

4. **Response Validation (Client)**
   * Client memvalidasi jawaban dari responder

5. **Response Acceptance (Requestor)**
   * Requestor menyetujui jawaban atau meminta informasi tambahan (More Info)

6. **Close Out (Client)**
   * Final review dan penutupan IR secara resmi

7. **IR Recycle (Client)**
   * Jika informasi tambahan diperlukan, IR akan di-recycle dengan update revisi (Rev 0, Rev 1, dst.)

Fitur Utama yang Sudah Diimplementasikan:

* **Granular RBAC System**:
  * Pemisahan tugas antara Super User (Global Config) dan Project Admin (Project Ops).
  * Sidebar dinamis yang menyesuaikan menu berdasarkan level otoritas.
* **Multi-Project Architecture**: 
  * Global Project Switcher (Ikon Globe) untuk berpindah konteks proyek secara instan.
  * Data Dashboard, IR Register, dan My Tasks otomatis terfilter berdasarkan proyek aktif.
* **Project Configuration Module**:
  * Modul khusus Super User untuk memetakan kontraktor ke dalam proyek tertentu.
* **Task Delegation & Technical Input**:
  * Kemampuan mendelegasikan otoritas tugas ke rekan kerja (misal: saat cuti).
  * Fitur permintaan input teknis kepada anggota tim lain dalam satu workflow.
* **Advanced IR Register**:
  * Multi-column sorting (klik judul kolom).
  * Global search & advanced filtering (Status, Priority, Project).
* **Modern Enterprise UI**:
  * **Dual Theme Support**: Dark & Light mode dengan persistensi localStorage.
  * **Collapsible Push Sidebar**: Layout sidebar yang tidak menutupi konten utama.
  * **Interactive Dashboard**: KPI Cards dan visualisasi data menggunakan Recharts.
* **Direct Messaging**: Sistem chat 1-on-1 antar user untuk koordinasi informal.
* **Real-time Notifications**: Indikator unread untuk Messages dan Notifications dengan update langsung via WebSocket.
* **Attachment Storage**: Upload berkas lampiran IR disimpan di `backend/uploads/attachments` dan disajikan melalui route statis.

Halaman & Modul:

* **Login**: Entry point dengan JWT authentication terhadap backend NestJS API
* **Dashboard**: Ringkasan KPI, grafik status IR dengan Recharts, dan alert SLA (Overdue/Due Soon)
* **IR Register**: Pusat manajemen data IR dengan fitur filter/sort canggih (multi-column sort, global search, advanced filters)
* **IR Detail**: Tampilan komprehensif termasuk workflow timeline (dari draft → closed), audit trail (WorkflowLog), dan panel aksi dinamis berdasarkan role & status
* **Create/Edit IR**: Form input dinamis dengan attachment upload dan metadata management (nama file, size, upload date). File disimpan lokal di `backend/uploads/attachments` dan tersedia melalui route statis `/uploads`.
* **IR Register Export**: Ekspor daftar IR ke Excel (.xlsx) langsung dari halaman register.
* **IR Detail Export**: Download PDF Summary dari halaman IR detail.
* **My Tasks**: Daftar tugas personal berdasarkan role, delegasi, dan assigned requests. Counter tugas saat ini dibaca/di-reset saat halaman dibuka.
* **Admin > Projects**: Konfigurasi global proyek dan company-project mapping (Super User only)
* **Admin > Users**: Manajemen user dengan project-aware filtering dan role assignment (Project Admin scope)
* **Messages**: Split-pane messaging UI untuk komunikasi 1-on-1 antar user. Pesan belum dibaca dihitung dan direset saat halaman Messages dibuka.
* **Notifications**: Real-time notification center untuk workflow events. Link notifikasi sekarang dapat langsung menavigasi ke halaman item terkait.

---

## 📁 Project Structure

```
epci-ims/
├── backend/
│   ├── src/
│   │   ├── auth/              # JWT authentication & authorization
│   │   ├── users/             # User management service
│   │   ├── companies/         # Contractor/Company management
│   │   ├── projects/          # Project CRUD & configuration
│   │   ├── interface-requests/# Core IR workflow logic
│   │   ├── messages/          # 1-on-1 messaging service
│   │   ├── realtime/          # WebSocket gateway and real-time events
│   │   ├── notifications/     # Notification management
│   │   ├── prisma/            # Prisma service & configuration
│   │   └── main.ts            # NestJS bootstrap
│   ├── prisma/
│   │   ├── schema.prisma      # Complete database schema with all enums & models
│   │   └── seed.ts            # Database seeding with mock data
│   ├── docker-compose.yml     # PostgreSQL 15 container config
│   └── package.json           # NestJS dependencies
│
├── frontend/
│   ├── app/
│   │   ├── (app)/             # Protected routes (logged-in users)
   │   │   ├── dashboard/
   │   │   ├── ir-register/
   │   │   ├── ir/[id]/       # IR Detail page
   │   │   ├── ir/create/     # Create/Edit IR form
   │   │   ├── my-tasks/
   │   │   ├── messages/
   │   │   ├── notifications/
   │   │   └── admin/         # Admin pages
   │   ├── login/             # Login page
   │   └── page.tsx           # Home/root page
   ├── lib/                   # Utilities, contexts, API clients
   └── package.json           # Next.js dependencies
│
├── docker-compose.yml         # Root-level compose file
├── EPCI_interface_management_v2.md  # This documentation
└── README_SETUP.md            # Setup & installation guide
```

---

## 🚀 Cara Menjalankan Aplikasi

Lihat file `README_SETUP.md` untuk panduan lengkap setup & installation.

**Quick Start:**
```bash
# 1. Start database (dari root directory)
docker-compose up -d

# 2. Setup backend
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev

# 3. Setup frontend (di terminal baru)
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Swagger Docs: http://localhost:3001/docs
- Database: postgresql://epci_user:epci_password@localhost:5432/epci_ims

---

## Status Implementasi

### ✅ Selesai & Production Ready:

1. **Backend Architecture**:
   - ✅ NestJS 11 dengan modular architecture (Auth, Users, Companies, Projects, InterfaceRequests, Messages, Notifications, Realtime)
   - ✅ PostgreSQL 15 + Prisma ORM 6.2 dengan skema relasional lengkap
   - ✅ Database seed dengan mock data (Contractors, Projects, Users, Interface Requests)
   - ✅ Docker Compose untuk PostgreSQL database management

2. **Authentication & Authorization**:
   - ✅ JWT-based authentication dengan Passport.js
   - ✅ Granular RBAC (Super User, Project Admin, Manager, Technical User, Client)
   - ✅ Auth Guard & Role-based access control di routes

3. **API Modules & Services**:
   - ✅ **Auth Module**: Login, JWT token generation
   - ✅ **Users Module**: User management, role assignment, CRUD operations
   - ✅ **Companies Module**: Contractor/Company management
   - ✅ **Projects Module**: Project CRUD, company-project mapping
   - ✅ **InterfaceRequests Module**: Full IR workflow management (draft → closed)
   - ✅ **Messages Module**: 1-on-1 messaging between users
   - ✅ **Notifications Module**: Real-time notifications for workflow events
   - ✅ **Realtime Gateway**: WebSocket events for message/new, notification/new, workflow/update

4. **Frontend (Next.js 16 App Router)**:
   - ✅ Login page dengan JWT authentication
   - ✅ Dashboard dengan KPI cards, SLA visualization, dan Recharts graphs
   - ✅ IR Register dengan multi-column sorting, global search, advanced filtering
   - ✅ IR Detail page dengan workflow timeline, audit trail, dynamic action panel
   - ✅ Create/Edit IR form dengan attachment upload, metadata, dan local storage integration
   - ✅ IR Register Excel export dan IR Detail PDF summary export
   - ✅ My Tasks page dengan personal task list
   - ✅ Admin > Projects page (Super User project configuration)
   - ✅ Admin > Users page (Project-aware user management)
   - ✅ Messages page dengan split-pane messaging UI
   - ✅ Notifications page
   - ✅ Sidebar kini hanya menampilkan badge untuk My Tasks dan Messages, sedangkan Notifications sidebar item telah dihilangkan untuk menyelaraskan dengan indikator halaman.
   - ✅ Dark/Light mode with Tailwind CSS
   - ✅ Global project switcher (globe icon)

5. **Database Schema (Prisma)**:
   - ✅ Company model (name, code, type, relationships)
   - ✅ Project model (name, code, isActive, company-project mapping)
   - ✅ User model (email, role, company, projects, isActive)
   - ✅ InterfaceRequest model (full IR lifecycle with revision support)
   - ✅ IRResponse model (response submission with attachments)
   - ✅ WorkflowLog model (audit trail untuk semua IR actions)
   - ✅ Attachment model (request & response attachments tracking)
   - ✅ Message model (1-on-1 messaging)
   - ✅ Notification model (workflow notifications)

6. **Development Tools & Configurations**:
   - ✅ TypeScript 5.7 (strictMode enabled)
   - ✅ ESLint + Prettier untuk code formatting
   - ✅ Jest testing framework (backend)
   - ✅ Swagger API documentation (auto-generated dari NestJS)
   - ✅ Environment configuration via dotenv & @nestjs/config

### 📋 Langkah Selanjutnya (Next Steps):

* [x] **Local File Storage**: Implementasi local disk attachment upload di `backend/uploads/attachments` dengan Multer + Express static serving.
* [x] **Reporting Export**: Export Excel dari IR Register dan Download PDF Summary di IR Detail.
* [x] **Realtime Features**: WebSocket integration untuk live messaging, notifications, dan workflow updates.
* [ ] **Cloud Storage Option**: Integrasi AWS S3/Azure Blob sebagai opsi storage eksternal.
* [ ] **Email Notifications**: SMTP integration untuk email notifications pada workflow state changes.
* [ ] **SLA Management**: Automated SLA alerting & escalation workflows.
* [ ] **Search Optimization**: Full-text search pada IR title/description dengan PostgreSQL capabilities.
* [ ] **Performance**: Database indexing optimization, caching layer (Redis), query optimization.
* [ ] **Testing**: Comprehensive integration tests, E2E tests, coverage improvement.
