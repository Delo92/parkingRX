# Handicap Permit Services - Disabled Parking Permit Application Platform

## Overview

This is a white-label handicap parking permit application service with a 4-tier user hierarchy. The platform handles applicant registrations, medical professional review/approval, automated permit document generation, payments, messaging, and workflow automation. Built as a full-stack TypeScript application with React frontend, Express backend, and Firebase Firestore for data storage.

The core workflow follows: Registration → Permit Type Selection → Payment → Provide Details → Medical Review/Approval → Permit Document Generation → Completion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled with Vite
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query v5) for server state
- **UI Components**: shadcn/ui with Radix UI primitives and Tailwind CSS
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Code Splitting**: Lazy-loaded pages with React.lazy() and Suspense

The frontend uses a context-based architecture:
- `AuthContext` - User authentication state and methods
- `ConfigContext` - White-label configuration (site name, colors, role names)
- `ThemeProvider` - Dark/light theme management

Path aliases are configured: `@/` for client/src, `@shared/` for shared code, `@assets/` for attached assets.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Firebase Authentication with Bearer token verification (stateless, no server-side sessions)
- **API Pattern**: RESTful endpoints under `/api/` prefix

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Migrations**: Drizzle Kit with `db:push` command for schema sync
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod

### User Hierarchy (4 Levels)
1. **Level 1 - Applicant**: End users who register support animals and submit applications
2. **Level 2 - Doctor/Reviewer**: Reviews applications via secure email links (no login required), approves/denies
3. **Level 3 - Admin**: Manage users, registration types, assign applications to doctors, and system settings
4. **Level 4 - Owner**: Full platform control, white-label configuration

Role names are configurable per deployment via the `siteConfig` table.

### Key Data Models
- `users` - All platform users with role levels
- `packages` - Service offerings with pricing
- `applications` - User applications linked to packages
- `applicationSteps` - Workflow step tracking
- `documents` - File uploads and document management
- `messages` - Internal messaging system
- `payments` - Payment records
- `commissions` - Referral/agent commission tracking
- `notifications` - User notifications
- `activityLogs` - Audit trail
- `siteConfig` - White-label customization
- `doctorProfiles` - Doctor credentials (license, NPI, DEA, phone, fax, address, specialty)
- `doctorReviewTokens` - Secure single-use tokens for doctor review links (token, applicationId, doctorId, status, expiresAt)
- `autoMessageTriggers` - Automated messages triggered on application status changes
- `adminSettings` - Admin settings including `lastAssignedDoctorId` for round-robin doctor assignment

### Site Media Management
All landing page images are configurable from the Owner's Site Settings > Site Media tab. Each slot supports:
- **Image URLs** (.jpg, .png, .webp, .gif)
- **Video URLs** (.mp4, .webm) - autoplay, loop, muted
- **Vimeo embeds** (paste vimeo.com link, auto-converted to embed)

Configurable media slots stored in Firebase `siteConfig`:
- `heroMediaUrl` - Hero section background
- `aboutMediaUrl` - About section image
- `ctaMediaUrl` - CTA section background
- `contactMediaUrl` - Contact/footer CTA background
- `departmentMediaUrls[]` - Department section images (5 slots)
- `testimonialMediaUrls[]` - Testimonial profile images (5 slots)
- `galleryImages[]` - Gallery section (unlimited slots)

Component: `client/src/components/MediaRenderer.tsx` - detects type from URL and renders img/video/iframe.

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Bundling Strategy**: Server dependencies in allowlist are bundled to reduce cold start times

## External Dependencies

### Database
- **Firebase Firestore**: Primary data store via Firebase Admin SDK
- **Connection**: Firebase service account key via `FIREBASE_SERVICE_ACCOUNT_KEY` secret

### Frontend Libraries
- **UI Framework**: shadcn/ui (Radix UI + Tailwind)
- **Forms**: react-hook-form with @hookform/resolvers and Zod
- **Date Handling**: date-fns
- **Charts**: Recharts (via shadcn chart component)

### Backend Libraries
- **Authentication**: bcryptjs for password hashing
- **File Uploads**: multer for multipart form data (gallery image uploads stored in `uploads/gallery/`)
- **Email**: @sendgrid/mail for transactional emails (doctor approval requests, admin notifications, patient approval notifications)

### Development Tools
- **Replit Plugins**: @replit/vite-plugin-runtime-error-modal, cartographer, dev-banner
- **TypeScript**: Strict mode with module bundler resolution

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string (required)
- `VITE_FIREBASE_*` - Optional Firebase configuration for enhanced auth
- `SENDGRID_API_KEY` - SendGrid API key for transactional emails
- `SENDGRID_FROM_EMAIL` - Sender email address for outbound emails
- `JOTFORM_API_KEY` - JotForm API key (for future document template integration)

## Current Implementation Status

