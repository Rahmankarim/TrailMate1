"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MessageCircle, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ChatAction = {
  label: string
  href?: string
  prompt?: string
}

type ChatCard = {
  type: "summary" | "booking" | "analytics" | "profile" | "payment"
  title: string
  items: Array<{ label: string; value: string }>
}

type ChatApiResponse = {
  sessionId: string
  role?: "traveler" | "guide" | "company" | "admin"
  intent: string
  reply: string
  cards?: ChatCard[]
  actions?: ChatAction[]
  followUp?: string[]
}

type UiMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  cards?: ChatCard[]
  actions?: ChatAction[]
  followUp?: string[]
}

const INITIAL_BOT_MESSAGE: UiMessage = {
  id: "init",
  role: "assistant",
  text: "Hi, I am your TrailMate AI assistant. I can chat normally too. Ask me anything, or use me for bookings, guides, JazzCash payments, messages, notifications, and dashboards.",
}

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function TrailMateChatbot() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<UiMessage[]>([INITIAL_BOT_MESSAGE])
  const [isSending, setIsSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open, isSending])

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending])

  async function sendMessage(rawText: string) {
    const text = rawText.trim()
    if (!text || isSending) return

    const userMessage: UiMessage = {
      id: nextId(),
      role: "user",
      text,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsSending(true)

    try {
      // Customize this endpoint if you route chatbot traffic through a separate AI gateway.
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      })

      const data = (await response.json()) as ChatApiResponse
      setSessionId(data.sessionId)

      if (data.intent === "page_navigate" && data.actions?.[0]?.href) {
        router.push(data.actions[0].href)
      }

      const botMessage: UiMessage = {
        id: nextId(),
        role: "assistant",
        text: data.reply || "I could not process that. Please try again.",
        cards: data.cards || [],
        actions: data.actions || [],
        followUp: data.followUp || [],
      }

      setMessages((prev) => [...prev, botMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: "Network error. I could not reach the assistant service just now. Please try again in a moment.",
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    void sendMessage(input)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessage(input)
    }
  }

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50">
        <Button
          onClick={() => setOpen((prev) => !prev)}
          size="icon-lg"
          className="h-14 w-14 rounded-full shadow-lg"
          aria-label={open ? "Close chatbot" : "Open chatbot"}
        >
          {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
        </Button>
      </div>

      {open ? (
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-xl border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold">TrailMate Assistant</p>
              <p className="text-xs text-muted-foreground">Professional travel concierge for conversation and trip planning</p>
            </div>
            <Badge variant="secondary">AI</Badge>
          </div>

          <div ref={scrollRef} className="h-80 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((message) => (
              <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[90%] rounded-xl px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>

                  {message.cards && message.cards.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {message.cards.map((card, idx) => (
                        <div key={`${message.id}-card-${idx}`} className="rounded-lg border bg-background/70 p-2 text-foreground">
                          <p className="mb-1 text-xs font-semibold">{card.title}</p>
                          <div className="space-y-1 text-xs">
                            {card.items.map((item, itemIndex) => (
                              <div key={`${message.id}-item-${itemIndex}`} className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">{item.label}</span>
                                <span className="text-right font-medium">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {message.actions && message.actions.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.actions.map((action, actionIndex) => {
                        if (action.href) {
                          return (
                            <Button key={`${message.id}-action-${actionIndex}`} size="sm" variant="outline" asChild>
                              <Link href={action.href}>{action.label}</Link>
                            </Button>
                          )
                        }

                        return (
                          <Button
                            key={`${message.id}-action-${actionIndex}`}
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              if (action.prompt) {
                                void sendMessage(action.prompt)
                              }
                            }}
                          >
                            {action.label}
                          </Button>
                        )
                      })}
                    </div>
                  ) : null}

                  {message.followUp && message.followUp.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {message.followUp.map((item, idx) => (
                        <li key={`${message.id}-followup-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            ))}

            {isSending ? (
              <div className="flex justify-start">
                <div className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">Thinking...</div>
              </div>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="border-t p-3">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about bookings, payments, or analytics..."
                disabled={isSending}
              />
              <Button type="submit" size="icon" disabled={!canSend}>
                <Send className="size-4" />
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}
