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
- **Automated Doctor Assignment**: Global round-robin system for assigning applications to doctors.
- **Secure Doctor Review System**: Doctors review applications via secure, token-based links without requiring login.
- **Automated Document Generation**: Permits are automatically generated upon doctor approval, incorporating doctor credentials.
- **Email Notifications**: Automated transactional emails for doctor approval requests, admin notifications, and patient approval confirmations via SendGrid.
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