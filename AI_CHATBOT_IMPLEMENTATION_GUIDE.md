# TrailMate AI Chatbot Implementation Guide

## 1. Goal

Build a context-aware AI assistant for TrailMate that supports all roles:

- Traveler
- Guide
- Company
- Admin

The chatbot should help users complete real tasks in the platform, not only answer FAQs.

## 2. What The Chatbot Should Do

### Traveler Assistant Scope

- Discover destinations and guides
- Explain and initiate booking flow
- Help manage bookings (status, cancel, reschedule guidance)
- Assist with JazzCash payment and verification steps
- Help send messages to guides
- Summarize notifications and upcoming bookings
- Suggest personalized options based on past activity

### Guide Assistant Scope

- Help manage profile and availability
- Summarize new booking requests and upcoming schedule
- Show earnings snapshots and trends
- Help with traveler communication
- Explain payout and payment status for bookings

### Company Assistant Scope

- Help publish and manage destinations
- Summarize incoming bookings
- Show revenue snapshots and trends
- Help with team workflows and operational actions
- Surface important unread notifications

### Admin Assistant Scope

- Summarize platform analytics
- Report user and booking activity trends
- Provide payment overview and anomalies
- Assist with user management actions
- Surface system-level notification summaries

## 3. Recommended Chatbot Architecture

Use a hybrid architecture: deterministic action layer + optional LLM reasoning layer.

### A. Frontend (Next.js)

Add a chat widget that can be mounted in layout and role dashboards.

Suggested files:

- components/chatbot/trailmate-chatbot.tsx
- hooks/use-chatbot.ts
- lib/chat/types.ts

Frontend responsibilities:

- Render conversation and quick actions
- Keep per-session chat context
- Send user messages to backend chat API
- Render structured responses as cards
- Show action buttons such as View Booking, Pay Now, Open Messages

### B. Backend (Route Handler)

Create a dedicated route handler.

Suggested file:

- app/api/chat/route.ts

Backend responsibilities:

- Resolve authenticated user and role
- Parse intent from message and context
- Enforce role-based action permissions
- Call TrailMate APIs and aggregate response
- Return structured response payload for UI rendering
- Optionally call LLM for wording and fallback handling

### C. Action Adapters

Add service functions that map intents to existing API endpoints.

Suggested files:

- lib/chat/actions/traveler.ts
- lib/chat/actions/guide.ts
- lib/chat/actions/company.ts
- lib/chat/actions/admin.ts
- lib/chat/orchestrator.ts

Each action adapter should:

- Validate required inputs
- Call one or more existing endpoints
- Normalize output into UI-ready summary blocks
- Return suggested next actions

### D. Data and Context Storage

Use short-term and long-term memory split:

- Session context: in-memory or Redis keyed by userId + sessionId
- Durable conversation logs: MongoDB collection chat_conversations

Suggested schema fields:

- userId
- role
- sessionId
- messages
- extractedEntities (destinationId, guideId, dateRange, bookingId)
- pendingTask (example: booking_creation)
- lastIntent
- createdAt, updatedAt

## 4. Intent And Action Map

Map user messages to platform actions with explicit RBAC.

### Traveler Intents

- find_destination -> GET app/api/destinations
- find_guide -> GET app/api/guides
- create_booking -> POST app/api/bookings
- booking_status -> GET app/api/bookings
- pay_booking -> POST app/api/payments
- verify_payment -> POST app/api/payments/verify
- message_guide -> POST app/api/messages
- notifications_summary -> GET app/api/notifications

### Guide Intents

- my_bookings -> GET app/api/bookings?type=guide
- earnings_summary -> GET app/api/guide/earnings
- schedule_summary -> GET app/api/bookings?type=guide
- message_traveler -> GET or POST app/api/messages
- notifications_summary -> GET app/api/notifications

### Company Intents

- company_bookings -> GET app/api/bookings?type=company
- destination_management -> GET or POST app/api/destinations
- revenue_summary -> GET app/api/company/revenue
- team_summary -> GET app/api/team
- notifications_summary -> GET app/api/notifications

### Admin Intents

