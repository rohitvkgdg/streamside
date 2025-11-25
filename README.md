# Streamside 🎥

A high-fidelity recording platform inspired by [Riverside.fm](https://riverside.fm). Record remote podcast episodes, interviews, and video content with studio-quality audio and video.

> ⚠️ **Work In Progress** - This project is under active development. See the [Implementation Status](#-implementation-status) section for details.

## 📋 Table of Contents

- [Overview](#-overview)
- [Implementation Status](#-implementation-status)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Code Standards](#-code-standards)
- [Known Issues & Bugs](#-known-issues--bugs)
- [Architecture](#-architecture)
- [Roadmap](#-roadmap)

---

## 🎯 Overview

Streamside uses a **dual-stream architecture**:

1. **LiveKit Stream** - Powers real-time video calls with adaptive bitrate (what participants see live)
2. **MediaRecorder Stream** - Records locally at maximum quality (up to 4K video, 48kHz audio) and uploads progressively in chunks

This approach ensures that even if network conditions are poor, the final recording is always high quality because it's captured locally.

---

## 📊 Implementation Status

### ✅ Working Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Authentication** | ✅ Working | Email/password sign up & sign in via Better Auth |
| **Google OAuth** | ✅ Working | Optional, requires Google credentials |
| **Database** | ✅ Working | PostgreSQL with Prisma ORM (Supabase compatible) |
| **Studio Creation** | ✅ Working | Create studios from dashboard |
| **Studio Lobby** | ⚠️ Partial | Can select camera/microphone, preview works |
| **LiveKit Integration** | ⚠️ Partial | Room connection works, but UI is incomplete |
| **Turborepo Setup** | ✅ Working | Monorepo with shared packages |
| **Build & Deploy** | ✅ Working | Production build succeeds |

### ⚠️ Partially Working

| Feature | Status | Issue |
|---------|--------|-------|
| **Studio Call Page** | ⚠️ Broken | LiveKit room connects but nothing displays - VideoConference component not rendering properly |
| **Recording Controls** | ⚠️ Broken | Start/Stop recording buttons exist but MediaRecorder service not fully integrated |
| **Chunk Upload** | ⚠️ Untested | API endpoint exists but MinIO integration not tested |
| **Socket.io Signaling** | ⚠️ Untested | Server setup exists but real-time state sync untested |

### ❌ Not Implemented Yet

| Feature | Status | Notes |
|---------|--------|-------|
| **Invite Links** | ❌ Missing | Schema doesn't have `inviteCode` field, dashboard shows undefined |
| **Guest Joining** | ❌ Missing | No way for guests to join via invite link |
| **Recording Playback** | ❌ Missing | No UI to view/download recordings |
| **Post-Processing** | ❌ Missing | No merging of chunks, no download functionality |
| **Screen Sharing** | ❌ Missing | Not implemented |
| **Chat** | ❌ Missing | No in-call messaging |
| **Mobile Support** | ❌ Missing | UI not responsive |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | Turborepo + pnpm workspaces |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL (Supabase) + Prisma 7 |
| **Auth** | Better Auth |
| **Media Server** | LiveKit (WebRTC SFU) |
| **Object Storage** | MinIO (S3-compatible) |
| **Real-time** | Socket.io + Redis adapter |
| **State** | Zustand |

---

## 📁 Project Structure

```
streamside/
├── apps/
│   └── web/                          # Next.js application
│       ├── src/
│       │   ├── app/                  # App Router pages
│       │   │   ├── api/              # API routes
│       │   │   │   ├── auth/[...all] # Better Auth handler
│       │   │   │   ├── livekit-token # Generate LiveKit tokens
│       │   │   │   ├── studios       # CRUD for studios
│       │   │   │   └── upload-chunk  # Recording chunk upload
│       │   │   ├── auth/signin       # Sign in page
│       │   │   ├── dashboard         # User dashboard
│       │   │   └── studio/[studioId] # Studio pages
│       │   │       ├── page.tsx      # Lobby (device selection)
│       │   │       └── call/page.tsx # Call interface
│       │   ├── lib/                  # Utilities
│       │   ├── services/             # MediaRecorderService
│       │   ├── store/                # Zustand store
│       │   └── pages/api/socket/     # Socket.io handler (Pages Router)
│       └── package.json
├── packages/
│   ├── database/                     # Prisma schema & client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── prisma.config.ts          # Prisma 7 config
│   │   └── src/
│   │       ├── client.ts             # Prisma client singleton
│   │       └── index.ts              # Exports
│   ├── types/                        # Shared TypeScript types
│   └── ui/                           # Shared UI components
├── docker-compose.yml                # Local infrastructure
├── livekit.yaml                      # LiveKit server config
├── turbo.json                        # Turborepo config
└── package.json                      # Root package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (check with `node -v`)
- **pnpm** 9+ (required - `npm install -g pnpm`)
- **Docker** & Docker Compose (for local services)

> ⚠️ **Important**: This project uses **pnpm workspaces**. Do NOT use npm or yarn - it will break the monorepo structure.

### Option A: Using Supabase (Recommended for Quick Start)

1. **Clone and install:**
   ```bash
   git clone https://github.com/rohitvkgdg/streamside.git
   cd streamside
   pnpm install
   ```

2. **Set up Supabase:**
   - Create a project at [supabase.com](https://supabase.com)
   - Go to Project Settings > Database > Connection string
   - Copy both the **pooled** (port 6543) and **direct** (port 5432) connection strings

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` (in the **root directory only**):
   ```env
   # Pooler URL (port 6543) - for app queries
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
   
   # Direct URL (port 5432) - for migrations
   DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
   ```

4. **Run database migrations:**
   ```bash
   pnpm db:migrate
   ```

5. **Generate Prisma client:**
   ```bash
   pnpm db:generate
   ```

6. **Start local services (LiveKit, Redis, MinIO):**
   ```bash
   docker-compose up -d redis livekit minio minio-init
   ```

7. **Start development server:**
   ```bash
   pnpm dev
   ```

8. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Option B: Full Local Development (Docker PostgreSQL)

1. **Start all infrastructure:**
   ```bash
   docker-compose up -d
   ```

2. **Configure `.env` for local PostgreSQL:**
   ```env
   DATABASE_URL="postgresql://streamside:streamside123@localhost:5432/streamside"
   DIRECT_URL="postgresql://streamside:streamside123@localhost:5432/streamside"
   ```

3. **Follow steps 4-8 from Option A**

---

## 🔐 Environment Variables

> ⚠️ **Important**: Only create `.env` in the **root directory**. Do NOT create `.env` files in `apps/web/` or other subdirectories - the root `.env` is the single source of truth for all packages.

Create a `.env` file in the root directory:

```env
# ===========================================
# Database (Supabase PostgreSQL)
# ===========================================
DATABASE_URL="postgresql://..."      # Pooler URL (port 6543) - for app queries
DIRECT_URL="postgresql://..."        # Direct URL (port 5432) - for migrations

# ===========================================
# Better Auth
# ===========================================
BETTER_AUTH_SECRET="your-secret-key-change-this-in-production"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ===========================================
# LiveKit (WebRTC)
# ===========================================
LIVEKIT_API_KEY="devkey"
LIVEKIT_API_SECRET="secret"
LIVEKIT_WS_URL="ws://localhost:7880"

# ===========================================
# MinIO (Object Storage)
# ===========================================
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_NAME="recordings"
MINIO_USE_SSL=false

# ===========================================
# Redis
# ===========================================
REDIS_URL="redis://localhost:6379"

# ===========================================
# App
# ===========================================
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_LIVEKIT_WS_URL="ws://localhost:7880"
```

---

## 📏 Code Standards

### Package Manager

> ⚠️ **Use pnpm ONLY** - This project uses pnpm workspaces. Do NOT use npm or yarn.

```bash
# ✅ Correct
pnpm install
pnpm add <package>
pnpm dev

# ❌ Wrong - will break workspace dependencies
npm install
yarn add <package>
```

### Project Conventions

| Category | Convention |
|----------|------------|
| **Package Manager** | pnpm (enforced via `.npmrc`) |
| **Node Version** | 18+ required |
| **TypeScript** | Strict mode enabled |
| **Styling** | Tailwind CSS v4 (CSS-based config, NOT `tailwind.config.js`) |
| **Database** | Prisma 7 with `@prisma/adapter-pg` |
| **Auth** | Better Auth (NOT NextAuth.js) |
| **State** | Zustand for client state, React Query for server state |
| **Imports** | Use workspace packages: `@streamside/database`, `@streamside/types`, `@streamside/ui` |

### File Organization

```
apps/web/src/
├── app/           # Next.js App Router pages & API routes
├── lib/           # Utility functions and configurations
├── services/      # Business logic services
├── store/         # Zustand stores
└── pages/         # Pages Router (Socket.io ONLY)

packages/
├── database/      # Prisma schema, migrations, client
├── types/         # Shared TypeScript types
└── ui/            # Shared React components
```

### Environment Variables

- **Single source**: Root `.env` file only
- **Client-side vars**: Must be prefixed with `NEXT_PUBLIC_`
- **Never commit**: `.env` files with real credentials

### Tailwind CSS v4

This project uses Tailwind CSS v4 with the new CSS-based configuration:

```css
/* apps/web/src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-primary-500: #0ea5e9;
  /* ... custom theme values */
}
```

**Do NOT create `tailwind.config.js` or `tailwind.config.ts`** - all configuration is in `globals.css`.

---

## 🐛 Known Issues & Bugs

### UI Issues

1. **Input text not visible in some fields**
   - Form inputs on light backgrounds have styling issues
   - Text color may be same as background

2. **Generic AI-generated UI appearance**
   - Dashboard and studio pages need design polish
   - Inconsistent spacing and typography
   - No loading states or animations

3. **Invite code shows "undefined"**
   - The `inviteCode` field doesn't exist in the database schema
   - Dashboard tries to display non-existent field

### Functional Issues

4. **Studio call page is empty**
   - LiveKit `VideoConference` component not rendering participants
   - Recording controls not connected to MediaRecorderService
   - Socket.io events not triggering properly

5. **Recording doesn't work**
   - MediaRecorderService exists but not properly initialized
   - Chunk upload endpoint exists but integration incomplete

6. **No way to share/invite to studio**
   - Missing invite link generation
   - No guest join flow

### Technical Debt

7. **Unused imports and dead code**
   - Several unused components and imports throughout

8. **Missing error handling**
   - API routes need better error responses
   - Client needs error toasts/notifications

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐         ┌──────────────────────────┐ │
│  │  LiveKit Client  │         │  MediaRecorder Service   │ │
│  │  (Real-time)     │         │  (Local Recording)       │ │
│  │                  │         │                          │ │
│  │  • Adaptive      │         │  • 4K Video (max)        │ │
│  │  • Low latency   │         │  • 48kHz Audio           │ │
│  │  • WebRTC        │         │  • 10s chunk upload      │ │
│  └────────┬─────────┘         └────────────┬─────────────┘ │
└───────────┼────────────────────────────────┼───────────────┘
            │                                │
            ▼                                ▼
┌───────────────────────┐      ┌───────────────────────────┐
│   LiveKit Server      │      │   Next.js API             │
│   (WebRTC SFU)        │      │   /api/upload-chunk       │
│   ws://localhost:7880 │      │   /api/studios            │
└───────────────────────┘      └─────────────┬─────────────┘
                                             │
            ┌────────────────────────────────┼───────────────┐
            │                                │               │
            ▼                                ▼               ▼
┌───────────────────┐       ┌───────────────────┐  ┌──────────────┐
│   Redis           │       │   PostgreSQL      │  │   MinIO      │
│   (Socket.io)     │       │   (Metadata)      │  │   (Chunks)   │
│   :6379           │       │   :5432           │  │   :9000      │
└───────────────────┘       └───────────────────┘  └──────────────┘
```

---

## 🗺 Roadmap

### Phase 1: Core Functionality (Current)
- [x] Project setup with Turborepo
- [x] Authentication with Better Auth
- [x] Database schema and migrations
- [x] Basic UI pages
- [ ] Fix LiveKit VideoConference rendering
- [ ] Complete MediaRecorder integration
- [ ] Test chunk upload flow

### Phase 2: Essential Features
- [ ] Add `inviteCode` to Studio schema
- [ ] Implement invite link sharing
- [ ] Guest join flow (no auth required)
- [ ] Recording playback/download
- [ ] Fix all UI input styling issues

### Phase 3: Polish
- [ ] Redesign UI (remove AI-generated look)
- [ ] Add proper loading states
- [ ] Implement error notifications
- [ ] Mobile responsive design
- [ ] Recording post-processing (merge chunks)

### Phase 4: Advanced Features
- [ ] Screen sharing
- [ ] In-call chat
- [ ] Multiple audio/video tracks per participant
- [ ] Cloud deployment guide

---

## 📜 Commands Reference

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm start                  # Start production server

# Database
pnpm db:generate            # Generate Prisma client
pnpm db:migrate             # Run migrations (dev)
pnpm db:push                # Push schema changes
pnpm db:studio              # Open Prisma Studio

# Docker
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose logs -f      # View logs
```

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 🙏 Acknowledgments

- Inspired by [Riverside.fm](https://riverside.fm)
- Built with [LiveKit](https://livekit.io)
- Powered by [Next.js](https://nextjs.org) and [Turborepo](https://turbo.build)
