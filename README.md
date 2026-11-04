# AegisGuard AI — Web Application Security Assessment Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**AegisGuard AI** is a production-ready, full-stack cybersecurity SaaS application designed to help organizations assess their authorized web applications by automatically inspecting transport layer configurations, security response headers, cookie attributes, and DNS defenses without intrusive or destructive payloads.

---

## 1. Project Overview & Architecture

### The Problem
Small organizations and development teams frequently deploy modern web applications without standard transport protections, leaving users susceptible to adversary-in-the-middle (AiTM) attacks, clickjacking, cross-site scripting (XSS), session hijacking, and email spoofing.

### The Solution
AegisGuard AI automates safe, passive, non-invasive security auditing:
1. **Target Authorization**: Verifies target domain ownership via DNS TXT records, HTTP verification files, or legal attestation.
2. **SSRF Defense Shield**: Resolves destination DNS and enforces strict RFC 1918, RFC 3927, and cloud metadata endpoint blacklists before connecting.
3. **Automated Probe Lifecycle**: Non-invasive multi-stage assessment covering SSL/TLS certificates, HTTP security headers, cookie flags, and DNS SPF/DMARC records.
4. **Transparent Risk Scoring**: Deterministic calculation deducting documented penalties from a baseline of 100 points, mapped to security grades (A+, A, B, C, D, F).
5. **AI Posture Assessment**: Generates executive summaries and prioritized remediation action plans with ready-to-use configuration snippets (Nginx, Apache, Express).
6. **Executive PDF Reports**: Generates professional multi-page PDF audit reports with visual badges, evidence tables, and OWASP compliance notes.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS (SOC Dark Navy & Cyber Cyan Theme, with Light Mode Toggle)
- **Routing**: React Router DOM v6 with Protected & Admin Routes
- **State Management**: React Context API (`AuthContext`, `ThemeContext`, `NotificationContext`)
- **Data Visualization**: Recharts (Area charts for scan trends, Bar charts for vulnerability distributions)
- **Icons**: Lucide React
- **HTTP Client**: Axios with credentials and interceptors

### Backend
- **Runtime**: Node.js v20+ with TypeScript & Express.js
- **Architecture**: Modular Controller-Service-Repository pattern
- **Authentication**: JWT with secure HTTP-only cookies and bcrypt password hashing
- **Validation**: Zod schema validators
- **Security Middleware**: Helmet, CORS, Express Rate Limit, SSRF validation
- **Distributed Queues**: BullMQ with Redis (featuring an automatic zero-configuration asynchronous in-memory fallback for local dev)
- **PDF Engine**: PDFKit multi-page report generator
- **Database**: MongoDB with Mongoose ODM

---

## 3. Real Security Checks & Methodology

| Audit Category | Technical Check Performed | Security Impact Evaluated |
| :--- | :--- | :--- |
| **SSL/TLS Encryption** | Handshake, certificate validity, issuer, SANs, days to expiration, cipher suite, protocol version | Expired certificates, self-signed certificates, legacy TLS 1.0/1.1 usage |
| **HTTP Redirection** | Port 80 connection test, 301/302 location check | Downgrade attacks, unencrypted plain-text transport |
| **Security Headers** | `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` | Cross-Site Scripting (XSS), Clickjacking, MIME sniffing, referrer leakage |
| **Cookie Security** | `Set-Cookie` directives: `Secure`, `HttpOnly`, `SameSite` flags | Credential theft via client scripts, Cross-Site Request Forgery (CSRF) |
| **DNS Defenses** | SPF (`v=spf1 ...`) and DMARC (`_dmarc.<domain>`) TXT records | Domain spoofing, brand phishing campaigns, email impersonation |
| **Information Leakage** | `Server` version banners, `X-Powered-By`, sensitive robots.txt endpoints | Attacker reconnaissance, automated version-specific exploit targeting |
| **Disclosure Policies** | RFC 9116 `security.txt` and `robots.txt` non-invasive crawl check | Responsible vulnerability disclosure pathways for ethical security researchers |

