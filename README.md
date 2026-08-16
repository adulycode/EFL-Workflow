# EFL-Workflow (Kanban Project Management System)

A modern, high-performance Trello-like Kanban application built specifically for small organizations of up to 20 team members. Designed following the **Impeccable Design System** philosophy (clean information hierarchy, 0ms drag latency, real-time collaboration, and multi-channel notifications).

![EFL-Workflow](https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1200&auto=format&fit=crop&q=80)

---

## ✨ Features

- **Smooth Drag & Drop (`@dnd-kit`)**: Fractional index positioning with 0ms optimistic UI updates and auto-rollback on connection drop.
- **20-Member Organization Ready**: Pre-configured user directory with Role-Based Access Control (**Admin** / **Member**).
- **Default Workflows**: *To Do*, *In Progress*, *Review*, and *Done*.
- **Comprehensive Task Management**:
  - Priority levels (*Low*, *Medium*, *High*, *Urgent*).
  - Assignees selection with multi-avatar badges.
  - Labels and tags with custom palette tokens.
  - Due date tracking with automatic overdue visual indicators.
- **Collaboration & Auditing**:
  - Live threaded comments on cards.
  - Detailed activity history log (who moved/edited which card).
- **Instant Search & Filters**: Search by keyword, filter by "My Tasks", filter by Labels, and filter by Priority.
- **Multi-Channel Notification Engine**:
  - **Email (Resend)**: Automated HTML transactional alerts when tasks are assigned or moved to *Review* / *Done*.
  - **LINE Messaging API**: Automated Flex Message alerts to team members or notification channels.
  - Live Delivery Audit Log Modal in the app.
- **Real-Time Synchronization**: WebSocket-powered live synchronization across all connected clients.
- **Dark Mode Support**: Fluid theme toggling with accessible contrast ratios.

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, `@dnd-kit/core`, `@dnd-kit/sortable`, Zustand, Lucide React, date-fns
- **Backend**: Node.js, Express, Socket.io, TypeScript (`tsx`)
- **Database & ORM**: PostgreSQL 16, Prisma ORM
- **Notification Providers**: Resend API, LINE Messaging API
- **Containerization**: Docker & Docker Compose

---

## 🚀 Quick Start with Docker (Local Server)

Run the entire application (PostgreSQL + Full-Stack App) with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/adulycode/EFL-Workflow.git
cd EFL-Workflow

# 2. Build and launch Docker containers
docker compose up -d --build

# 3. View container status
docker compose ps
```

Once running:
- 🌐 **Web Application UI**: [http://localhost:3010](http://localhost:3010)
- 🗄️ **PostgreSQL Database Port**: `localhost:5433` (User: `efl_user`, Pass: `efl_password_2026`, DB: `efl_workflow_db`)

---

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file from `.env.example`:

```env
DATABASE_URL="postgresql://efl_user:efl_password_2026@localhost:5433/efl_workflow_db?schema=public"
PORT=3010
RESEND_API_KEY="your_resend_api_key"
LINE_CHANNEL_ACCESS_TOKEN="your_line_channel_token"
```

---

## 💻 Local Development (Without Docker)

```bash
# Install dependencies
npm install

# Generate Prisma Client & Run DB push
npx prisma generate
npx prisma db push
npm run prisma:seed

# Run dev server (Frontend + Backend)
npm run server   # Starts Express backend on port 3010
npm run dev      # Starts Vite React dev server on port 5173
```

---

## 📂 Project Structure

```
├── prisma/
│   ├── schema.prisma        # PostgreSQL models (Users, Boards, Columns, Cards, Comments, Logs)
│   └── seed.ts              # 20 Team members & default board seeder
├── server/
│   ├── routes/              # Auth, Boards, Cards, Notifications API routes
│   ├── services/            # Resend & LINE multi-channel notification engine
│   └── index.ts             # Express + Socket.io Server
├── src/
│   ├── components/
│   │   ├── board/           # KanbanBoard, KanbanColumn, KanbanCard, CardDetailModal, Filters
│   │   ├── notifications/   # Notification audit log modal
│   │   └── team/            # 20 Team members directory modal
│   ├── hooks/               # useSocketRealtime hook
│   ├── store/               # Zustand Board & Auth stores
│   ├── types/               # TypeScript interfaces
│   ├── App.tsx
│   └── index.css            # Impeccable CSS tokens
├── Dockerfile               # Multi-stage container build
├── docker-compose.yml       # App (3010) & PostgreSQL (5433) services
└── package.json
```

---

## 📄 License

MIT © EFL Organization