- platform_analytics -> GET app/api/admin/analytics
- users_overview -> GET app/api/admin/users
- booking_payment_overview -> GET app/api/bookings + app/api/payments
- system_notifications -> GET app/api/notifications

## 5. Structured Response Format

Return a normalized payload from chat API.

Example shape:

```json
{
  "reply": "You have 3 upcoming bookings. One payment is pending.",
  "role": "traveler",
  "intent": "booking_status",
  "cards": [
    {
      "type": "booking_summary",
      "title": "Upcoming Bookings",
      "items": [{ "bookingId": "...", "status": "confirmed", "amount": 12000 }]
    }
  ],
  "actions": [
    { "label": "View Booking", "href": "/dashboard/user/bookings" },
    { "label": "Pay Now", "href": "/dashboard/user/payments" }
  ],
  "followUp": [
    "Do you want me to show only unpaid bookings?",
    "Need help contacting your guide?"
  ]
}
```

This keeps the UI consistent and makes responses actionable.

## 6. Conversation State Design

Track multi-step tasks using a lightweight task state machine.

Example booking task states:

- start
- collecting_destination
- collecting_guide
- collecting_dates
- collecting_party_size
- confirmation
- create_booking
- payment_prompt
- done

Rules:

- Never execute write actions before explicit confirmation
- If context is missing, ask only the next required question
- Persist extracted entities after each turn

## 7. Edge Case Handling

### Unverified Account

If signin status or protected API returns unverified flow:

- Explain issue clearly
- Offer direct action: Go to verify email page
- Suggest resend verification endpoint

### Failed Payment

If payment verify fails:

- Explain likely causes
- Offer retry flow and support path
- Provide action buttons to retry payment or view booking details

### Cancelled Or Completed Booking

If user asks to pay or modify an invalid booking state:

- Return current booking status
- Explain why action is blocked
- Suggest valid alternatives

### Unauthorized Role Access

If role attempts restricted data:

- Deny politely
- Explain role limitation
- Suggest allowed actions for current role

## 8. Example Conversations

### Traveler Example

User: I want to book a guide in Hunza for 3 days.

Bot:

- Great choice. I can help you complete this booking.
- Please confirm your travel dates.
- Here are top-rated guides for Hunza based on availability.

User: 12 May to 15 May, 2 people.

Bot:

- Booking summary ready.
- Destination: Hunza
- Dates: 12 May to 15 May
- Travelers: 2
- Estimated total: PKR 18,000
- Would you like me to create this booking now?

User: Yes.

Bot:

- Booking created successfully.
- Payment is pending.
- Actions:
  - Pay Now
  - View Booking
  - Message Guide

### Guide Example

User: Show my earnings this month.

Bot:

- Your earnings this month are PKR 146,000.
- 9 paid bookings, 2 pending payments.
- Top earning tour: Skardu Adventure.
- Actions:
  - Open Earnings Dashboard
  - View Pending Payments

### Company Example

User: How is our destination revenue this quarter?

Bot:

- Quarter revenue: PKR 1,920,000.
- 14.8% growth vs previous quarter.
- Top destination by revenue: Fairy Meadows.
- Actions:
  - Open Revenue Dashboard
  - Export Revenue Report

### Admin Example

User: Give me platform summary for this week.

Bot:

- New users: 128
- New bookings: 64
- Paid revenue: PKR 2,410,000
- Failed payment attempts: 7
- Actions:
  - Open Admin Analytics
  - Review User Activity
  - Investigate Failed Payments

## 9. UI And UX Recommendations

- Keep chat available as floating launcher + full panel mode
- Provide quick prompts by role when opening chatbot
- Use compact cards for booking/payment summaries
- Add one-click actions with deep links into dashboards
- Show confidence and ask clarifying questions only when required
- Provide proactive reminders:
  - upcoming booking in 24h
  - unpaid booking pending
  - unread guide or traveler message

## 10. Security And RBAC Requirements

- Read user role from validated auth token
- Never trust role from client payload
- Restrict each intent to allowed roles
- Mask sensitive fields in response payloads
- Log admin actions and high-risk operations

## 11. Suggested Implementation Phases

### Phase 1: Deterministic Assistant (No External LLM)

