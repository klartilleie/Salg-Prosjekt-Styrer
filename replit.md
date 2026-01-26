# Overview

This is a Sales CRM (Customer Relationship Management) application built for managing sales representatives, customers, and commission payouts. The application is written in Norwegian and features role-based access control with regular users (sales reps) and administrators. Sales representatives can register customers and request payouts, while administrators can approve/reject customers, manage payouts, and administer users.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with HMR support

The frontend follows a page-based architecture with protected routes. The main layout includes a collapsible sidebar for navigation. Path aliases are configured: `@/` for client source, `@shared/` for shared code.

## Backend Architecture

- **Framework**: Express 5 on Node.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API with `/api` prefix
- **Build**: esbuild for production bundling with selective dependency bundling

The server serves both the API and static files in production, with Vite middleware for development.

## Authentication & Authorization

- **Strategy**: Passport.js with Local Strategy (username/password)
- **Session Management**: Express sessions stored in PostgreSQL via connect-pg-simple
- **Password Security**: Scrypt hashing with random salt
- **Role-Based Access**: Two roles - "user" (sales rep) and "admin" with middleware guards

Protected routes use `requireAuth` middleware, admin routes additionally use `requireAdmin`.

## Data Storage

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command

Core entities:
- **users**: Sales representatives and admins with points/earnings tracking, phone and bank account number for payouts
- **customers**: Customer records with approval workflow (pending → approved/rejected)
- **payouts**: Commission payout requests with approval workflow, with paidAmount tracking
- **attachments**: File attachments linked to customers, stored in Replit Object Storage

## Object Storage

- **Service**: Replit Object Storage (Google Cloud Storage backend)
- **Integration**: server/replit_integrations/object_storage/
- **Upload Flow**: Presigned URL upload - client requests URL, uploads directly to storage
- **API Routes**:
  - POST /api/uploads/request-url - Get presigned upload URL (requires auth)
  - GET /objects/{*path} - Serve uploaded files
- **Client Components**: ObjectUploader (Uppy-based modal) and useUpload hook

## Key Design Decisions

1. **Shared Schema**: Database schema is defined once in `shared/schema.ts` and shared between frontend (for type safety) and backend (for database operations). Zod schemas are generated from Drizzle schemas for validation.

2. **Monorepo Structure**: Single repository with `client/`, `server/`, and `shared/` directories. Build process outputs to `dist/` with client in `dist/public/`.

3. **Commission System**: Customers have a status workflow. When approved, commission and points are awarded to the sales rep. Payouts can be requested against earned commissions.

4. **Development/Production Split**: Vite dev server with HMR in development, static file serving in production.

# External Dependencies

## Database
- PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- connect-pg-simple for session storage

## Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption

## Third-Party Services
- **Kartverket Address API**: Norwegian address lookup via Geonorge (ws.geonorge.no/adresser/v1/sok) for customer address autocompletion. The API is proxied through `/api/address-search` endpoint.

## Key NPM Dependencies
- Radix UI primitives for accessible components
- TanStack Query for data fetching
- Drizzle ORM for database operations
- Passport.js for authentication
- Zod for validation