export type TrailMateRole = "traveler" | "guide" | "company" | "admin"

export type ChatIntent =
  | "page_navigate"
  | "dashboard_navigate"
  | "discover_destinations"
  | "discover_guides"
  | "booking_create"
  | "booking_status"
  | "payment_help"
  | "payment_verify"
  | "messaging_help"
  | "notifications_summary"
  | "guide_earnings"
  | "company_revenue"
  | "team_summary"
  | "admin_analytics"
  | "admin_users"
  | "small_talk"
  | "unknown"

export type ChatAction = {
  label: string
  href?: string
  prompt?: string
}

export type ChatCard = {
  type: "summary" | "booking" | "analytics" | "profile" | "payment"
  title: string
  items: Array<{ label: string; value: string }>
}

export type ChatResponsePayload = {
  sessionId: string
  role?: TrailMateRole
  intent: ChatIntent
  reply: string
  cards?: ChatCard[]
  actions?: ChatAction[]
  followUp?: string[]
}

export type BookingCreateFlow = {
  type: "booking_create"
  step: "destination" | "dates" | "guests" | "confirm"
  data: {
    destinationName?: string
    destinationId?: string
    startDate?: string
    endDate?: string
    guests?: number
    totalPrice?: number
  }
}

export type ChatSessionState = {
  sessionId: string
  userId: string
  role: TrailMateRole
  pendingFlow?: BookingCreateFlow
  lastIntent?: ChatIntent
  history?: Array<{
    role: "user" | "assistant"
    content: string
  }>
  updatedAt: number
}
