'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Trophy, Star, TrendingUp, Award } from 'lucide-react'

interface GuideBadge {
  _id: string
  badgeId: string
  badgeName: string
  badgeDescription: string
  badgeIcon: string
  badgeCategory: string
  badgeRarity: string
  badgeColor: string
  earnedAt: string
  unlockedReason: string
  points: number
}

interface GuideSummary {
  totalBadges: number
  totalPoints: number
  badgesByCategory: {
    milestones?: number
    ratings?: number
    community?: number
    reliability?: number
    specialization?: number
    seasonal?: number
    premium?: number
  }
  leaderboardRank?: number
  recentBadges: GuideBadge[]
  progressBadges: Array<{
    badgeName: string
    current: number
    required: number
    percentage: number
  }>
}

interface LeaderboardEntry {
  rank: number
  guideId: string
  guideName: string
  totalBadges: number
  totalPoints: number
  avgRating?: number
}

const BADGE_COLORS: Record<string, string> = {
  common: '#6B7280',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#FBBF24',
}

const CATEGORY_ICONS: Record<string, string> = {
  milestones: '🎯',
  ratings: '⭐',
  community: '💬',
  reliability: '⚡',
  specialization: '🏔️',
  seasonal: '🌸',
  premium: '💎',
}

export default function GamificationPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<GuideSummary | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Fetch guide badges and summary
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [badgesRes, leaderboardRes] = await Promise.all([
          fetch('/api/badges'),
          fetch('/api/badges/leaderboard?limit=10'),
        ])

        if (!badgesRes.ok || !leaderboardRes.ok) {
          throw new Error('Failed to fetch gamification data')
        }

        const badgesData = await badgesRes.json()
        const leaderboardData = await leaderboardRes.json()

        if (badgesData.data) {
          setSummary(badgesData.data)
        }

        if (leaderboardData.data?.leaderboard) {
          setLeaderboard(leaderboardData.data.leaderboard)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Failed to load gamification data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5" />
              Error Loading Gamification Data
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-800">{error}</CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>No Gamification Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Complete your first trip to start earning badges!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const categoryData = Object.entries(summary.badgesByCategory).map(
    ([category, count]) => ({
      name: category,
      value: count || 0,
      icon: CATEGORY_ICONS[category],
    })
  )

  const filteredBadges = 
    selectedCategory === 'all'
      ? summary.recentBadges
      : summary.recentBadges.filter(
          (b) => b.badgeCategory === selectedCategory
        )

  const userRank = leaderboard.find(
    (entry) => entry.guideId === session.user?.id
  )?.rank || 'Unranked'

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Gamification & Badges</h1>
        <p className="text-gray-600">
          Track your achievements and compete on the leaderboard
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Award className="w-5 h-5" />
              Total Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-900">
              {summary.totalBadges}
            </p>
            <p className="text-sm text-blue-700 mt-2">
              Achievement unlocked
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <TrendingUp className="w-5 h-5" />
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-900">
              {summary.totalPoints}
            </p>
            <p className="text-sm text-purple-700 mt-2">Badge points earned</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <Trophy className="w-5 h-5" />
              Leaderboard Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-yellow-900">
              {typeof userRank === 'number' ? `#${userRank}` : userRank}
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Compete with other guides
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Badges</CardTitle>
              <CardDescription>
                All badges you&apos;ve earned organized by category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All ({summary.totalBadges})
                </Button>
                {categoryData.map((cat) => (
                  <Button
                    key={cat.name}
                    variant={
                      selectedCategory === cat.name ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(cat.name)}
                  >
                    {cat.icon} {cat.name} ({cat.value})
                  </Button>
                ))}
              </div>

              {/* Badge Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                {filteredBadges.length > 0 ? (
                  filteredBadges.map((badge) => (
                    <div
                      key={badge._id}
                      className={`p-4 rounded-lg border-2 text-center hover:shadow-lg transition-shadow cursor-pointer`}
                      style={{
                        backgroundColor: `${BADGE_COLORS[badge.badgeRarity]}20`,
                        borderColor: BADGE_COLORS[badge.badgeRarity],
                      }}
                      title={badge.badgeDescription}
                    >
                      <div className="text-4xl mb-2">{badge.badgeIcon}</div>
                      <h3 className="font-semibold text-sm mb-1">
                        {badge.badgeName}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: BADGE_COLORS[badge.badgeRarity],
                          color: 'white',
                        }}
                      >
                        {badge.badgeRarity}
                      </Badge>
                      <p className="text-xs text-gray-600 mt-2">
                        +{badge.points} pts
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(badge.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No badges in this category yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress Towards Next Badges</CardTitle>
              <CardDescription>
                Complete trips to unlock new achievements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {summary.progressBadges && summary.progressBadges.length > 0 ? (
                summary.progressBadges.map((progress, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{progress.badgeName}</h3>
                      <span className="text-sm text-gray-600">
                        {progress.current} / {progress.required}
                      </span>
                    </div>
                    <Progress
                      value={progress.percentage}
                      className="h-2"
                    />
                    <p className="text-xs text-gray-500">
                      {progress.percentage}% complete
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Complete all badges or check back later for new challenges
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Badge Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Badge Distribution by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.filter((c) => c.value > 0).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData.filter((c) => c.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-72 flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Badges by Rarity Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Badges by Rarity</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.recentBadges.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          name: 'Common',
                          count: summary.recentBadges.filter(
                            (b) => b.badgeRarity === 'common'
                          ).length,
                        },
                        {
                          name: 'Rare',
                          count: summary.recentBadges.filter(
                            (b) => b.badgeRarity === 'rare'
                          ).length,
                        },
                        {
                          name: 'Epic',
                          count: summary.recentBadges.filter(
                            (b) => b.badgeRarity === 'epic'
                          ).length,
                        },
                        {
                          name: 'Legendary',
                          count: summary.recentBadges.filter(
                            (b) => b.badgeRarity === 'legendary'
                          ).length,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-72 flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>Your 5 most recent badges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.recentBadges.slice(0, 5).map((badge) => (
                  <div
                    key={badge._id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="text-3xl">{badge.badgeIcon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{badge.badgeName}</h4>
                      <p className="text-sm text-gray-600">
                        {badge.badgeDescription}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Earned{' '}
                        {new Date(badge.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">+{badge.points} pts</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top 10 Guides by Badges
              </CardTitle>
              <CardDescription>
                See how you compare to other guides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry) => (
                    <div
                      key={entry.guideId}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        entry.guideId === session.user?.id
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold w-10 text-center">
                          {entry.rank === 1 && '🥇'}
                          {entry.rank === 2 && '🥈'}
                          {entry.rank === 3 && '🥉'}
                          {entry.rank > 3 && `#${entry.rank}`}
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {entry.guideName}
                            {entry.guideId === session.user?.id && (
                              <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                                You
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">
                            ⭐ {entry.avgRating?.toFixed(1) || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {entry.totalBadges} Badges
                        </p>
                        <p className="text-sm text-gray-600">
                          {entry.totalPoints} points
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No leaderboard data available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Star className="w-5 h-5" />
            Tips to Earn More Badges
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-900">
          <ul className="space-y-2 text-sm">
            <li>✅ Complete more trips - Earn milestone badges</li>
            <li>✅ Maintain high ratings - Unlock rating badges</li>
            <li>✅ Specialize in activities - Get specialty badges</li>
            <li>✅ Respond quickly - Earn reliability badges</li>
            <li>✅ Encourage reviews - Unlock community badges</li>
            <li>✅ Earn more revenue - Premium badges available</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