### Completed Features
- **Authentication**: Stateless Firebase token-based auth (no server-side sessions)
- **4 Role-Based Dashboards**: Each with unique stats, actions, and navigation
- **Application Workflow**: 3-step wizard for creating new applications
- **Package Management**: Browse and select service packages with configurable required fields
- **Package-Specific Required Fields**: Admins define custom form fields per package (text, textarea, select, date, email, phone, number)
- **Doctor Review System**: Secure token-based review links sent to doctors (no login required)
- **Round-Robin Doctor Assignment**: Global round-robin auto-assigns doctors fairly
- **Auto-Send to Doctor**: Applications automatically sent to next doctor after submission (no manual admin step needed)
- **Email System (SendGrid)**: Automated emails on key events:
  - Doctor receives approval request email with patient details + Approve button
  - Admin notification email receives same approval request simultaneously
  - Patient receives approval confirmation email with dashboard link on doctor approval
- **Admin Notification Email**: Configurable email address in admin settings that receives all approval requests
- **Auto Document Generation**: Documents auto-generated upon doctor approval with doctor credentials
- **Auto-Message Triggers**: Automated in-app messages on status changes
- **Owner Configuration**: Full white-label settings (branding, role names, contact info)
- **Admin User Management**: Search, filter, and edit user levels/status
- **Dark/Light Theme**: System-aware with manual toggle

### Application Processing Workflow (Automated)

The complete automated workflow:

1. Level 1 (Applicant) creates account, selects package, fills in details (including package-specific required fields)
2. Application submitted → system automatically assigns next doctor via global round-robin
3. Two emails sent simultaneously:
   - To the assigned doctor — patient details, package type, reason, and Approve button
   - To the admin notification email — same info, same Approve button
4. Either recipient clicks Approve button → loads token-based review portal (no login needed)
   - **Approves** → `doctor_approved` → auto-generates permit document → patient emailed + dashboard notification
   - **Denies** → `doctor_denied` → patient notified with reason
5. Patient receives approval email and can download permit from their dashboard

Manual flow also available: Admin can still manually send applications to specific doctors via "Send to Doctor" button.

**Application Status Values:**
- `pending` - New application, ready to be sent to doctor
- `doctor_review` - Sent to doctor, awaiting their decision
- `doctor_approved` - Approved by doctor, certificate generated
- `doctor_denied` - Denied by doctor
- `level3_work` - In admin work queue (optional processing)
- `completed` - Fully completed
- `rejected` - Application rejected

### Doctor Review Token System
- **Secure Tokens**: 32-byte hex tokens, single-use, expire in 7 days
- **Public Review Portal**: `/review/:token` - no authentication required
- **Round-Robin Assignment**: `adminSettings.lastAssignedDoctorId` tracks rotation
- **Auto-Assignment**: Cycles through active doctors fairly (like a draft system)
- **Manual Override**: Admin can specify a particular doctor when sending

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/config` - Get site configuration
- `GET /api/packages` - List active packages
- `GET /api/applications` - Get user's applications
- `POST /api/applications` - Create new application (auto-sends to doctor if `autoSendToDoctor: true`)
- `POST /api/admin/applications/:id/send-to-doctor` - Manual send to doctor (round-robin or manual), generates review token + sends emails (Level 3+)
- `GET /api/review/:token` - Public: Load application data for doctor review (no auth)
- `POST /api/review/:token/decision` - Public: Submit doctor's approve/deny decision, triggers patient email on approval (no auth)
- `GET /api/doctors` - List active doctors (Level 3+)
- `GET /api/doctors/stats` - Get doctor's review stats and token history (Level 2+)
- `GET /api/review-tokens` - Get review tokens for an application (Level 3+)
- `GET /api/commissions` - Get commissions (Level 2+)
- `GET /api/admin/users` - List all users (Level 3+)
- `PUT /api/admin/users/:id` - Update user (Level 3+)
- `GET /api/admin/applications` - List all applications (Level 3+)
- `GET /api/admin/settings` - Get admin settings including notification email (Level 3+)
- `PUT /api/admin/settings` - Update admin settings (Level 3+)
- `PUT /api/owner/config` - Update site config (Level 4)

### Email System (server/email.ts)
- `sendDoctorApprovalEmail()` - Sends review request to doctor with patient details + Approve button
- `sendAdminNotificationEmail()` - Sends same review request to admin notification email
- `sendPatientApprovalEmail()` - Sends approval confirmation to patient with dashboard link

### Key Routes
- `/` - Landing page
- `/login`, `/register` - Authentication
- `/packages` - Service packages listing
- `/review/:token` - Public doctor review portal (no auth required)
- `/dashboard/applicant` - Applicant dashboard
- `/dashboard/applicant/applications/new` - New application wizard
- `/dashboard/doctor` - Doctor dashboard with review history
- `/dashboard/doctor/reviews` - Doctor's completed reviews
- `/dashboard/admin` - Admin dashboard
- `/dashboard/admin/applications` - All applications with "Send to Doctor" action
- `/dashboard/admin/users` - User management
- `/dashboard/owner` - Owner dashboard
- `/dashboard/owner/site-settings` - White-label configuration