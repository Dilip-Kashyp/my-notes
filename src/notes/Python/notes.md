# Atlas — Conversation Intelligence & Enterprise Platform

Atlas is a modular enterprise AI platform for turning conversations into structured work. Built as a modular monolith, it combines a FastAPI backend, a Next.js 15 dashboard, multi-tenant Slack & GitHub event ingestion, OAuth 2.0 authentication, and a Gemini-powered LLM orchestrator.

---

## Key Features & Capabilities

- **Unified Web Dashboard**: Onboarding, integration management, and workspace configuration.
- **Enterprise Multi-Tenancy**: Organization & Workspace scoping with bound provider integrations.
- **Dynamic Multi-Tenant Webhook Ingress**: Dynamic token resolution per Slack Team ID and GitHub events, decrypted on-the-fly from PostgreSQL.
- **Robust Auth & Token Rotation**: OAuth 2.0 (Google, GitHub, Slack) with automatic JWT access token generation and secure server-side refresh token rotation (HTTP-only cookies).
- **Gemini LLM Orchestrator**: Function calling, tool dispatching, and conversation context management.
- **Response Formatting Utilities**: Built-in utilities for standardizing LLM output and API responses.
- **Database & Migration Engine**: PostgreSQL schema managed via Alembic async migrations.

---

## High-Level Architecture

```text
Slack / GitHub Webhooks / Web Dashboard / Endpoints
                   │
                   ▼
            FastAPI API (v1)
                   │
  ┌────────────────┼────────────────┐
  ▼                ▼                ▼
 Auth        Integrations    Webhook Ingress (Multi-Tenant DB Lookup)
Service        Service              │
                                    ▼
                           Gemini Orchestrator
                                    │
                                    ▼
                        Tool Dispatcher & Providers
```

---

## Core Modules & Project Structure

### Backend (`backend/app`)

```text
backend/app/
├── api/
│   ├── auth.py                  # Legacy OAuth routes
│   ├── dashboard.py             # Dashboard statistics
│   ├── integrations.py          # Provider connection routes
│   ├── slack.py                 # Multi-tenant Slack event handler (/slack/events)
│   └── v1/
│       ├── auth.py              # Centralized Auth v1 (refresh, logout, me)
│       ├── integrations.py      # Workspace integrations v1
│       └── webhooks.py          # Provider webhooks (e.g., GitHub)
├── config.py                    # Environment settings (cookie_secure, master key, database URLs)
├── credentials/
│   └── manager.py               # Fernet symmetric token encryption/decryption
├── database/
│   └── session.py               # SQLAlchemy async engine & session management
├── domain/
│   ├── identity/                # User, Session, RefreshToken services & schemas
│   └── integrations/            # Integration & credential persistence logic
├── llm/
│   ├── base.py                  # LLM Client interface
│   └── gemini.py                # Google GenAI Gemini-2.5-Flash integration
├── models/
│   ├── integrations.py          # Integration & Credential DB models (provider_workspace_id)
│   └── tenancy.py               # User, Organization, Workspace, Session models
├── orchestrator/
│   ├── agent.py                 # Core Orchestrator logic
│   ├── platform_base.py         # Normalized event schema & ChatPlatform interface
│   ├── slack_handler.py         # SlackWebhookHandler & per-tenant SlackPlatform
│   └── tool_dispatcher.py       # Tool execution dispatcher
├── tools/                       # Integrations tools
│   └── github.py                # GitHub operations tool
└── utils/
    └── response_formatter.py    # Utilities for standardized response formatting
```

### Frontend (`frontend/src`)

```text
frontend/src/
├── app/
│   ├── dashboard/               # Workspace dashboard
│   ├── integrations/            # Integration settings page
│   ├── login/                   # OAuth login portal
│   └── page.tsx                 # Root landing page
├── components/                  # UI components (Button, Card, Stack, Icons)
└── helper/
    ├── apiClient.ts             # Centralized fetch wrapper with automatic token refresh
    └── auth.ts                  # Auth helpers
```

---

## Authentication & Token Rotation System

1. **User Authentication**: Select Google, GitHub, or Slack on `/login`.
2. **OAuth Exchange**: Backend exchanges authorization code, provisions default workspace, creates session record, and generates access token.
3. **Storage & Cookies**:
   - Access token stored in `localStorage` (`atlas_access_token`) and cookie (`atlas_access_token`).
   - Server-side opaque `refresh_token` stored in HTTP-only cookie (`samesite=lax`, `secure=settings.cookie_secure`).
4. **Token Refresh**: On HTTP `401 Unauthorized`, `apiClient.ts` calls `POST /api/v1/auth/refresh` (with `credentials: "include"`). The backend verifies the refresh token hash, revokes the old token, issues a rotated refresh cookie, and returns a fresh access token.

---

## Quickstart Development Guide

### 1. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure required variables in `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# OAuth Credentials
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database & Redis (Docker Compose defaults)
DATABASE_URL=postgresql+asyncpg://atlas:atlas_secure_pass@localhost:5432/atlas_dev
REDIS_URL=redis://localhost:6379/0
```

### 2. Run with Docker Compose (Recommended)

```bash
docker compose up -d --build
```

Services:
- **Backend API**: `http://localhost:8000`
- **Frontend Dashboard**: `http://localhost:3000`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

### 3. Database Migrations (Alembic)

```bash
docker compose exec backend alembic upgrade head
```

---

## Webhook Setup (Development Tunnel)

Provider webhooks require a public HTTPS URL to deliver events during local development.

1. Expose backend port `8000` using localtunnel or ngrok:
   ```bash
   npx localtunnel --port 8000
   ```

### Slack Webhooks
2. In your [Slack API Dashboard](https://api.slack.com/apps):
   - Go to **Event Subscriptions** -> Enable Events.
   - Set **Request URL** to:
     `https://<your-tunnel-url>/slack/events`
   - Subscribe to Bot Events: `app_mention`.
3. Add Redirect URL under **OAuth & Permissions**:
   `http://localhost:8000/api/v1/workspaces/integrations/slack/callback`
4. On your dashboard (`http://localhost:3000/integrations`), click **Connect Slack** to authorize your workspace.

### GitHub Webhooks
2. In your [GitHub App Settings](https://github.com/settings/apps):
   - Go to **General** -> **Webhook**.
   - Set **Webhook URL** to:
     `https://<your-tunnel-url>/api/v1/webhooks/github`
   - Subscribe to desired repository events (e.g., issues, pull requests).

---

## Testing

Run backend tests using pytest inside the container or virtual environment:

```bash
docker compose exec backend pytest -v
```