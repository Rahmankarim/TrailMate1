import type { ChatSessionState, TrailMateRole } from "@/lib/chat/types"

const SESSION_TTL_MS = 1000 * 60 * 30
const MAX_SESSIONS = 1000

const sessions = new Map<string, ChatSessionState>()

function makeKey(userId: string, sessionId: string) {
  return `${userId}:${sessionId}`
}

function cleanupExpiredSessions() {
  const now = Date.now()
  for (const [key, session] of sessions.entries()) {
    if (now - session.updatedAt > SESSION_TTL_MS) {
      sessions.delete(key)
    }
  }

  if (sessions.size <= MAX_SESSIONS) {
    return
  }

  const sorted = [...sessions.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt)
  const toRemove = sessions.size - MAX_SESSIONS
  for (let i = 0; i < toRemove; i += 1) {
    sessions.delete(sorted[i][0])
  }
}

export function getOrCreateChatSession(userId: string, role: TrailMateRole, sessionId: string): ChatSessionState {
  cleanupExpiredSessions()

  const key = makeKey(userId, sessionId)
  const existing = sessions.get(key)
  if (existing) {
    existing.updatedAt = Date.now()
    return existing
  }

  const created: ChatSessionState = {
    sessionId,
    userId,
    role,
    history: [],
    updatedAt: Date.now(),
  }
  sessions.set(key, created)
  return created
}

export function saveChatSession(session: ChatSessionState) {
  cleanupExpiredSessions()
  const key = makeKey(session.userId, session.sessionId)
  session.updatedAt = Date.now()
  sessions.set(key, session)
}
