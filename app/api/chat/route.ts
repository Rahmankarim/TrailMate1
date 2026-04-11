import { randomUUID } from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAccessToken, type UserRole } from '@/lib/auth/jwt'
import { getOrCreateChatSession, saveChatSession } from '@/lib/chat/session-store'
import type {
  ChatAction,
  ChatCard,
  ChatIntent,
  ChatResponsePayload,
  ChatSessionState,
  TrailMateRole,
} from '@/lib/chat/types'

type JsonRecord = Record<string, any>

function asRole(role: UserRole): TrailMateRole {
  return role
}

function normalizeText(value: string) {
  return value.toLowerCase().trim()
}

function trimHistory(history: Array<{ role: 'user' | 'assistant'; content: string }> = [], limit = 8) {
  return history.slice(-limit)
}

type NavigationTarget = {
  label: string
  path: string
  keywords: string[]
  requiresAuth?: boolean
  allowedRoles?: TrailMateRole[]
  taskReply?: string
}

function normalizeForMatch(value: string) {
  return normalizeText(value).replace(/[^a-z0-9/\s-]/g, ' ').replace(/\s+/g, ' ').trim()
}

function isNavigationCommand(input: string) {
  return /\b(open|go to|go|navigate|show|take me to|visit|launch)\b/.test(input) || input.startsWith('/')
}

