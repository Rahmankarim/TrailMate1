"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge as BadgeUI } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { GuideBadge } from "@/lib/db/models/badge"

interface BadgeDisplayProps {
  badge: GuideBadge
  size?: "sm" | "md" | "lg"
  showDetails?: boolean
}

/**
 * Individual Badge Display Component
 */
export function BadgeDisplay({ badge, size = "md", showDetails = false }: BadgeDisplayProps) {
  const sizeClasses = {
    sm: "h-12 w-12 text-lg",
    md: "h-16 w-16 text-2xl",
    lg: "h-24 w-24 text-4xl",
  }

  const rarityBorders: Record<string, string> = {
    common: "border-2 border-gray-400",
    rare: "border-2 border-blue-400",
    epic: "border-2 border-purple-400",
    legendary: "border-2 border-yellow-400",
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-full ${sizeClasses[size]} ${rarityBorders[badge.badgeRarity]}`}
      style={{ backgroundColor: badge.badgeColor + "20" }}
      title={badge.badgeName}
    >
      <span className={sizeClasses[size]}>{badge.badgeIcon}</span>

      {showDetails && size !== "sm" && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap">
          <div className="bg-black text-white text-xs rounded px-2 py-1">
            <p className="font-semibold">{badge.badgeName}</p>
            <p className="text-gray-300">{badge.points} points</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface GuideBadgesShowcaseProps {
  guideId: string
  limit?: number
  isCompact?: boolean
}

/**
 * Guide Badges Showcase Component (displays on profile)
 */
export function GuideBadgesShowcase({
  guideId,
  limit = 10,
  isCompact = false,
}: GuideBadgesShowcaseProps) {
  const [badges, setBadges] = useState<GuideBadge[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch(`/api/guides/${guideId}/badges`)
        if (!res.ok) throw new Error("Failed to fetch badges")

        const data = await res.json()
        setBadges(data.data.badges || [])
        setSummary(data.data.summary)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading badges")
      } finally {
        setLoading(false)
      }
    }

    fetchBadges()
  }, [guideId])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-8">
            <div className="text-sm text-muted-foreground">Loading badges...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !summary) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">No badges yet</div>
        </CardContent>
      </Card>
    )
  }

  if (isCompact) {
    // Compact view - show only icons
    const displayBadges = badges.slice(0, 5)
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-2 flex-wrap">
          {displayBadges.map((badge) => (
            <BadgeDisplay key={badge._id?.toString()} badge={badge} size="sm" />
          ))}
        </div>
        {badges.length > 5 && (
          <span className="text-xs text-muted-foreground font-medium">
            +{badges.length - 5} more
          </span>
        )}
      </div>
    )
  }

  // Full view
  const displayBadges = badges.slice(0, limit)
  const totalRarity: Record<string, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  }

  badges.forEach((badge) => {
    totalRarity[badge.badgeRarity]++
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Badges & Achievements</span>
          <BadgeUI variant="secondary">
            {summary.totalBadges} badges • {summary.totalPoints} points
          </BadgeUI>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <div>
            <p className="font-semibold">{totalRarity.legendary}</p>
            <p className="text-xs text-muted-foreground">Legendary</p>
          </div>
          <div>
            <p className="font-semibold">{totalRarity.epic}</p>
            <p className="text-xs text-muted-foreground">Epic</p>
          </div>
          <div>
            <p className="font-semibold">{totalRarity.rare}</p>
            <p className="text-xs text-muted-foreground">Rare</p>
          </div>
          <div>
            <p className="font-semibold">{totalRarity.common}</p>
            <p className="text-xs text-muted-foreground">Common</p>
          </div>
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-5 gap-4">
          {displayBadges.map((badge) => (
            <div key={badge._id?.toString()} className="flex flex-col items-center gap-2">
              <BadgeDisplay badge={badge} size="lg" />
              <div className="text-center text-xs">
                <p className="font-semibold leading-tight">{badge.badgeName}</p>
                <p className="text-muted-foreground">{badge.points} pts</p>
              </div>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        {summary.badgesByCategory && Object.keys(summary.badgesByCategory).length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-semibold mb-3">By Category:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(summary.badgesByCategory).map(([category, count]) => (
                <div key={category} className="flex justify-between">
                  <span className="capitalize text-muted-foreground">{category}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {badges.length > limit && (
          <Button variant="outline" className="w-full">
            View All {badges.length} Badges
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface BadgeLeaderboardProps {
  category?: string
  limit?: number
}

/**
 * Badge Leaderboard Component
 */
export function BadgeLeaderboard({ category, limit = 10 }: BadgeLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const params = new URLSearchParams()
        if (category) params.append("category", category)
        if (limit) params.append("limit", limit.toString())

        const res = await fetch(`/api/badges/leaderboard?${params}`)
        if (!res.ok) throw new Error("Failed to fetch leaderboard")

        const data = await res.json()
        setLeaderboard(data.data.leaderboard || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading leaderboard")
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [category, limit])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-8">
            <div className="text-sm text-muted-foreground">Loading leaderboard...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">No leaderboard data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Badge Leaderboard {category && `- ${category}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div
              key={entry.guideId}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0">
                  <span className="text-lg font-bold">{entry.rank}</span>
                </div>

                {entry.guideImage && (
                  <img
                    src={entry.guideImage}
                    alt={entry.guideName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{entry.guideName}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.totalBadges} badges
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <p className="font-bold text-lg">{entry.totalPoints}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
                {entry.badgesPreview && entry.badgesPreview.length > 0 && (
                  <div className="flex gap-1">
                    {entry.badgesPreview.slice(0, 3).map((badge: any) => (
                      <span key={badge.badgeId} title={badge.badgeName}>
                        {badge.badgeIcon}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Badge Notification (shows when badge is earned)
 */
interface BadgeNotificationProps {
  badge: GuideBadge
  onDismiss?: () => void
}

export function BadgeNotification({ badge, onDismiss }: BadgeNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss?.()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className="fixed bottom-5 right-5 rounded-lg p-4 shadow-lg bg-white border-2 animate-in fade-in slide-in-from-bottom-5"
      style={{ borderColor: badge.badgeColor }}
    >
      <div className="flex items-center gap-3">
        <div className="text-4xl">{badge.badgeIcon}</div>
        <div>
          <p className="font-bold">🎉 Badge Unlocked!</p>
          <p className="text-sm font-semibold">{badge.badgeName}</p>
          <p className="text-xs text-muted-foreground">{badge.badgeDescription}</p>
          <p className="text-xs font-medium mt-1">+{badge.points} points</p>
        </div>
        <button
          onClick={onDismiss}
          className="ml-2 text-xl leading-none opacity-50 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  )
}
