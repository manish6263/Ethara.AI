# Ethara TaskFlow
Live Link: https://server-production-0585.up.railway.app/
Ethara TaskFlow is a full-stack team task manager built for the Ethara.AI. It lets users create projects, invite team members, assign work, update task status, and monitor progress through a responsive dashboard.

## Features

- Signup, login, logout, and authenticated user sessions
- Project creation and project-level team membership
- Role-based access control with `ADMIN` and `MEMBER` roles
- Admin-only project, member, and task management
- Member task status updates for assigned work
- Task status, priority, assignee, due date, and overdue tracking
- Dashboard cards for projects, tasks, completed work, and overdue work
- Responsive React UI with loading, empty, and error states
- PostgreSQL schema with Prisma relationships and validations

## Tech Stack

- React, Vite, TypeScript
- Tailwind CSS
- Node.js, Express, TypeScript
- PostgreSQL
- Prisma ORM
- JWT authentication with HTTP-only cookies
- Zod validation
- Railway deployment

## Optional Local Seed Accounts

After running the seed script locally, these accounts are available for quick testing:

```text
Admin:  admin@ethara.ai  / Password123
Member: member@ethara.ai / Password123
```

The deployed production app can be used from a fresh signup flow without seed data.

## Role Rules

Roles are scoped to each project, not globally across the entire app.

- Any authenticated user can create a project.
- The project creator automatically becomes `ADMIN` for that project.
- Project admins can update project details, add members/admins, create tasks, assign work, and update any task status.
- Project members can view the project and update only tasks assigned to them.
- Signing up creates a user account, but does not automatically add that user to an existing project.
- To add someone to a project, that person must sign up first, then a project admin can add them by email.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="replace-with-a-long-random-secret"
CLIENT_URL="http://localhost:5173"
PORT=8080
```

3. Run database migrations and seed demo data:

```bash
npm run db:migrate
npm run db:seed
```

4. Start the development app:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` and the API runs on `http://localhost:8080`.

## API Overview

Auth:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Projects:

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `DELETE /api/projects/:projectId`

Members:

- `POST /api/projects/:projectId/members`
- `PATCH /api/projects/:projectId/members/:memberId`
- `DELETE /api/projects/:projectId/members/:memberId`

Tasks:

- `POST /api/projects/:projectId/tasks`
- `GET /api/tasks/:taskId`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`

Dashboard:

- `GET /api/dashboard`

## Railway Deployment

1. Push this repository to GitHub.
2. Create a new Railway project from the GitHub repo.
3. Add a Railway PostgreSQL database.
4. Add these environment variables to the app service:

```text
DATABASE_URL=<Railway PostgreSQL connection string>
JWT_SECRET=<long random secret>
CLIENT_URL=https://server-production-0585.up.railway.app/
NODE_ENV=production
```

5. Railway will use `railway.json`:

```text
Build: npm install && npm run build
Start: npm run railway:start
```

The start command runs Prisma migrations before starting the Express server.
