"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GuideBadgesShowcase } from "@/components/badges/badge-display"
import type { GuideBadge, BadgeCategory } from "@/lib/db/models/badge"

interface GuideProfileBadgesProps {
  guideId: string
  compact?: boolean
}

/**
 * Guide Profile Badges Section
 * Displays badges earned by the guide
 */
export function GuideProfileBadges({ guideId, compact = false }: GuideProfileBadgesProps) {
  const [badges, setBadges] = useState<GuideBadge[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>("milestones")

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch(`/api/guides/${guideId}/badges`)
        if (!res.ok) throw new Error("Failed to fetch badges")

        const data = await res.json()
        setBadges(data.data.badges || [])
        setSummary(data.data.summary)
      } catch (error) {
        console.error("Error fetching badges:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBadges()
  }, [guideId])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Loading badges...
        </CardContent>
      </Card>
    )
  }

  if (!badges || badges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Achievements</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          No badges earned yet. Complete trips to earn badges!
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return <GuideBadgesShowcase guideId={guideId} limit={6} isCompact={true} />
  }

  const categories = Object.keys(summary.badgesByCategory) as BadgeCategory[]
  const categoryBadges = badges.filter((b) => b.badgeCategory === selectedCategory)

  const categoryIcons: Record<BadgeCategory, string> = {
    milestones: "🎯",
    ratings: "⭐",
    specialization: "🏔️",
    reliability: "⚡",
    community: "❤️",
    seasonal: "🌍",
    premium: "👑",
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Achievements & Badges</CardTitle>
            <CardDescription>
              {badges.length} badges earned • {summary.totalPoints} total points
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{badges.length}</p>
            <p className="text-sm text-muted-foreground">Badges</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs sm:text-sm">
                <span className="hidden sm:inline">{categoryIcons[category]}</span>
                <span className="sm:hidden">{categoryIcons[category]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => {
            const categoryBadges = badges.filter((b) => b.badgeCategory === category)
            return (
              <TabsContent key={category} value={category} className="mt-6">
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-4">
                  {categoryBadges.map((badge) => (
                    <div key={badge._id?.toString()} className="group cursor-pointer">
                      <div
                        className="flex items-center justify-center rounded-lg p-4 mb-2 transition-transform hover:scale-110"
                        style={{ backgroundColor: badge.badgeColor + "15", border: `2px solid ${badge.badgeColor}` }}
                      >
                        <span className="text-3xl sm:text-4xl">{badge.badgeIcon}</span>
                      </div>
                      <div className="text-center">
                        <p className="text-xs sm:text-sm font-semibold line-clamp-2">
                          {badge.badgeName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {badge.points} pts
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {badge.badgeRarity}
                        </Badge>
                      </div>

                      {/* Hover Details */}
                      <div className="hidden group-hover:block absolute z-10 bg-popover border rounded-lg p-2 text-xs shadow-lg">
                        <p className="font-semibold">{badge.badgeName}</p>
                        <p className="text-muted-foreground">{badge.badgeDescription}</p>
                        <p className="text-xs mt-1">
                          Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>

        {/* Stats Summary */}
        <div className="mt-8 pt-6 border-t">
          <p className="text-sm font-semibold mb-3">Stats by Category</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            {categories.map((category) => {
              const count = summary.badgesByCategory[category] || 0
              return (
                <div
                  key={category}
                  className="p-3 rounded-lg bg-muted/50 text-center"
                >
                  <p className="text-xl mb-1">{categoryIcons[category]}</p>
                  <p className="text-sm font-semibold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{category}</p>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface BadgeProgressTrackerProps {
  guideId: string
}

/**
 * Badge Progress Tracker
 * Shows progress towards next badges
 */
export function BadgeProgressTracker({ guideId }: BadgeProgressTrackerProps) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch from a combined endpoint or calculate from badges + bookings
        const res = await fetch(`/api/guides/${guideId}/badges`)
        if (res.ok) {
          const data = await res.json()
          setStats(data.data.summary)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [guideId])

  if (loading || !stats) return null

  const milestones = [
    { trips: 5, name: "Rising Guide" },
    { trips: 10, name: "Seasoned Guide" },
    { trips: 25, name: "Master Guide" },
    { trips: 50, name: "Legend Guide" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Progress to Next Milestone</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestones.map((milestone) => {
          const currentTrips = stats.totalBadges || 0 // This would come from actual trip count
          const progress = Math.min((currentTrips / milestone.trips) * 100, 100)

          return (
            <div key={milestone.trips}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{milestone.name}</span>
                <span className="text-xs text-muted-foreground">
                  {Math.min(currentTrips, milestone.trips)}/{milestone.trips}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
