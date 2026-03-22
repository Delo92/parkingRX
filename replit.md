# Handicap Permit Services - Disabled Parking Permit Application Platform

## Overview
This project is a white-label platform designed for managing handicap parking permit applications. It features a 4-tier user hierarchy, enabling comprehensive handling of applicant registrations, medical professional reviews, automated permit document generation, payments, and workflow automation. The platform aims to streamline the application process for disabled parking permits, from initial application to final document delivery.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, TypeScript, and Vite. It utilizes `shadcn/ui` with Radix UI primitives and Tailwind CSS for styling, supporting dark/light modes. `Wouter` handles routing, and `TanStack Query` manages server state. The UI follows a context-based architecture for authentication, white-label configuration, and theme management. All landing page media (images, videos, Vimeo embeds) are configurable by the Owner role.

### Technical Implementations
The application is a full-stack TypeScript project. The frontend uses React, while the backend runs on Node.js with Express.js. Firebase Authentication provides stateless bearer token verification. Data is stored in Firebase Firestore, with Drizzle ORM managing schema and migrations for PostgreSQL dialect (though primary data store is Firebase Firestore for key collections). Zod schemas are used for validation.

### Feature Specifications
- **4-Tier User Hierarchy**: Applicant, Doctor/Reviewer, Admin, Owner, with configurable role names.
- **Application Workflow**: A structured process from registration, permit type selection, information review, submission, automated doctor assignment, medical review, permit generation, and delivery.
- **Automated Doctor Assignment**: State-filtered round-robin system for assigning applications to doctors. Each doctor has `licensedStates` (array of state names). When a patient submits from a given state, only doctors licensed in that state are considered for the rotation. Per-state rotation tracking via `lastAssignedDoctorId_{state}` in adminSettings. Falls back to all doctors if no state-filtered doctors are available.
- **Secure Doctor Review System**: Doctors review applications via secure, token-based links without requiring login.
- **Automated Document Generation**: Permits are auto-generated upon doctor approval using the doctor's HTML form template with 26 placeholder tags (e.g., `{{patientName}}`, `{{doctorLicense}}`). Falls back to a default template if no custom template is set. Generated HTML is stored in document metadata and served via `/api/documents/:id/html` for viewing/printing.
- **Gizmo PDF Auto-Fill System**: Browser-side PDF auto-fill using `pdf-lib` (writing) and `pdfjs-dist` (rendering/scanning). Two modes: AcroForm (interactive fields matched via fuzzy normalization) and Placeholder (flat PDFs with `{token}` text scanned for coordinates). Supports 16 radio buttons for the Oklahoma disability form (A-H conditions map to `radio_id_7` through `radio_id_14`). Form data endpoint at `/api/forms/data/:applicationId` resolves PDF URL: doctor's `stateForms[patientState]` → doctor's `gizmoFormUrl` fallback. Proxy endpoint at `/api/forms/proxy-pdf` handles CORS for external PDF URLs. Viewer page at `/dashboard/applicant/documents/:applicationId/form`.
- **Per-Doctor State Forms**: Each doctor profile has a `stateForms` object mapping state names to PDF URLs (e.g., `{ "Oklahoma": "url1", "Texas": "url2" }`). Admins upload PDFs from the doctor's profile modal and assign them to specific states. When a patient's application is processed, the system matches the patient's state to the doctor's state-specific form.
- **Authorize.Net Payment Integration**: Patients pay via credit card during the application wizard using Authorize.Net Accept.js (client-side tokenization → server-side charge). Card data never touches our server. Flow: Accept.js tokenizes card → `POST /api/payment/charge` processes via Authorize.Net API → creates application with `paid` status → auto-assigns to doctor. Config endpoint: `GET /api/payment/config` returns Accept.js URL, API Login ID, and Client Key. Secrets: `AUTHORIZENET_API_LOGIN_ID`, `AUTHORIZENET_TRANSACTION_KEY`, `AUTHORIZENET_CLIENT_KEY`. Set `AUTHORIZENET_SANDBOX=true` for test mode. Server module: `server/authorizenet.ts`.
- **Manual Payment (Admin Fallback)**: Admin can process manual payments for applicants from the Users page (green $ button). Opens a dialog to select a package and enter a reason. Creates the application with paid status and triggers the full pipeline (auto-complete or doctor review). Endpoint: `POST /api/admin/users/:userId/manual-payment`. Admin can also mark existing `awaiting_payment` applications as paid via `POST /api/admin/applications/:id/process-payment`.
- **Disability Condition Questionnaire**: Step 2 of the application wizard requires applicants to select their qualifying disability condition (A through H, matching Oklahoma's Section 2 physician statement). Selection is stored as `disabilityCondition` in form data and auto-fills the corresponding radio button on the PDF.
- **Package-Specific Required Fields**: Admins define custom fields per package (text, textarea, email, phone, number, date, dropdown, radio buttons). Fields are rendered dynamically in the applicant wizard. Required fields are validated before proceeding. Field values stored in `formData` and passed through to PDF auto-fill via `patientData`. Radio fields use `radioOptions` array with 1-to-1 mapping: each option has a `radioId` (matching the PDF's `{radio_id_N}` placeholder) and `text` (the statement shown to the patient). Patient selection stores the radioId directly. Backend collects all selected radioIds from radio-mapped fields into a dedicated `selectedRadioIds` array in the form data API response, which the GizmoForm uses to check the correct PDF radio buttons. Legacy RADIO_AUTO_FILL value maps are kept as fallback for older field formats.
- **Email Notifications**: Automated transactional emails for doctor approval requests, admin notifications, and patient approval confirmations via SendGrid.
- **Diagnostics Dashboard**: Available to Admin (level 3) and Owner (level 4) at `/dashboard/admin/diagnostics` and `/dashboard/owner/diagnostics`. Two tabs: (1) Analytics — live GA4 traffic data (active users, sessions, page views, bounce rate, top pages, traffic sources, daily chart) via `GET /api/admin/ga4-analytics?dateRange=30d`. Requires `GA4_PROPERTY_ID` secret (numeric property ID). (2) Error Logs — paginated view of API/system errors logged to Firestore `errorLogs` collection via `GET /api/admin/error-logs`. Supports filtering by severity and error type. Errors are automatically logged by the error intercept middleware (wraps `res.json`) and the global crash handler in `server/index.ts`. Service modules: `server/services/errorLogger.ts`, `server/services/ga4Analytics.ts`. Frontend hook: `client/src/hooks/use-ga-tracking.ts` (page view tracking).
- **Promo Code Tracking**: Optional promo code field on the payment step of the applicant wizard. On successful payment, if a code is entered, a fire-and-forget webhook fires to `https://chronicbrandsusa.com/api/webhooks/promo-redemption` with brand="ParkingRx" and platform="ParkingRx Website". Requires `PROMO_API_KEY` secret. Service module: `server/services/promoTracking.ts`.
- **Google Analytics 4 (Frontend)**: GA4 script in `client/index.html` activates if `VITE_GA4_MEASUREMENT_ID` is set. Page view events fired on route changes via `useGATracking()` hook called in `AppInner` component inside App.tsx.
- **Global Error Logging**: Express error intercept middleware at start of `registerRoutes()` wraps `res.json` to log all 4xx/5xx API responses to Firestore `errorLogs` collection (skips `/api/admin/session` 401 and `/api/cart/*` 404). Uncaught exceptions and unhandled promise rejections are also captured via `process.on` handlers in `server/index.ts`.
- **White-Label Configuration**: Owner role has full control over branding, role names, contact info, and site media.
- **Dynamic Form Fields**: Admins can define custom required fields per service package.
- **User Management**: Admins can manage users, applications, and system settings.
- **Doctor Management**: Admins can create doctor accounts, manage their profiles, and upload document templates.
- **Automated Message Triggers**: In-app messages triggered by application status changes.
- **Comprehensive Profile System**: Full user registration collects personal, address, medical, and consent information, which auto-fills application forms.

### System Design Choices
- **Frontend**: React 18, TypeScript, Vite, Wouter, TanStack Query, shadcn/ui, Tailwind CSS.
- **Backend**: Node.js, Express.js, TypeScript.
- **Authentication**: Firebase Authentication.
- **Data Persistence**: Firebase Firestore for primary data storage, Drizzle ORM with PostgreSQL dialect for schema management and migrations.
- **Code Sharing**: `shared/schema.ts` for schema shared between frontend and backend.
- **Build System**: Vite for frontend, esbuild for backend, with server dependency bundling for optimization.

## External Dependencies

### Database
- **Firebase Firestore**: Primary data store for core application data.
- **PostgreSQL**: Used with Drizzle ORM for schema definition and migrations (though Firestore is the primary runtime store for actual data).

### Frontend Libraries
- **shadcn/ui**: UI component library.
- **Radix UI**: Low-level UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **react-hook-form**: Form management.
- **@hookform/resolvers**: Zod integration for form validation.
- **date-fns**: Date utility library.
- **Recharts**: Charting library.
- **pdf-lib**: Client-side PDF writing, AcroForm field filling, and flattening.
- **pdfjs-dist**: Client-side PDF text layer parsing for placeholder coordinate extraction.

### Backend Libraries
- **Firebase Admin SDK**: For interacting with Firebase services.
- **bcryptjs**: Password hashing.
- **multer**: Handling multipart form data for file uploads.
- **@sendgrid/mail**: Sending transactional emails.

### Development Tools
- **Vite**: Frontend build tool.
- **esbuild**: Backend bundling.
- **Drizzle ORM**: Type-safe ORM for PostgreSQL.
- **drizzle-zod**: Zod schema generation from Drizzle schemas.
- **Zod**: Schema validation library.

### Integrations
- **SendGrid**: For all transactional email services.
- **JotForm (future)**: Planned integration for document template generation.