function getNavigationTargets(role?: TrailMateRole): NavigationTarget[] {
  const dashboardPath = role ? roleDashboardPath(role) : '/dashboard/user'
  const dashboardBookingsPath = role ? roleDashboardPath(role) + '/bookings' : '/dashboard/user/bookings'
  const dashboardMessagesPath = role ? roleDashboardPath(role) + '/messages' : '/dashboard/user/messages'
  const dashboardNotificationsPath = role ? roleDashboardPath(role) + '/notifications' : '/dashboard/user/notifications'

  return [
    { label: 'Home', path: '/', keywords: ['home', 'main page', 'landing', 'start page'] },
    { label: 'About', path: '/about', keywords: ['about', 'about us'] },
    { label: 'Contact', path: '/contact', keywords: ['contact', 'support', 'help center'] },
    { label: 'Blog', path: '/blog', keywords: ['blog', 'articles', 'news'] },
    { label: 'Select Role', path: '/auth/select-role', keywords: ['select role', 'choose role', 'role selection'] },
    { label: 'Forgot Password', path: '/forgot-password', keywords: ['forgot password', 'recover account', 'password reset request'] },
    { label: 'Reset Password', path: '/reset-password', keywords: ['reset password', 'set new password'] },
    { label: 'Verify Email', path: '/verify-email', keywords: ['verify email', 'email verification'] },
    { label: 'Resend Verification', path: '/resend-verification', keywords: ['resend verification', 'resend email verification'] },
    { label: 'Destinations', path: '/destinations', keywords: ['destinations', 'places', 'where to go'], taskReply: 'Opening destinations. You can browse places, seasons, and highlights here.' },
    { label: 'Guides', path: '/guides', keywords: ['guides', 'local guides', 'hire guide'], taskReply: 'Opening guides. You can compare profiles, ratings, and specialties here.' },
    { label: 'Stories', path: '/stories', keywords: ['stories', 'travel stories', 'community stories'] },
    { label: 'Sign In', path: '/signin', keywords: ['sign in', 'login', 'log in', 'signin'] },
    { label: 'Sign Up', path: '/signup', keywords: ['sign up', 'register', 'create account', 'signup'] },
    { label: 'Profile', path: '/profile', keywords: ['profile', 'my profile', 'account profile'], requiresAuth: true, taskReply: 'Opening profile. You can update your personal details here.' },
    { label: 'Settings', path: '/settings', keywords: ['settings', 'preferences', 'account settings'], requiresAuth: true, taskReply: 'Opening settings. You can manage your account and preferences here.' },
    { label: 'Dashboard', path: dashboardPath, keywords: ['dashboard', 'dashbaord', 'my dashboard', 'control panel'], requiresAuth: true, taskReply: 'Opening your dashboard now.' },
    { label: 'Bookings', path: dashboardBookingsPath, keywords: ['bookings', 'my bookings', 'reservation list'], requiresAuth: true, taskReply: 'Opening bookings. You can track and manage reservations here.' },
    { label: 'Messages', path: dashboardMessagesPath, keywords: ['messages', 'chat inbox', 'inbox'], requiresAuth: true, taskReply: 'Opening messages. You can chat with guides and travelers here.' },
    { label: 'Notifications', path: dashboardNotificationsPath, keywords: ['notifications', 'alerts', 'updates'], requiresAuth: true, taskReply: 'Opening notifications. You can review your latest updates here.' },
    { label: 'Traveler Profile', path: '/dashboard/user/profile', keywords: ['traveler profile', 'user profile dashboard'], requiresAuth: true, allowedRoles: ['traveler'], taskReply: 'Opening your traveler profile page.' },
    { label: 'Traveler Reviews', path: '/dashboard/user/reviews', keywords: ['my reviews', 'traveler reviews'], requiresAuth: true, allowedRoles: ['traveler'], taskReply: 'Opening your review history.' },
    { label: 'Saved Items', path: '/dashboard/user/saved', keywords: ['saved', 'saved places', 'wishlist'], requiresAuth: true, allowedRoles: ['traveler'], taskReply: 'Opening your saved destinations and guides.' },
    { label: 'Payments', path: '/dashboard/user/payments', keywords: ['payments', 'jazzcash', 'checkout', 'payment'], requiresAuth: true, allowedRoles: ['traveler'], taskReply: 'Opening payments. You can verify and manage booking payments here.' },
    { label: 'Guide Dashboard', path: '/dashboard/guide', keywords: ['guide dashboard', 'guide panel'], requiresAuth: true, allowedRoles: ['guide'], taskReply: 'Opening guide dashboard now.' },
    { label: 'Guide Bookings', path: '/dashboard/guide/bookings', keywords: ['guide bookings', 'my assigned bookings'], requiresAuth: true, allowedRoles: ['guide'], taskReply: 'Opening guide bookings.' },
    { label: 'Guide Destinations', path: '/dashboard/guide/destinations', keywords: ['guide destinations', 'manage destinations guide'], requiresAuth: true, allowedRoles: ['guide'], taskReply: 'Opening destination management for guides.' },
    { label: 'Guide New Destination', path: '/dashboard/guide/destinations/new', keywords: ['new guide destination', 'add destination guide'], requiresAuth: true, allowedRoles: ['guide'], taskReply: 'Opening create destination form for guides.' },
    { label: 'Guide Messages', path: '/dashboard/guide/messages', keywords: ['guide messages', 'guide inbox'], requiresAuth: true, allowedRoles: ['guide'], taskReply: 'Opening guide messaging center.' },
    { label: 'Guide Profile', path: '/dashboard/guide/profile', keywords: ['guide profile'], requiresAuth: true, allowedRoles: ['guide'], taskReply: 'Opening guide profile settings.' },
    { label: 'Guide Reviews', path: '/dashboard/guide/reviews', keywords: ['guide reviews', 'my guide reviews'], requiresAuth: true, allowedRoles: ['guide'], taskReply: 'Opening guide review insights.' },
    { label: 'Guide Stories', path: '/dashboard/guide/stories', keywords: ['guide stories', 'my stories guide'], requiresAuth: true, allowedRoles: ['guide'], taskReply: 'Opening guide stories manager.' },
    { label: 'Guide Tours', path: '/dashboard/guide/tours', keywords: ['guide tours', 'my tours guide'], requiresAuth: true, allowedRoles: ['guide'], taskReply: 'Opening guide tours page.' },
    { label: 'Guide Earnings', path: '/dashboard/guide/earnings', keywords: ['earnings', 'guide earnings', 'income'], requiresAuth: true, allowedRoles: ['guide'], taskReply: 'Opening earnings. You can review income and payout details here.' },
    { label: 'Company Dashboard', path: '/dashboard/company', keywords: ['company dashboard', 'company panel'], requiresAuth: true, allowedRoles: ['company'], taskReply: 'Opening company dashboard now.' },
    { label: 'Company Analytics', path: '/dashboard/company/analytics', keywords: ['company analytics', 'business analytics'], requiresAuth: true, allowedRoles: ['company'], taskReply: 'Opening company analytics.' },
    { label: 'Company Bookings', path: '/dashboard/company/bookings', keywords: ['company bookings', 'business bookings'], requiresAuth: true, allowedRoles: ['company'], taskReply: 'Opening company bookings.' },
    { label: 'Company New Destination', path: '/dashboard/company/destinations/new', keywords: ['new company destination', 'add destination company'], requiresAuth: true, allowedRoles: ['company'], taskReply: 'Opening create destination form for company.' },
    { label: 'Company Guide Hiring', path: '/dashboard/company/guide-hiring', keywords: ['guide hiring', 'hire guide company'], requiresAuth: true, allowedRoles: ['company'], taskReply: 'Opening guide hiring workflow.' },
    { label: 'Company Messages', path: '/dashboard/company/messages', keywords: ['company messages', 'company inbox'], requiresAuth: true, allowedRoles: ['company'], taskReply: 'Opening company messages.' },
    { label: 'Company Profile', path: '/dashboard/company/profile', keywords: ['company profile'], requiresAuth: true, allowedRoles: ['company'], taskReply: 'Opening company profile page.' },
    { label: 'Company Settings', path: '/dashboard/company/settings', keywords: ['company settings', 'business settings'], requiresAuth: true, allowedRoles: ['company'], taskReply: 'Opening company settings.' },
    { label: 'Company Tours', path: '/dashboard/company/tours', keywords: ['company tours', 'manage tours'], requiresAuth: true, allowedRoles: ['company'], taskReply: 'Opening company tours manager.' },
    { label: 'Company Revenue', path: '/dashboard/company/revenue', keywords: ['company revenue', 'revenue', 'sales'], requiresAuth: true, allowedRoles: ['company'], taskReply: 'Opening revenue. You can review financial summaries here.' },
    { label: 'Company Team', path: '/dashboard/company/team', keywords: ['team', 'staff', 'team members'], requiresAuth: true, allowedRoles: ['company'], taskReply: 'Opening team. You can manage team members here.' },
    { label: 'Admin Dashboard', path: '/dashboard/admin', keywords: ['admin dashboard', 'admin panel'], requiresAuth: true, allowedRoles: ['admin'], taskReply: 'Opening admin dashboard.' },
    { label: 'Admin Companies', path: '/dashboard/admin/companies', keywords: ['admin companies', 'manage companies'], requiresAuth: true, allowedRoles: ['admin'], taskReply: 'Opening companies management.' },
    { label: 'Admin Destinations', path: '/dashboard/admin/destinations', keywords: ['admin destinations', 'moderate destinations'], requiresAuth: true, allowedRoles: ['admin'], taskReply: 'Opening destination moderation and management.' },
    { label: 'Admin Moderation', path: '/dashboard/admin/moderation', keywords: ['admin moderation', 'content moderation'], requiresAuth: true, allowedRoles: ['admin'], taskReply: 'Opening moderation tools.' },
    { label: 'Admin Profile', path: '/dashboard/admin/profile', keywords: ['admin profile'], requiresAuth: true, allowedRoles: ['admin'], taskReply: 'Opening admin profile.' },
    { label: 'Admin Analytics', path: '/dashboard/admin/analytics', keywords: ['admin analytics', 'analytics', 'platform analytics'], requiresAuth: true, allowedRoles: ['admin'], taskReply: 'Opening analytics. You can monitor platform metrics here.' },
    { label: 'Admin Users', path: '/dashboard/admin/users', keywords: ['admin users', 'manage users', 'users'], requiresAuth: true, allowedRoles: ['admin'], taskReply: 'Opening users. You can manage platform users here.' },
    { label: 'Destination Details', path: '/destinations/[slug]', keywords: ['destination detail', 'destination details page'], taskReply: 'Please tell me the destination slug, then I can open that specific destination page.' },
    { label: 'Guide Details', path: '/guides/[id]', keywords: ['guide detail', 'guide details page'], taskReply: 'Please share the guide id, then I can open that guide profile page.' },
    { label: 'Story Details', path: '/stories/[id]', keywords: ['story detail', 'story details page'], taskReply: 'Please share the story id, then I can open that story page.' },
    { label: 'Blog Article', path: '/blog/[slug]', keywords: ['blog detail', 'blog article page'], taskReply: 'Please share the blog slug, then I can open that article.' },
    { label: 'Guide Destination Edit', path: '/dashboard/guide/destinations/[id]/edit', keywords: ['edit guide destination', 'guide destination edit'], requiresAuth: true, allowedRoles: ['guide'], taskReply: 'Please share the destination id, then I can open the guide destination edit page.' },
    { label: 'Company Destination Edit', path: '/dashboard/company/destinations/[id]/edit', keywords: ['edit company destination', 'company destination edit'], requiresAuth: true, allowedRoles: ['company'], taskReply: 'Please share the destination id, then I can open the company destination edit page.' },
  ]
}