### Transparent Risk-Scoring Formula
Every scan begins with a baseline score of **100 points**:
- **Critical Finding**: `-25 points` (e.g. Missing peer certificate, exposed plain HTTP without TLS)
- **High Finding**: `-15 points` (e.g. Expired certificate, self-signed cert, deprecated TLS 1.0, permissive SPF `+all`)
- **Medium Finding**: `-8 points` (e.g. Missing CSP, missing HSTS, missing X-Frame-Options, missing SPF/DMARC)
- **Low Finding**: `-3 points` (e.g. Missing X-Content-Type-Options, server version banner disclosure)
- **Informational**: `0 points` (e.g. Modern TLS 1.3 verified, HSTS preload enabled, RFC 9116 security.txt present)

**Grade Mapping**:
- `90 - 100`: **A+** (Exemplary defensive posture)
- `80 - 89`: **A** (Strong baseline posture)
- `70 - 79`: **B** (Acceptable, minor header or DNS omissions)
- `60 - 69`: **C** (Moderate risk, multiple missing baseline defenses)
- `50 - 59`: **D** (Significant deficiencies, immediate attention required)
- `< 50`: **F** (Critical security defects present)

---

## 4. Project Directory Structure

```text
ai-security-assessment-platform/
├── backend/
│   ├── src/
│   │   ├── config/              # Database, Redis, and Environment settings
│   │   ├── controllers/         # Express controllers (auth, scan, website, report, admin)
│   │   ├── jobs/                # BullMQ distributed queue & in-memory fallback
│   │   ├── middleware/          # JWT auth, RBAC admin, rate limiting, error handling
│   │   ├── models/              # Mongoose models (User, Website, Scan, Report, Notification)
│   │   ├── routes/              # Express API route declarations
│   │   ├── services/
│   │   │   ├── scanner/         # Safe probe modules (SSRF, SSL, Headers, Cookies, DNS, Config)
│   │   │   ├── scannerEngine.ts # Scan coordinator & stage manager
│   │   │   └── pdfGenerator.ts  # PDFKit executive report generator
│   │   ├── tests/               # Automated test runner suite
│   │   ├── types/               # TypeScript interfaces & types
│   │   ├── utils/               # Logger, token signer, response formatters
│   │   ├── validators/          # Zod validation schemas
│   │   ├── app.ts               # Express application configuration
│   │   └── server.ts            # Entrypoint & server bootstrap
│   ├── storage/reports/         # Persistent directory for generated PDF reports
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/common/   # Navbar, Sidebar, Footer, Modals
│   │   ├── context/             # AuthContext, ThemeContext, NotificationContext
│   │   ├── layouts/             # DashboardLayout, PublicLayout
│   │   ├── pages/               # Landing, Login, Register, Dashboard, Scans, Reports, Admin
│   │   ├── routes/              # AppRoutes, ProtectedRoute, AdminRoute
│   │   ├── services/            # Axios API wrappers (auth, scans, websites, reports, admin)
│   │   ├── types/               # Frontend TypeScript interfaces
│   │   ├── utils/               # Formatters, severity color utilities
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css            # Tailwind custom cybersecurity directives
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml           # Multi-container orchestration (MongoDB, Redis, Backend, Frontend)
├── .env.example                 # Global environment template
├── .gitignore
├── package.json                 # Monorepo root scripts
└── README.md
```

---

## 5. REST API Reference

### Authentication
- `POST /api/auth/register` — Create new operator account
- `POST /api/auth/login` — Sign in and receive secure session cookie & JWT
- `POST /api/auth/logout` — Invalidate session
- `GET /api/auth/me` — Retrieve current authenticated operator profile
- `POST /api/auth/forgot-password` — Generate password reset token
- `POST /api/auth/reset-password` — Update credentials using reset token
- `PATCH /api/auth/profile` — Update name or change password

### Target Websites & Verification
- `POST /api/websites` — Register target domain for monitoring
- `GET /api/websites` — List user's registered websites with latest grades
- `POST /api/websites/:id/verify` — Execute domain verification (`DNS_TXT`, `HTTP_FILE`, or `SELF_ATTESTED`)
- `DELETE /api/websites/:id` — Remove target from monitoring

### Security Scanning
- `POST /api/scans` — Enqueue a new automated security scan
- `GET /api/scans` — Retrieve paginated scan archive with filters
- `GET /api/scans/dashboard-stats` — Real-time metrics calculated from MongoDB
- `GET /api/scans/:id` — Get comprehensive scan report with all findings
- `GET /api/scans/:id/status` — Lightweight polling endpoint for stage progress
- `GET /api/scans/:id/findings` — Search and filter technical findings
- `POST /api/scans/compare` — Compare two scans to calculate posture delta
- `DELETE /api/scans/:id` — Delete scan record

