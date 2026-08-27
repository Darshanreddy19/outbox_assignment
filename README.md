# Outbox - Email Scheduler Service

A production-grade email scheduler service + dashboard built with Express.js, BullMQ, MySQL, and Next.js.

For production hosting, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Sample Output

The running application includes these primary views:

- Landing page with the Outbox delivery-desk introduction.
- Dashboard with scheduled, sent, and failed email counts, queue tabs, and the compose action.


The repository is intended to be private. Never commit `backend/.env` or any file containing passwords, OAuth secrets, or SMTP credentials.

## Features Implemented

### Backend
- ✅ **Email Scheduling API** — Accepts single and batch scheduling requests
- ✅ **BullMQ + Redis** — Persistent delayed job scheduling (no cron)
- ✅ **Ethereal SMTP** — Fake email sending with preview URLs
- ✅ **MySQL + Prisma** — Relational database for email state persistence
- ✅ **Server Restart Survival** — BullMQ + DB persist jobs across restarts
- ✅ **Idempotency** — Each email has a unique DB ID used as BullMQ job ID
- ✅ **Worker Concurrency** — Configurable via `WORKER_CONCURRENCY` env var (default: 5)
- ✅ **Rate Limiting** — Redis-backed per-sender hourly counter, configurable via `MAX_EMAILS_PER_HOUR`
- ✅ **Email Delay** — Configurable minimum delay between sends via `EMAIL_SEND_DELAY_MS`
- ✅ **Rate Limit Rescheduling** — When hourly limit hit, jobs auto-reschedule to next window

### Frontend
- ✅ **Google OAuth Login** — Real Google authentication (no mock)
- ✅ **User Header** — Name, email, avatar + logout
- ✅ **Dashboard** — Stats cards, tab navigation
- ✅ **Compose Modal** — CSV upload, scheduling options
- ✅ **Scheduled Emails Table** — With cancel action
- ✅ **Sent Emails Table** — With status badges
- ✅ **Loading & Empty States** — Smooth UX throughout
- ✅ **TypeScript** — Full type safety

## Quick Start

### 1. Install prerequisites

- Install Node.js 18 or newer.
- Install MySQL 8 and start the MySQL service.
- Install and start a local Redis 7-compatible server. On Windows, [Memurai](https://www.memurai.com/) is a Redis-compatible option.

Create the database and application user in MySQL if they do not already exist:

```sql
CREATE DATABASE outbox;
CREATE USER 'outboxuser'@'localhost' IDENTIFIED BY 'outboxpass';
GRANT ALL PRIVILEGES ON outbox.* TO 'outboxuser'@'localhost';
FLUSH PRIVILEGES;
```

The same SQL is available in `backend/prisma/native-setup.sql`. Run it with a MySQL administrator account, for example:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < backend\prisma\native-setup.sql
```

The `caching_sha2_password` authentication plugin is intentional because it is supported by current MySQL releases and Prisma. If your MySQL administrator account uses a different password, enter it when prompted.

The default values match `backend/.env`. Change that file if your local MySQL credentials differ.

On Windows PowerShell, use `npm.cmd` if PowerShell blocks the `npm` script with an execution-policy error.

### 2. Install dependencies and prepare the database

```bash
npm.cmd run setup
```

The setup script installs dependencies, pushes the Prisma schema, and verifies Redis. Start MySQL and Redis using their native Windows services before running the backend. If you prefer to do the setup steps separately:

```bash
npm.cmd run backend:install
npm.cmd run backend:setup
npm.cmd run frontend:install
npm.cmd run redis:check
```

Verify both services before starting the app:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u outboxuser -poutboxpass -e "SELECT 1" outbox
redis-cli ping
```

Both commands should succeed (`1` and `PONG`). Do not commit real passwords or OAuth credentials to the repository.

### 3. Configure Google OAuth

Copy the example values into `backend/.env` and replace the Google placeholders:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

In Google Cloud Console, add `http://localhost:3001/api/auth/google/callback` as an authorized redirect URI.

### 4. Run the applications

From the repository root, run both services:

```bash
npm.cmd run dev
```

For future starts on Windows, use the automatic launcher. It opens a server terminal and the website for you:

```powershell
npm.cmd run site
```

If the site is already running, the launcher opens the existing site without starting a second server.

Or run them in separate terminals:

```text
Terminal 1: cd backend  && npm run dev
Terminal 2: cd frontend && npm run dev
```

The dashboard is available at http://localhost:3000 and the backend health check is available at http://localhost:3001/api/health.

### Google OAuth details

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web Application)
4. Add `http://localhost:3001/api/auth/google/callback` as authorized redirect URI
5. Update `backend/.env` with your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

## Architecture Overview

### How Scheduling Works

```
User (Frontend) → POST /api/emails/schedule-batch
                → Prisma writes to MySQL (status: scheduled)
                → BullMQ Queue.add() with delay
                → Worker picks up job at scheduled time
                → Checks Redis rate limit counter
                → Sends via Ethereal SMTP
                → Updates MySQL (status: sent)
```

### Persistence on Restart

BullMQ stores jobs in Redis. MySQL stores email metadata. On restart:
1. BullMQ reconnects to Redis and resumes all pending delayed jobs
2. MySQL retains full email history
3. No jobs are lost or re-sent (idempotent job IDs)

### Rate Limiting & Concurrency

- **Concurrency**: BullMQ worker runs with `concurrency: WORKER_CONCURRENCY` (default 5)
- **Rate Limit**: Redis counter per sender per hour window (`rate:{sender}:{hourWindow}`)
- **BullMQ Limiter**: Built-in `limiter.max` + `limiter.duration` as additional guard
- **Rescheduling**: When rate limit hit, job is retried with delay to next hour window
- **Multi-worker safe**: Redis counters work across multiple worker instances

### Behavior Under Load (1000+ emails)

- Jobs are staggered with configurable `delayBetweenEmailsMs`
- Batch scheduling auto-shifts excess emails into next hourly windows
- Worker concurrency prevents overwhelming the SMTP provider
- All state is in Redis/MySQL — safe across restarts and multiple instances

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | - | MySQL connection string |
| `REDIS_HOST` | 127.0.0.1 | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `GOOGLE_CLIENT_ID` | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | - | Google OAuth client secret |
| `PORT` | 3001 | Backend server port |
| `FRONTEND_URL` | http://localhost:3000 | Frontend URL for CORS |
| `MAX_EMAILS_PER_HOUR` | 200 | Rate limit per sender per hour |
| `EMAIL_SEND_DELAY_MS` | 2000 | Minimum delay between sends (ms) |
| `WORKER_CONCURRENCY` | 5 | Parallel jobs per worker |
| `SMTP_HOST` | smtp.ethereal.email | SMTP server hostname |
| `SMTP_PORT` | 587 | SMTP server port |
| `SMTP_USER` | - | SMTP account username |
| `SMTP_PASSWORD` | - | SMTP account password |

## Tech Stack

- **Backend**: Express.js, TypeScript, Prisma, BullMQ, Ethereal SMTP
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Infrastructure**: MySQL 8, Redis 7 (native locally; hosted in production)