function resolveNavigation(message: string, role?: TrailMateRole) {
  const input = normalizeForMatch(message)
  if (!isNavigationCommand(input)) return null

  const targets = getNavigationTargets(role)

  if (input.startsWith('/')) {
    if (/^\/(about|contact|blog|destinations|guides|stories|signin|signup|profile|settings|forgot-password|reset-password|verify-email|resend-verification|auth\/select-role|dashboard(\/[a-z0-9\-_/]+)?)$/.test(input)) {
      return {
        label: 'Requested Page',
        path: input,
        keywords: [],
        requiresAuth: input.startsWith('/dashboard') || input === '/profile' || input === '/settings',
      } as NavigationTarget
    }

    const exact = targets.find((target) => target.path === input)
    if (exact) return exact

    if (/^\/destinations\/[a-z0-9-]+$/.test(input)) {
      return { label: 'Destination Details', path: input, keywords: [], taskReply: 'Opening destination details page.' }
    }
    if (/^\/guides\/[a-z0-9-]+$/.test(input)) {
      return { label: 'Guide Details', path: input, keywords: [], taskReply: 'Opening guide profile page.' }
    }
    if (/^\/stories\/[a-z0-9-]+$/.test(input)) {
      return { label: 'Story Details', path: input, keywords: [], taskReply: 'Opening story page.' }
    }
    if (/^\/blog\/[a-z0-9-]+$/.test(input)) {
      return { label: 'Blog Article', path: input, keywords: [], taskReply: 'Opening blog article.' }
    }
    if (/^\/dashboard\/guide\/destinations\/[a-z0-9-]+\/edit$/.test(input)) {
      return { label: 'Guide Destination Edit', path: input, keywords: [], requiresAuth: true, allowedRoles: ['guide'], taskReply: 'Opening guide destination edit page.' }
    }
    if (/^\/dashboard\/company\/destinations\/[a-z0-9-]+\/edit$/.test(input)) {
      return { label: 'Company Destination Edit', path: input, keywords: [], requiresAuth: true, allowedRoles: ['company'], taskReply: 'Opening company destination edit page.' }
    }
  }

  const destinationSlugMatch = input.match(/destination\s+([a-z0-9-]+)/)
  if (destinationSlugMatch?.[1]) {
    return { label: 'Destination Details', path: '/destinations/' + destinationSlugMatch[1], keywords: [], taskReply: 'Opening destination details page.' }
  }

  const guideIdMatch = input.match(/guide\s+([a-z0-9-]+)/)
  if (guideIdMatch?.[1]) {
    return { label: 'Guide Details', path: '/guides/' + guideIdMatch[1], keywords: [], taskReply: 'Opening guide profile page.' }
  }

  const storyIdMatch = input.match(/story\s+([a-z0-9-]+)/)
  if (storyIdMatch?.[1]) {
    return { label: 'Story Details', path: '/stories/' + storyIdMatch[1], keywords: [], taskReply: 'Opening story page.' }
  }

  const blogSlugMatch = input.match(/blog\s+([a-z0-9-]+)/)
  if (blogSlugMatch?.[1]) {
    return { label: 'Blog Article', path: '/blog/' + blogSlugMatch[1], keywords: [], taskReply: 'Opening blog article.' }
  }

  let best: NavigationTarget | null = null
  let bestScore = 0

  for (const target of targets) {
    const score = target.keywords.reduce((acc, keyword) => (input.includes(keyword) ? acc + keyword.length : acc), 0)
    if (score > bestScore) {
      bestScore = score
      best = target
    }
  }

  return bestScore > 0 ? best : null
}