### PDF Reports
- `POST /api/reports/:scanId` — Trigger PDF report generation
- `GET /api/reports` — List user's PDF audit reports
- `GET /api/reports/:id/download` — Stream PDF report file

### Notifications
- `GET /api/notifications` — Fetch user alerts with unread counter
- `PATCH /api/notifications/mark-all-read` — Mark all alerts as read
- `PATCH /api/notifications/:id/read` — Mark single alert as read

### Admin Console (Admin Role Required)
- `GET /api/admin/dashboard` — Global platform analytics & queue telemetry
- `GET /api/admin/users` — User directory with search and scan volume
- `PATCH /api/admin/users/:id/status` — Deactivate / reactivate user accounts
- `PATCH /api/admin/users/:id/role` — Promote to ADMIN or demote to USER
- `GET /api/admin/scans` — Live platform-wide audit feed

---

## 6. Local Installation & Execution

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v9 or higher
- Optional: **MongoDB** local service (or MongoDB Atlas connection URI)
- Optional: **Docker** & **Docker Compose**

### Step 1: Clone Repository
```bash
git clone https://github.com/<your-username>/ai-security-assessment-platform.git
cd ai-security-assessment-platform
```

### Step 2: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

cd ..
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```
Default values work out of the box for local development. If MongoDB is not running locally, AegisGuard automatically activates an in-memory database fallback so you can begin scanning immediately without configuration hurdles.

### Step 4: Run Automated Tests
```bash
cd backend
npm test
```
*Executes all 18 automated security checks for SSRF prevention, deterministic scoring, and AI synthesis.*

### Step 5: Start the Development Servers
In two separate terminals:

**Terminal 1 — Backend API Server (Port 5000)**:
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend Web Application (Port 5173)**:
```bash
cd frontend
npm run dev
```

Open your browser to: **`http://localhost:5173`**

### Default Administrator Credentials
The first time the backend boots, it provisions an administrator account:
- **Email**: `admin@aegisguard.security`
- **Password**: `Admin@Security2025!`

---

## 7. Docker Deployment

To run the complete platform including MongoDB, Redis, Backend, and Frontend containers:

```bash
docker compose up --build -d
```

Verify running containers:
```bash
docker compose ps
```

Access services:
- **Frontend SPA**: `http://localhost:80`
- **Backend API**: `http://localhost:5000/api/health`
- **MongoDB**: `localhost:27017`
- **Redis**: `localhost:6379`

To stop:
```bash
docker compose down
```

---

## 8. Public Cloud Deployment Guide

### Deploying the Database (MongoDB Atlas)
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and whitelist all IPs (`0.0.0.0/0`) or your hosting provider's IPs.
3. Obtain your connection string:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/aegisguard_security?retryWrites=true&w=majority`

### Deploying the Backend (Render or Railway)
1. Push your repository to **GitHub**.
2. On [Render](https://render.com/) or [Railway](https://railway.app/), create a new **Web Service**.
3. Select your repository and specify:
   - **Root Directory**: `backend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `node dist/server.js`
4. Set the following **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: `<Your MongoDB Atlas URI>`
   - `CLIENT_URL`: `https://your-frontend-domain.vercel.app`
   - `JWT_SECRET`: `<Generate a random 64-character secret>`
   - `JWT_EXPIRES_IN`: `7d`
   - `REDIS_URL`: `<Your Redis URI from Upstash or leave blank for async worker>`
   - `ADMIN_EMAIL`: `admin@yourdomain.com`
   - `ADMIN_PASSWORD`: `<Your secure password>`

### Deploying the Frontend (Vercel)
1. In [Vercel](https://vercel.com/), import your GitHub repository.
2. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add **Environment Variable**:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com/api`
4. Deploy! Vercel will output a live HTTPS URL.

---

## 9. Legal & Safety Notice

AegisGuard conducts **purely passive, non-invasive observations** based strictly on standard HTTP/HTTPS transport handshakes, public DNS records, and response headers. 
- It does **NOT** conduct credential attacks, payload injection, denial of service, or intrusive directory enumeration.
- Users must only assess domains they own or have explicit written authorization to evaluate.
- A passing grade indicates adherence to modern transport and header hygiene standards, but does not substitute for an authenticated code review or manual penetration test.

---

## 10. License
Academic SaaS Engineering Project. Developed under the MIT License.
