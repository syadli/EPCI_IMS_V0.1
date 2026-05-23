# EPCI Interface Management System (IMS) - Setup Guide

This document provides step-by-step instructions to set up and run the full-stack EPCI IMS platform locally.

## 📋 Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Docker & Docker Compose** (to run the PostgreSQL database)
- **Git**

---

## 🚀 Getting Started

### 1. Database Setup
The project uses PostgreSQL managed via Docker.
1. Open your terminal in the root directory of the project.
2. Run the following command to start the database:
   ```bash
   docker-compose up -d
   ```

### 2. Backend Setup (NestJS)
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database (apply migrations):
   ```bash
   npx prisma migrate dev --name init
   ```
4. Seed the database with initial data (Contractors, Projects, Users):
   ```bash
   npx prisma db seed
   ```
5. Start the backend development server:
   ```bash
   npm run start:dev
   ```
   *The API will be available at `http://localhost:3001/api`*
   *Interactive API Documentation (Swagger) at `http://localhost:3001/docs`*

### 3. Frontend Setup (Next.js)
1. Open a new terminal window in the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The application will be available at `http://localhost:3000`*

---

## 🔑 Default Credentials
Use the following accounts to test different roles (all seeded during step 2.4):

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super User** | `superuser@epci-ims.com` | `super123` (simulated) |
| **Project Admin** | `padmin@epci-ims.com` | `admin123` |
| **Manager (KON1)** | `manager.kon1@epci-ims.com` | `manager123` |
| **Client** | `client@epci-ims.com` | `client123` |

> [!NOTE]
> In the current implementation, the login accepts these passwords as defined in the backend authentication logic.

---

## 🛠 Project Structure
- `/frontend`: Next.js 14 application (React, Tailwind CSS, Recharts).
- `/backend`: NestJS application (Modular architecture, JWT, RBAC).
- `/backend/prisma`: Database schema and migration files.
- `docker-compose.yml`: Database infrastructure configuration.

---

## 📖 API Documentation
Once the backend is running, you can explore the full API surface at:
**[http://localhost:3001/docs](http://localhost:3001/docs)**

You can test endpoints directly from the Swagger UI by clicking "Authorize" and pasting your JWT token obtained from the `/auth/login` endpoint.