function detectIntent(text: string): ChatIntent {
  const input = normalizeText(text)
  if (!input) return 'unknown'

  if (/open|go.*dashboard|show.*dashboard|navigate.*dashboard/.test(input)) return 'dashboard_navigate'
  if (/book|reserve|hire|trip/.test(input) && /create|new|start|need|want/.test(input)) return 'booking_create'
  if (/booking|reservation/.test(input) && /status|track|my|list/.test(input)) return 'booking_status'
  if (/destination|place|trip|where.*go|travel/.test(input)) return 'discover_destinations'
  if (/guide|hire guide/.test(input)) return 'discover_guides'
  if (/pay|payment|jazzcash/.test(input) && /verify|confirm|failed/.test(input)) return 'payment_verify'
  if (/pay|payment|jazzcash/.test(input)) return 'payment_help'
  if (/message|chat|contact/.test(input)) return 'messaging_help'
  if (/notification|alert|unread/.test(input)) return 'notifications_summary'
  if (/earning|income|revenue/.test(input)) return 'guide_earnings'
  if (/company revenue|sales/.test(input)) return 'company_revenue'
  if (/team|staff|members/.test(input)) return 'team_summary'
  if (/admin|analytics/.test(input)) return 'admin_analytics'
  if (/user.*manage|users/.test(input)) return 'admin_users'
  if (/hi|hello|hey/.test(input)) return 'small_talk'
  
  return 'unknown'
}

