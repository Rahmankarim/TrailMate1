# TrailMate1

TrailMate1 is a multi-role travel platform built with Next.js and MongoDB. It supports traveler bookings, guide hiring, company-managed destinations, admin analytics, in-app messaging, notifications, and a JazzCash payment flow.

## Project Overview

TrailMate1 is designed around four user roles:

- Traveler: discover destinations/guides, create bookings, complete payments, manage profile, send messages.
- Guide: manage guide profile, receive bookings, track earnings and booking history.
- Company: publish and manage destinations, handle bookings and revenue views.
- Admin: platform-wide analytics, user management, booking/revenue visibility.

Core domain areas:

- Authentication and account security
- Booking lifecycle management
- Payment creation and verification
- Messaging and notifications
- Role-based dashboards and analytics

## Major Features

### 1. Authentication and Identity

- Email/password authentication with bcrypt hashing.
- JWT access and refresh token flow.
- Role-aware signup for traveler, guide, company, and admin.
- OTP-based email verification before account activation.
- Google OAuth support.
- Password reset and resend-verification flows.

Implementation highlights:

- Signup creates a pending verification record first, then creates the real user on OTP verification.
- Sign-in is blocked for unverified users.
- Protected routes and role-based dashboard access are enforced in [proxy.ts](proxy.ts).

### 2. Bookings System

- Create bookings for destinations or direct guide hiring.
- Track booking statuses (pending, confirmed, completed, cancelled).
- Track payment statuses (unpaid, pending, paid).
- Pagination support for booking lists.
- Automatic completion for past confirmed bookings and cleanup of blocked guide dates.

### 3. Payments (JazzCash)

- Payment initiation via JazzCash service.
- Transaction verification endpoint.
- Booking state updates after successful verification.
- Payment/booking notifications sent to relevant participants.

Payment-related source:

- [lib/payment/jazzcash.ts](lib/payment/jazzcash.ts)
- [app/api/payments/route.ts](app/api/payments/route.ts)
- [app/api/payments/verify/route.ts](app/api/payments/verify/route.ts)

### 4. Messaging and Notifications

- User-to-guide conversation flow.
- Conversation grouping and retrieval APIs.
- Notification endpoints with mark-all-read support.

### 5. Dashboards and Analytics

- Role-specific dashboard sections:
  - [app/dashboard/user](app/dashboard/user)
  - [app/dashboard/guide](app/dashboard/guide)
  - [app/dashboard/company](app/dashboard/company)
  - [app/dashboard/admin](app/dashboard/admin)
- Guide earnings analytics.
- Company revenue analytics and export.
- Admin-level platform analytics.

## Tech Stack

### Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI components
- shadcn/ui style component architecture in [components/ui](components/ui)
- react-hook-form + zod for form handling and validation
- recharts for charts/analytics visuals

### Backend and APIs

- Next.js Route Handlers under [app/api](app/api)
- MongoDB Node.js Driver
- JWT authentication (jsonwebtoken)
- bcryptjs for password hashing
- nodemailer for email delivery

### Database

- MongoDB collections accessed via shared connector in [lib/db/mongodb.ts](lib/db/mongodb.ts)
- Main collections include:
  - users
  - pending_verifications
  - guides
  - destinations
  - bookings
  - payments
  - messages
  - notifications

### Tooling and Build

- Node.js runtime
- pnpm lockfile present ([pnpm-lock.yaml](pnpm-lock.yaml))
- ESLint via [package.json](package.json) scripts
- PostCSS + Tailwind pipeline

## Project Structure

Important directories:

- [app](app): all routes, pages, and route handlers.
- [app/api](app/api): backend endpoints by feature/module.
- [components](components): shared UI and layout components.
- [contexts](contexts): global React contexts (auth context lives here).
- [hooks](hooks): reusable client hooks.
- [lib](lib): business logic, auth utilities, payment integration, DB access, validators.
- [public](public): static assets.
- [styles](styles): global styles.
- [**tests**](__tests__): authentication/profile-related tests.

## API Surface (High-Level)

Route groups currently implemented:

- Auth: [app/api/auth](app/api/auth)
- Bookings: [app/api/bookings](app/api/bookings)
- Payments: [app/api/payments](app/api/payments)
- Destinations: [app/api/destinations](app/api/destinations)
- Guides: [app/api/guides](app/api/guides)
- Messages: [app/api/messages](app/api/messages)
- Notifications: [app/api/notifications](app/api/notifications)
- Profile: [app/api/profile](app/api/profile)
- Reviews: [app/api/reviews](app/api/reviews)
- Saved items: [app/api/saved](app/api/saved)
- Team management: [app/api/team](app/api/team)
- Story/content APIs: [app/api/stories](app/api/stories), [app/api/company](app/api/company), [app/api/admin](app/api/admin)

## Authentication and Access Control

- Cookies are used for access and refresh tokens.
- Access checks happen in route handlers and in [proxy.ts](proxy.ts).
- Protected UI and API paths are filtered by route type and role.
- Invalid tokens trigger unauthorized responses or dashboard redirects.

## Local Development Setup

### Prerequisites

- Node.js 20+ recommended
- pnpm (or npm)
- MongoDB instance (local or Atlas)

### Install Dependencies

```bash
pnpm install
```

### Configure Environment Variables

Create a `.env.local` file in the project root and configure at least:

```env
MONGODB_URI=mongodb+srv://...

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com

JAZZCASH_ENVIRONMENT=sandbox
JAZZCASH_MERCHANT_ID=...
JAZZCASH_PASSWORD=...
JAZZCASH_INTEGRITY_SALT=...
```

### Run in Development

```bash
pnpm dev
```

App default URL:

- http://localhost:3000

## Scripts

Available scripts in [package.json](package.json):

- `pnpm dev` - Start development server.
- `pnpm build` - Build production bundle.
- `pnpm start` - Run production server.
- `pnpm lint` - Run ESLint.

## Documentation Index

This repository includes focused implementation guides:

- [AI_CHATBOT_IMPLEMENTATION_GUIDE.md](AI_CHATBOT_IMPLEMENTATION_GUIDE.md)
- [SETUP_GUIDE.md](SETUP_GUIDE.md)
- [EMAIL_VERIFICATION_DOCS.md](EMAIL_VERIFICATION_DOCS.md)
- [PAYMENT_FLOW_GUIDE.md](PAYMENT_FLOW_GUIDE.md)
- [PAYMENT_IMPLEMENTATION_CHECKLIST.md](PAYMENT_IMPLEMENTATION_CHECKLIST.md)
- [PAYMENT_LOGIC_FIX_SUMMARY.md](PAYMENT_LOGIC_FIX_SUMMARY.md)
- [JAZZCASH_MIGRATION.md](JAZZCASH_MIGRATION.md)
- [QUICK_START_JAZZCASH.md](QUICK_START_JAZZCASH.md)
- [MESSAGING_SYSTEM_GUIDE.md](MESSAGING_SYSTEM_GUIDE.md)
- [MESSAGING_QUICK_REFERENCE.md](MESSAGING_QUICK_REFERENCE.md)
- [DASHBOARD_IMPLEMENTATION_GUIDE.md](DASHBOARD_IMPLEMENTATION_GUIDE.md)
- [BOOKING_SEPARATION_GUIDE.md](BOOKING_SEPARATION_GUIDE.md)
- [GUIDE_HIRING_FEATURE.md](GUIDE_HIRING_FEATURE.md)

## Important Notes

- [next.config.mjs](next.config.mjs) currently has `typescript.ignoreBuildErrors: true`. This allows builds to pass with type errors and should be used carefully.
- Remote image hosts are explicitly whitelisted in [next.config.mjs](next.config.mjs).
- Some debug-oriented routes and logging are present for messaging/payment troubleshooting.

## Summary

TrailMate1 is a full-stack, role-driven travel marketplace application with production-style flows for authentication, booking, payment verification, messaging, and analytics. The codebase is organized feature-first under the App Router with clear API modules and shared domain logic under [lib](lib).
