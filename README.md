# PSSMS — Parking Space Sales Management System

A full-stack parking management application with secure authentication, real-time slot tracking, automated checkout-on-payment, and hourly fee calculation. Built with **React + Tailwind CSS** (frontend) and **Express + MySQL** (backend).

## Features

- **Role-based auth** — Register/Login with JWT, strong password enforcement, session management
- **Security Q&A** — Password recovery via hardcoded security questions + bcrypt-verified answers (no email links)
- **Dashboard** — Animated stat counters (total cars, slots, active sessions, revenue)
- **Car management** — Register/search vehicles with phone validation
- **Slot management** — Track available/occupied/reserved/disabled slots with color badges
- **Parking records** — Create sessions (auto EntryTime), real-time duration display, "Pay & Exit" checkout modal
- **Payment = auto-checkout** — Paying a session automatically sets ExitTime, calculates Duration (minutes), and frees the slot
- **Fee calculation** — 500 RWF/hour, minimum 1 hour, pre-filled & editable
- **Reports** — Tabbed records/payments view, search, status filter, date range filter, PDF export
- **Change password** — Authenticated endpoint with old password verification
- **Monochrome UI** — Black/white/gray palette, responsive sidebar, toast notifications, loading skeletons, empty states

## Tech Stack

| Layer      | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, React Router 6, Tailwind CSS 3, Axios, jsPDF, react-icons |
| Backend   | Node.js, Express 4, mysql2, bcryptjs, JWT |
| Database  | MySQL                               |

## Prerequisites

- Node.js ≥ 18
- MySQL server running

## Setup

### 1. Database

Run the schema file to create the database and tables:

```sh
mysql -u root -p < backend-project/Config/pssms_schema.sql
```

This creates the `PSSMS` database with 6 tables:

- **Users** — credentials, role (admin/staff)
- **ParkingSlot** — slot number + status enum
- **Car** — plate number, driver name, phone
- **ParkingRecord** — parking sessions linked to slot, car, user, payment
- **Payment** — payment records with auto-generated timestamps
- **UserSecurityQA** — stores question text + bcrypt-hashed answers per user

### 2. Backend

```sh
cd backend-project
npm install
npm run dev        # nodemon (auto-reload)
# or
npm start          # node only
```

Default: `http://localhost:5000`

### 3. Frontend

```sh
cd frontend-project
npm install
npm start
```

Default: `http://localhost:3000`

### 4. Environment (backend `.env`)

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=PSSMS
PORT=5000
JWT_SECRET=pssms_secret_key_2025
CORS_ORIGIN=http://localhost:3000
```

Frontend reads `REACT_APP_API_URL` (defaults to `http://localhost:5000/api`).

## API Endpoints

| Method | Endpoint               | Auth | Description                |
|--------|------------------------|------|----------------------------|
| POST   | `/api/register`        | No   | Register with 2 Q&A        |
| POST   | `/api/login`           | No   | Login → JWT token          |
| POST   | `/api/forgot-password` | No   | Get security questions     |
| POST   | `/api/verify-answers`  | No   | Verify answers with bcrypt |
| POST   | `/api/reset-password`  | No   | Set new password           |
| PUT    | `/api/change-password` | Yes  | Change password (old + new) |
| POST   | `/api/cars`            | Yes  | Register a car             |
| GET    | `/api/cars`            | Yes  | List all cars              |
| POST   | `/api/slots`           | Yes  | Create a parking slot      |
| GET    | `/api/slots`           | Yes  | List all slots             |
| POST   | `/api/records`         | Yes  | Start a parking session    |
| GET    | `/api/records`         | Yes  | List all records           |
| GET    | `/api/records/:id`     | Yes  | Get single record          |
| PUT    | `/api/records/:id`     | Yes  | Update record (times, etc) |
| DELETE | `/api/records/:id`     | Yes  | Delete a record            |
| POST   | `/api/payments`        | Yes  | Create payment + checkout  |
| GET    | `/api/payments`        | Yes  | List all payments          |

## Fee Calculation

- **Rate**: 500 RWF per hour
- **Minimum**: 1 hour
- **Formula**: `Math.ceil(duration_in_minutes / 60) * 500`
- Pre-filled on checkout but editable by staff

## Project Structure

```
ISHIMWE_Andy_National_Practical_Exam_2025/
├── README.md
├── backend-project/
│   ├── Config/
│   │   ├── db.js              # MySQL pool (10 connections)
│   │   └── pssms_schema.sql   # Full database schema
│   ├── controller/
│   │   ├── userController.js       # Auth, Q&A, password mgmt
│   │   ├── carController.js        # Car CRUD
│   │   ├── parkingSlotController.js
│   │   ├── parkingRecordController.js
│   │   └── paymentController.js    # Auto-checkout on payment
│   ├── middleware/
│   │   └── auth.js             # JWT verification
│   ├── Routes/
│   │   └── routes.js           # All API routes
│   ├── .env
│   ├── package.json
│   └── server.js               # Express entry point
└── frontend-project/
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js            # CRA entry → imports Main.jsx
        ├── Main.jsx            # React bootstrap
        ├── App.jsx             # Routes
        ├── api/
        │   ├── api.js          # Axios instance + interceptors
        │   └── config.js       # API base URL
        ├── components/
        │   ├── Toast.jsx       # Notification system
        │   ├── Skeleton.jsx    # Loading skeletons
        │   └── EmptyState.jsx  # Empty table states
        ├── layout/
        │   ├── Layout.jsx      # Main layout wrapper
        │   └── Sidebar.jsx     # Navigation sidebar
        └── pages/
            ├── Landing.jsx     # Landing page
            ├── Login.jsx       # Login/Register with 10 security questions
            ├── ForgotPassword.jsx  # 3-step Q&A recovery
            ├── Welcome.jsx     # Dashboard with stat counters
            ├── Car.jsx         # Car management
            ├── ParkingSlot.jsx # Slot management
            ├── ParkingRecord.jsx   # Session management + checkout
            ├── Payment.jsx     # Payment with auto-checkout
            ├── Reports.jsx     # Tabbed reports with search/filters/PDF
            └── ChangePassword.jsx  # Change password form
```

## Key Design Decisions

- **Security questions** hardcoded on frontend (10 questions), stored as question text + bcrypt-hashed answer in `UserSecurityQA` table — no separate questions table or API endpoint
- **Payment triggers auto-checkout** — `POST /api/payments` atomically creates the payment and closes the parking session (ExitTime, Duration, Pay_ID, slot freed)
- **Local server time** — All timestamps use a `localNow()` helper instead of `new Date().toISOString()` (UTC) to prevent timezone offset errors in EntryTime/ExitTime/Duration
- **Monochrome palette** — No blue; black, white, and gray tones throughout
- **Explicit `.jsx`** extensions for all React component files