- Add chat UI and app/api/chat endpoint
- Implement rule-based intent parser for common intents
- Integrate booking, payment, messages, notifications actions
- Ship structured cards and quick actions

### Phase 2: AI Enhancement

- Add LLM summarization and natural phrasing
- Keep action execution deterministic through tool adapters
- Add response rewriter and fallback resolver

### Phase 3: Personalization And Proactive Support

- Add recommendation layer using history and preferences
- Add reminder triggers for upcoming bookings and pending payments
- Add analytics insights generator for guide, company, and admin

## 12. Recommended Tools And Frameworks

### Frontend

- Existing stack: Next.js App Router + React + Tailwind
- UI helpers: shadcn/ui + Radix components
- Chat UI utility options: custom component or react-markdown for rich responses

### Backend

- Existing Next.js Route Handlers for orchestration
- MongoDB for conversation logs and context state
- Zod for request and response validation contracts

### AI Layer (Optional)

Choose one:

- OpenAI API
- Azure OpenAI
- Vercel AI SDK for provider abstraction and streaming

Recommendation:

- Use Vercel AI SDK to simplify model switching and streaming responses
- Keep business actions in server-side tool functions, not direct model output

### Observability

- Structured logs per chat turn
- Intent detection metrics
- Action success and failure rates
- Response latency by role and intent

## 13. Minimal Integration Checklist

- Add chatbot launcher in app/layout.tsx or role dashboard layouts
- Create app/api/chat/route.ts with role-aware orchestration
- Add conversation context storage collection in MongoDB
- Add action adapters mapped to existing app/api routes
- Add guardrails for unverified user and unauthorized intents
- Add quick action links for View Booking, Pay Now, Open Messages
- Add test cases for traveler, guide, company, admin happy paths and edge cases

## 14. Success Criteria

The chatbot is production-ready when:

- Users can complete booking and payment guidance without leaving chat context
- Role-specific answers are accurate and permission-safe
- Failed payment and account edge cases are clearly recoverable
- Admin and business users get reliable analytics summaries
- Conversation feels helpful, contextual, and action-oriented

## 15. How To Turn It On

The chatbot is already wired into the app. To make it behave like a professional AI assistant instead of the built-in fallback, add an OpenAI key to your environment file.

### Add These Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

### Then Restart The App

```bash
pnpm dev
```

### What Happens After That

- General conversation will be handled by the AI model when available.
- TrailMate actions will still use the existing backend APIs.
- If the OpenAI key is missing, the chatbot will fall back to a local professional reply engine.

### Recommended Production Setup

- Keep the OpenAI key only in `.env.local` or your hosting provider secrets panel.
- Do not commit it to the repository.
- Use a short system prompt and let the backend keep action execution deterministic.
- Keep the chat widget enabled globally through [app/layout.tsx](app/layout.tsx).

## 16. Best Free Setup (No API Cost)

Use Ollama locally so the chatbot can have high-quality conversation for free.

### Step 1: Install Ollama

- Download and install from https://ollama.com

### Step 2: Pull a model

Run:

```bash
ollama pull llama3.1
```

### Step 3: Start Ollama server

In most setups Ollama runs automatically after install. If needed, run:

```bash
ollama serve
```

### Step 4: Configure TrailMate env

Set in `.env.local`:

```env
CHAT_PREFER_FREE=true
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1
```

### Step 5: Restart your app

```bash
pnpm dev
```

### Runtime Behavior

- Chatbot tries free local Ollama first.
- If Ollama is unavailable, it falls back to OpenAI (if key exists).
- If neither is available, it uses the built-in local conversational fallback.

## 17. Grok (xAI) Setup

If you prefer Grok as the chatbot brain, configure it as the primary provider.

### Environment Variables

```env
CHAT_PROVIDER=grok
GROK_API_KEY=your_grok_api_key
GROK_MODEL=grok-2-latest
GROK_BASE_URL=https://api.x.ai/v1
```

### Optional Fallback Strategy

- Keep `CHAT_PROVIDER=auto` to try providers in order.
- Auto order is: Grok -> Ollama -> OpenAI -> local fallback.

### Restart App

```bash
pnpm dev
```