function isGeneralConversation(text: string) {
  const input = normalizeText(text)
  const generalPrompts = /how are you|who are you|what can you do|tell me about|let's talk|just chat/
  const questionEnds = input.endsWith('?')
  return generalPrompts.test(input) || questionEnds
}

function buildTravelResponse(message: string): string {
  const input = normalizeText(message)
  
  // Greetings
  if (/^(hi|hello|hey)$/.test(input)) return 'Hi there! I am TrailMate. Ready to help you plan an amazing trip?'
  if (/how are you/.test(input)) return 'Doing great! Ready to help with travel planning. What destination interests you?'
  if (/who are you|what can you do|tell me about yourself/.test(input)) {
    return 'I am TrailMate AI. I help with: destination discovery, guide recommendations, bookings, itinerary planning, travel tips, accommodation suggestions, and payment help. Ask me about Pakistan travel!'
  }
  
  // Destination recommendations
  if (/where should|best place|best destination|suggest.*destination|recommend/.test(input)) {
    return 'Pakistan has incredible destinations. In the north: Hunza (scenic), Skardu (adventure), Fairy Meadows (trekking). In central: Lahore (culture), Islamabad (modern). What interests you - mountains, culture, or adventure?'
  }
  
  // Specific destinations
  if (/hunza/.test(input)) {
    return 'Hunza is stunning! Known for Baltit Fort, Attabad Lake, Passu Cones. Best time: May-Oct. Perfect for: hiking, sightseeing, cultural tours. Very safe and friendly. Want to know more about activities?'
  }
  if (/skardu/.test(input)) {
    return 'Skardu is the adventure capital! Gateway to K2, Deosai mountains, Satpara Lake. Best time: May-Sept. Perfect for: trekking, mountaineering, photography. Amazing food too!'
  }
  if (/fairy meadows|nanga parbat/.test(input)) {
    return 'Fairy Meadows is magical - a high-altitude meadow at the base of Nanga Parbat. For serious trekkers. Best time: Jun-Sept. Incredible mountains, challenging terrain, unforgettable experience.'
  }
  if (/lahore/.test(input)) {
    return 'Lahore is vibrant! Visit Badshahi Mosque, Lahore Fort, food markets. Best time: Oct-March. Amazing food, rich culture, shopping. Very walkable and welcoming.'
  }
  if (/karl|islamabad/.test(input)) {
    return 'Islamabad is modern and beautiful. Visit Faisal Mosque, Margalla Hills hiking, museums. Best time: Mar-May, Sep-Nov. Great for relaxation and nature lovers.'
  }
  
  // Itinerary and planning
  if (/3.day|three day|itinerary|plan.*trip|create.*itinerary/.test(input)) {
    return 'I can help plan! Tell me: where to go, how many days, what interests you (hiking, culture, relaxation), and budget. Then I will suggest activities, accommodation, and guides.'
  }
  
  // Travel advice
  if (/packing|what.*bring|clothes/.test(input)) {
    return 'Pack layers, good trekking shoes, sun protection, first aid kit, power bank. In summer: light clothes. In winter: warm jacket. Always bring copies of documents!'
  }
  if (/best time|when.*visit|weather|climate/.test(input)) {
    return 'Northern mountains: best May-Oct. Southern plains: best Nov-March. Summers are hot in south, cold at high altitudes. Monsoons Jul-Aug. What region interests you?'
  }
  if (/safe|safety|dangerous/.test(input)) {
    return 'Northern tourist areas (Hunza, Skardu) are very safe. Always hire local guides, follow advice, and check authorities. Pakistan is wonderful for travelers who are respectful and prepared.'
  }
  if (/activities|things to do|what.*do/.test(input)) {
    return 'Popular activities: hiking, trekking, mountaineering, cultural tours, local food experiences, photography, sightseeing, water activities, desert safaris. What appeals to you most?'
  }
  if (/accommodation|hotel|stay|guesthouse|camping/.test(input)) {
    return 'Options: luxury hotels (cities), mid-range guesthouses (mountains), budget hostels (backpackers), camping (nature), homestays (authentic). I can suggest based on destination and budget.'
  }
  if (/transport|bus|flight|car|train|how.*reach/.test(input)) {
    return 'Options: flights (Islamabad/Lahore to Skardu), buses (across Pakistan), car rental (explore freely), private drivers (convenient), trains (scenic). What destination are you heading to?'
  }
  if (/guide|hire|local guide/.test(input)) {
    return 'I can help find local guides! Guides provide: local knowledge, safety, language help, authentic experiences. Browse guides by location, ratings, and specialty. Want to see available guides?'
  }
  
  // Bookings
  if (/how.*book|book.*trip|create.*booking|start.*booking/.test(input)) {
    return 'To book: browse destinations, select dates, choose a guide if needed, review details, confirm, and pay. I can guide each step. Ready to start?'
  }
  if (/payment|pay|jazzcash|checkout/.test(input)) {
    return 'We support JazzCash. Bookings confirmed after payment. Cancellations within 7 days may be refunded. Contact support for payment help.'
  }
  
  // Account
  if (/account|profile|sign.*up|register/.test(input)) {
    return 'You can sign up anytime at /signup to save destinations, bookings, and leave reviews. Once signed in you have access to booking history and guide messages.'
  }
  
  // General fallback
  if (/help|assist|support|question/.test(input)) {
    return 'I can help with: destinations, guides, bookings, payments, itineraries, accommodations, transport, packing, travel tips, and safety. What would you like to know?'
  }
  if (/thanks|thank you/.test(input)) {
    return 'Welcome! Happy to help. Do you have more travel questions or ready to book?'
  }
  
  return 'Great question! Tell me more about your travel plans - where do you want to go, how many days, and what interests you. I will help create your perfect trip.'
}

async function generateGrokResponse(message: string): Promise<string | null> {
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY
  if (!apiKey) return null
  
  const baseUrl = process.env.GROK_BASE_URL || 'https://api.x.ai/v1'
  const model = process.env.GROK_MODEL || 'grok-2-latest'
  
  try {
    const response = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are TrailMate, a friendly pakistan travel assistant. Be helpful, concise, and natural.' },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 320,
      }),
    })
    
    if (!response.ok) return null
    const data = await response.json()
    return data?.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

function roleDashboardPath(role: TrailMateRole) {
  return role === 'traveler' ? '/dashboard/user' : '/dashboard/' + role
}

async function apiCall(request: NextRequest, path: string, init?: RequestInit) {
  const origin = request.nextUrl.origin
  const cookieHeader = request.headers.get('cookie') || ''
  
  const response = await fetch(origin + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader, ...(init?.headers || {}) },
    cache: 'no-store',
  })
  
  const body = response.headers.get('content-type')?.includes('json') ? await response.json() : null
  return { ok: response.ok, status: response.status, body }
}

function canUseIntent(role: TrailMateRole, intent: ChatIntent) {
  const allowed: Record<TrailMateRole, Set<ChatIntent>> = {
    traveler: new Set(['dashboard_navigate', 'discover_destinations', 'discover_guides', 'booking_create', 'booking_status', 'payment_help', 'payment_verify', 'messaging_help', 'notifications_summary', 'small_talk', 'unknown']),
    guide: new Set(['dashboard_navigate', 'booking_status', 'messaging_help', 'notifications_summary', 'guide_earnings', 'small_talk', 'unknown']),
    company: new Set(['dashboard_navigate', 'booking_status', 'notifications_summary', 'company_revenue', 'team_summary', 'small_talk', 'unknown']),
    admin: new Set(['dashboard_navigate', 'admin_analytics', 'admin_users', 'booking_status', 'notifications_summary', 'small_talk', 'unknown']),
  }
  return allowed[role]?.has(intent) ?? false
}

function flattenArray(payload: any, key: string) {
  if (!payload) return []
  if (Array.isArray(payload[key])) return payload[key]
  if (Array.isArray(payload.data)) return payload.data
  return []
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { message?: string; sessionId?: string }
    const message = (body.message || '').trim()
    const sessionId = body.sessionId || randomUUID()
    
    if (!message) {
      return NextResponse.json(
        { sessionId, intent: 'unknown', reply: 'Tell me what you would like to know about travel!' } satisfies ChatResponsePayload,
        { status: 200 },
      )
    }
    
    const intent = detectIntent(message)
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    const guestNavigation = resolveNavigation(message)
    
    if (!token) {
      if (guestNavigation) {
        if (guestNavigation.requiresAuth) {
          return NextResponse.json(
            {
              sessionId,
              intent: 'unknown',
              reply: 'Please sign in first, then I can open ' + guestNavigation.label + ' for you.',
              actions: [
                { label: 'Sign In', href: '/signin' },
                { label: 'Sign Up', href: '/signup' },
              ],
            } satisfies ChatResponsePayload,
            { status: 200 },
          )
        }

        return NextResponse.json(
          {
            sessionId,
            intent: 'page_navigate',
            reply: guestNavigation.taskReply || 'Opening ' + guestNavigation.label + ' now.',
            actions: [{ label: 'Open ' + guestNavigation.label, href: guestNavigation.path }],
          } satisfies ChatResponsePayload,
          { status: 200 },
        )
      }

      if (isGeneralConversation(message)) {
        const grokReply = await generateGrokResponse(message)
        const reply = grokReply || buildTravelResponse(message)
        return NextResponse.json(
          { sessionId, intent: 'unknown', reply, followUp: ['Sign in for account features.'] } satisfies ChatResponsePayload,
          { status: 200 },
        )
      }
      
      return NextResponse.json(
        {
          sessionId,
          intent: 'unknown',
          reply: 'Sign in to access bookings, payments, and personalized features.',
          actions: [
            { label: 'Sign In', href: '/signin' },
            { label: 'Sign Up', href: '/signup' },
          ],
        } satisfies ChatResponsePayload,
        { status: 200 },
      )
    }
    
    const payload = verifyAccessToken(token)
    if (!payload) {
      if (isGeneralConversation(message)) {
        const reply = buildTravelResponse(message)
        return NextResponse.json({ sessionId, intent: 'unknown', reply } satisfies ChatResponsePayload, { status: 200 })
      }
      return NextResponse.json(
        { sessionId, intent: 'unknown', reply: 'Session expired. Please sign in again.', actions: [{ label: 'Sign In', href: '/signin' }] } satisfies ChatResponsePayload,
        { status: 200 },
      )
    }
    
    const role = asRole(payload.role)
    const navigation = resolveNavigation(message, role)

    if (navigation) {
      if (navigation.allowedRoles && !navigation.allowedRoles.includes(role)) {
        return NextResponse.json(
          {
            sessionId,
            role,
            intent: 'unknown',
            reply: navigation.label + ' is not available for your role. Opening your dashboard instead.',
            actions: [{ label: 'Go to Dashboard', href: roleDashboardPath(role) }],
          } satisfies ChatResponsePayload,
          { status: 200 },
        )
      }

      return NextResponse.json(
        {
          sessionId,
          role,
          intent: 'page_navigate',
          reply: navigation.taskReply || 'Opening ' + navigation.label + ' now.',
          actions: [{ label: 'Open ' + navigation.label, href: navigation.path }],
        } satisfies ChatResponsePayload,
        { status: 200 },
      )
    }

    const session = getOrCreateChatSession(payload.userId, role, sessionId)
    session.history = session.history || []
    session.history.push({ role: 'user', content: message })
    session.history = trimHistory(session.history)
    
    if (!canUseIntent(role, intent)) {
      saveChatSession(session)
      return NextResponse.json({ sessionId: session.sessionId, role, intent, reply: 'Not available for your role.', actions: [{ label: 'Dashboard', href: roleDashboardPath(role) }] } satisfies ChatResponsePayload, { status: 200 })
    }
    
    let reply = ''
    let actions: ChatAction[] = []
    let cards: ChatCard[] = []
    
    if (intent === 'dashboard_navigate') {
      reply = 'Opening your dashboard...'
      actions = [{ label: 'Go to Dashboard', href: roleDashboardPath(role) }]
    } else if (intent === 'small_talk' || intent === 'unknown' || isGeneralConversation(message)) {
      const grokReply = await generateGrokResponse(message)
      reply = grokReply || buildTravelResponse(message)
    } else if (intent === 'discover_destinations') {
      const res = await apiCall(request, '/api/destinations?published=true&paginate=false')
      const destinations = (res.body?.destinations || []).slice(0, 3)
      reply = destinations.length ? 'Here are popular destinations.' : 'No destinations available now.'
      actions = [{ label: 'Browse Destinations', href: '/destinations' }]
    } else if (intent === 'discover_guides') {
      const res = await apiCall(request, '/api/guides?published=true&paginate=false')
      const guides = (res.body?.guides || []).slice(0, 3)
      reply = guides.length ? 'Here are top guides.' : 'No guides available now.'
      actions = [{ label: 'Browse Guides', href: '/guides' }]
    } else if (intent === 'booking_create') {
      reply = 'To create a booking, browse destinations or tell me a destination name.'
      actions = [{ label: 'Browse Destinations', href: '/destinations' }]
    } else if (intent === 'booking_status') {
      const type = role === 'traveler' ? 'traveler' : role
      const res = await apiCall(request, '/api/bookings?type=' + type + '&paginate=false')
      const bookings = flattenArray(res.body, 'bookings')
      reply = bookings.length ? 'You have ' + bookings.length + ' bookings.' : 'No bookings yet.'
      actions = [{ label: 'View Bookings', href: roleDashboardPath(role) + '/bookings' }]
    } else if (intent === 'payment_help') {
      reply = 'Go to dashboard to pay for bookings or verify payments. I can help with questions.'
      actions = [{ label: 'Payments', href: '/dashboard/user/payments' }]
    } else if (intent === 'messaging_help') {
      reply = 'Message guides or travelers from your dashboard.'
      actions = [{ label: 'Messages', href: roleDashboardPath(role) + '/messages' }]
    } else if (intent === 'notifications_summary') {
      const res = await apiCall(request, '/api/notifications?paginate=false')
      const items = flattenArray(res.body, 'notifications')
      reply = 'You have ' + items.length + ' notifications.'
      actions = [{ label: 'Notifications', href: roleDashboardPath(role) + '/notifications' }]
    } else if (intent === 'guide_earnings') {
      const res = await apiCall(request, '/api/guide/earnings')
      const summary = res.body?.summary
      reply = summary ? 'Your earnings this month: PKR ' + summary.thisMonthEarnings : 'Could not load earnings.'
      actions = [{ label: 'Earnings', href: '/dashboard/guide/earnings' }]
    } else if (intent === 'company_revenue') {
      const res = await apiCall(request, '/api/company/revenue')
      const summary = res.body?.summary
      reply = summary ? 'Company revenue: PKR ' + summary.totalRevenue : 'Could not load revenue.'
      actions = [{ label: 'Revenue', href: '/dashboard/company/revenue' }]
    } else if (intent === 'team_summary') {
      const res = await apiCall(request, '/api/team')
      const members = res.body?.teamMembers || []
      reply = 'Team has ' + members.length + ' members.'
      actions = [{ label: 'Team', href: '/dashboard/company/team' }]
    } else if (intent === 'admin_analytics') {
      const res = await apiCall(request, '/api/admin/analytics')
      const overview = res.body?.overview
      reply = overview ? 'Platform: ' + overview.totalUsers + ' users, ' + overview.totalBookings + ' bookings' : 'Could not load data.'
      actions = [{ label: 'Analytics', href: '/dashboard/admin/analytics' }]
    } else if (intent === 'admin_users') {
      const res = await apiCall(request, '/api/admin/users')
      const users = res.body?.users || []
      reply = 'Platform has ' + users.length + ' users.'
      actions = [{ label: 'Users', href: '/dashboard/admin/users' }]
    } else {
      reply = 'I can help with destinations, guides, bookings, or travel advice. What would you like?'
      actions = [{ label: 'Dashboard', href: roleDashboardPath(role) }]
    }
    
    session.history.push({ role: 'assistant', content: reply })
    session.history = trimHistory(session.history)
    saveChatSession(session)
    
    const response: ChatResponsePayload = { sessionId: session.sessionId, role, intent, reply, cards, actions }
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { sessionId: randomUUID(), intent: 'unknown', reply: 'Something went wrong. Please try again.' } satisfies ChatResponsePayload,
      { status: 500 },
    )
  }
}
