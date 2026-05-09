# Gamification System - Integration Guide for Developers

## 🔧 Complete Integration Reference

This guide shows how to integrate the gamification system into different parts of the TrailMate application.

---

## 📦 Core Files

### 1. Badge Data Model

**File:** `lib/db/models/badge.ts`

Defines all badge types, interfaces, and constants.

**Key Exports:**

```typescript
// Badge interface
interface GuideBadge {
  _id?: ObjectId
  guideId: ObjectId
  badgeId: string
  badgeName: string
  badgeDescription: string
  badgeCategory: BadgeCategory
  badgeRarity: BadgeRarity
  badgeIcon: string
  badgeColor: string
  earnedAt: Date
  unlockedReason: string
  bookingId?: ObjectId
  points: number
}

// All badge definitions
const BADGE_DEFINITIONS = {
  'first_step': { name: 'First Step', ... },
  'rising_guide': { name: 'Rising Guide', ... },
  // ... 25+ total badges
}

// Enums
type BadgeCategory = 'milestones' | 'ratings' | 'community' | 'reliability' | 'specialization' | 'seasonal' | 'premium'
type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'
```

---

### 2. Badge Business Logic

**File:** `lib/utils/badge-system.ts`

Core functions for badge calculation and awarding.

#### Main Functions

**`checkBadgeEligibility(db, guideId): Promise<Badge[]>`**

```typescript
// Returns array of badges the guide is now eligible for
const eligibleBadges = await checkBadgeEligibility(db, guideId);
// Returns: [{ id: 'master_guide', name: 'Master Guide', ... }, ...]
```

**`awardBadges(db, guideId, bookingId): Promise<{ newBadges: Badge[], message: string }>`**

```typescript
// Main entry point - awards all new badges and returns summary
const result = await awardBadges(db, guideId, bookingId)

// Result structure:
{
  newBadges: [
    {
      _id: '...',
      badgeId: 'master_guide',
      badgeName: 'Master Guide',
      points: 100,
      earnedAt: Date.now(),
      // ... full badge data
    }
  ],
  message: "Congratulations! You earned 2 new badges: Master Guide (+100 pts), Perfect Guide (+150 pts)"
}
```

**`calculateBadgeProgress(db, guideId): Promise<BadgeProgress[]>`**

```typescript
// Shows progress towards unreleased badges
const progress = await calculateBadgeProgress(db, guideId)[
  // Returns:
  {
    badgeName: "Master Guide",
    current: 24,
    required: 25,
    percentage: 96,
  }
];
```

**`logBadgeAchievement(db, guideId, badgeId, bookingId): Promise<void>`**

```typescript
// Records achievement in audit log for analytics
await logBadgeAchievement(db, guideId, "master_guide", bookingId);
```

---

### 3. Badge API Endpoints

#### Endpoint 1: Get Guide Badges

**File:** `app/api/guides/[id]/badges/route.ts`

```bash
GET /api/guides/{guideId}/badges

Query Parameters:
- sortBy: 'earned' | 'category' | 'name' (default: earned)
- category: 'milestones' | 'ratings' | ... (optional filter)

Response:
{
  "success": true,
  "data": {
    "guideName": "Ali Khan",
    "totalBadges": 8,
    "totalPoints": 325,
    "badges": [
      {
        "_id": "...",
        "badgeId": "master_guide",
        "badgeName": "Master Guide",
        "badgeDescription": "Complete 25 trips with excellence",
        "badgeIcon": "🏆",
        "badgeCategory": "milestones",
        "badgeRarity": "epic",
        "earnedAt": "2024-01-15T10:30:00Z",
        "points": 100
      }
    ],
    "summary": {
      "totalBadges": 8,
      "totalPoints": 325,
      "badgesByCategory": {
        "milestones": 3,
        "ratings": 2,
        "community": 1,
        "reliability": 1,
        "specialization": 1
      }
    }
  }
}
```

#### Endpoint 2: Badge Leaderboard

**File:** `app/api/badges/leaderboard/route.ts`

```bash
GET /api/badges/leaderboard

Query Parameters:
- limit: number (default: 10, max: 50)
- category: string (optional, filter by badge category)
- offset: number (default: 0, for pagination)

Response:
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "guideId": "...",
        "guideName": "Ali Khan",
        "totalBadges": 18,
        "totalPoints": 850,
        "avgRating": 4.8,
        "badgesPreview": ["🏆", "👑", "💎", "✨", ...]
      },
      {
        "rank": 2,
        "guideId": "...",
        "guideName": "Sarah Ahmed",
        "totalBadges": 16,
        "totalPoints": 750,
        "avgRating": 4.7,
        "badgesPreview": ["🏆", "👑", "✨", "⭐", ...]
      }
    ],
    "pagination": {
      "total": 250,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

## 🔗 Integration Points

### Integration 1: Booking Completion

**File:** `app/api/bookings/[id]/route.ts`

When a booking is marked as "completed", badges are automatically awarded.

**Location in code:**

```typescript
// app/api/bookings/[id]/route.ts - PUT handler

if (body.status === "completed" && booking.guideId) {
  // NEW: Award badges on completion
  const badgesSystem = require("@/lib/utils/badge-system");
  const badgeResult = await badgesSystem.awardBadges(db, booking.guideId, id);

  // Return badges in response
  return res.json({
    success: true,
    data: {
      booking: updatedBooking,
      badgesAwarded: badgeResult.newBadges,
      badgeMessage: badgeResult.message,
    },
  });
}
```

**Response includes:**

- `badgesAwarded`: Array of new badges
- `badgeMessage`: User-friendly message
- `booking`: Updated booking data

---

### Integration 2: Guide Profile Page

**File:** `components/guides/guide-profile-badges.tsx`

Display guide's badges on their profile.

**Usage:**

```typescript
import { GuideProfileBadges } from '@/components/guides/guide-profile-badges'

export default function GuidePage({ params }) {
  return (
    <div>
      {/* Other profile content */}
      <GuideProfileBadges guideId={params.id} />
    </div>
  )
}
```

**Component Features:**

- Displays all earned badges
- Shows badge statistics
- Recent achievements section
- Badge streak tracking
- Progress bars for upcoming badges

---

### Integration 3: Guide Dashboard

**File:** `app/dashboard/guide/gamification/page.tsx`

Complete gamification dashboard for guides.

**Route:** `/dashboard/guide/gamification`

**Features:**

- Badge overview cards (total, points, rank)
- Tabs: Badges, Progress, Analytics, Leaderboard
- Filter by category
- Charts and visualizations
- Recent achievements
- Leaderboard positioning

---

### Integration 4: Guide Card (Search Results)

**Recommended Integration:** `components/guides/guide-card.tsx`

Show top 3 badges on guide cards in search results.

**Example Implementation:**

```typescript
import { BadgeDisplay } from '@/components/badges/badge-display'

export function GuideCard({ guide }) {
  const topBadges = guide.badges?.slice(0, 3) || []

  return (
    <div className="guide-card">
      <h3>{guide.name}</h3>
      <p>⭐ {guide.rating}</p>

      {/* NEW: Badge showcase */}
      <div className="flex gap-2 mt-2">
        {topBadges.map(badge => (
          <BadgeDisplay
            key={badge._id}
            badge={badge}
            size="sm"
          />
        ))}
      </div>
    </div>
  )
}
```

---

### Integration 5: Booking Confirmation

**Recommended Integration:** `app/api/bookings/[id]/route.ts` response

Show badge notification to guide after trip completion.

**Example Implementation:**

```typescript
// After completing booking
const badgeResult = await awardBadges(db, guideId, bookingId);

if (badgeResult.newBadges.length > 0) {
  // Send notification to guide
  await notificationService.notify(guideId, {
    type: "badge_earned",
    title: "Badges Earned! 🎉",
    message: badgeResult.message,
    badges: badgeResult.newBadges,
    link: "/dashboard/guide/gamification",
  });
}
```

---

### Integration 6: Admin Dashboard

**Recommended File:** `app/dashboard/admin/gamification/page.tsx`

Monitor badge distribution and guide achievements.

**Recommended Features:**

```typescript
// Admin can see:
- Badge statistics
- Distribution across guides
- Achievement logs
- Leaderboard monitoring
- Badge criteria management
- Adjust badge requirements if needed
```

---

## 🎯 Custom Badge Creation

To add a new badge, follow these steps:

### Step 1: Add to BADGE_DEFINITIONS

**File:** `lib/db/models/badge.ts`

```typescript
const BADGE_DEFINITIONS = {
  // ... existing badges

  // NEW BADGE
  your_badge_id: {
    id: "your_badge_id",
    name: "Badge Name",
    description: "Badge description",
    icon: "🎯",
    category: "milestones",
    rarity: "rare",
    color: "#8B5CF6",
    criteria: {
      type: "trips", // or 'rating', 'reviews', etc.
      operator: ">=",
      value: 20,
    },
    points: 60,
    relatedStats: ["trips_completed"],
  },
};
```

### Step 2: Add Check Function

**File:** `lib/utils/badge-system.ts`

```typescript
async function checkYourBadge(db, guide) {
  // Add custom logic
  const tripCount = await db.collection("bookings").countDocuments({
    guideId: guide._id,
    status: "completed",
  });

  if (tripCount >= 20) {
    return true; // Eligible
  }
  return false;
}
```

### Step 3: Add to Eligibility Check

**File:** `lib/utils/badge-system.ts`

In `checkBadgeEligibility()`:

```typescript
// Add your check
if (await checkYourBadge(db, guide)) {
  eligible.push("your_badge_id");
}
```

### Step 4: Test

```bash
# Complete trips until requirement met
# Mark booking as completed
# Verify badge appears in /api/guides/{id}/badges
```

---

## 🚀 Advanced Patterns

### Pattern 1: Conditional Badge Requirements

```typescript
// Badge that requires BOTH conditions
async function checkMultipleConditions(db, guide) {
  const trips = await getCompletedTrips(db, guide._id);
  const rating = guide.rating;

  // Requires 10+ trips AND 4.5+ rating
  return trips.length >= 10 && rating >= 4.5;
}
```

### Pattern 2: Time-Based Badges

```typescript
// Badge earned within specific season
function getSeasonFromDate(date) {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

async function checkSeasonalBadge(db, guide, season) {
  const trips = await db
    .collection("bookings")
    .find({ guideId: guide._id })
    .toArray();

  const seasonTrips = trips.filter(
    (t) => getSeasonFromDate(new Date(t.createdAt)) === season,
  );

  return seasonTrips.length >= 3;
}
```

### Pattern 3: Progressive Badges

```typescript
// Badge with multiple tiers
const PROGRESSIVE_BADGES = {
  trips: [
    { level: 1, required: 5, name: "Rising Guide", points: 25 },
    { level: 2, required: 10, name: "Seasoned Guide", points: 50 },
    { level: 3, required: 25, name: "Master Guide", points: 100 },
    { level: 4, required: 50, name: "Legend Guide", points: 250 },
  ],
};

async function checkProgressiveBadges(db, guide) {
  const trips = await getCompletedTrips(db, guide._id);
  const eligible = [];

  for (const badge of PROGRESSIVE_BADGES.trips) {
    if (trips.length >= badge.required) {
      const existing = await hasEarnedBadge(db, guide._id, badge.name);
      if (!existing) {
        eligible.push(badge.name);
      }
    }
  }

  return eligible;
}
```

---

## 📊 Database Queries

### Query 1: Get Guide's Badge Count by Category

```typescript
const badgeStats = await db
  .collection("guide_badges")
  .aggregate([
    { $match: { guideId: guideId } },
    {
      $group: {
        _id: "$badgeCategory",
        count: { $sum: 1 },
        totalPoints: { $sum: "$points" },
      },
    },
  ])
  .toArray();

// Result:
// [
//   { _id: 'milestones', count: 3, totalPoints: 150 },
//   { _id: 'ratings', count: 2, totalPoints: 90 }
// ]
```

### Query 2: Get Top Guides by Badge Count

```typescript
const topGuides = await db
  .collection("guide_badges")
  .aggregate([
    {
      $group: {
        _id: "$guideId",
        badges: { $sum: 1 },
        totalPoints: { $sum: "$points" },
        lastEarned: { $max: "$earnedAt" },
      },
    },
    { $sort: { badges: -1 } },
    { $limit: 10 },
  ])
  .toArray();
```

### Query 3: Track Badge Earning Velocity

```typescript
const velocity = await db
  .collection("badge_achievements")
  .aggregate([
    {
      $match: {
        guideId: guideId,
        achievedAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    },
    { $count: "badgesInLastMonth" },
  ])
  .toArray();
```

---

## 🔐 Security Considerations

### 1. Badge Awarding

- ✅ Only award on verified trip completion
- ✅ Verify guideId matches booking
- ✅ Check status is truly "completed"
- ✅ Log all badge awards for audit

### 2. API Endpoints

- ✅ Authenticate requests
- ✅ Verify user owns guide profile
- ✅ Rate limit badge queries
- ✅ Validate query parameters

### 3. Data Integrity

- ✅ No manual badge insertion
- ✅ Only system can add badges
- ✅ Immutable achievement logs
- ✅ Regular audits

---

## 🧪 Testing Guide

### Test 1: Badge Award on Trip Completion

```typescript
test("Award badge when guide completes 5th trip", async () => {
  // Create guide
  const guide = await createGuide(db);

  // Complete 4 trips
  for (let i = 0; i < 4; i++) {
    await completeTrip(db, guide._id);
  }

  // Complete 5th trip
  const result = await awardBadges(db, guide._id, bookingId);

  // Verify badge awarded
  expect(result.newBadges.some((b) => b.badgeId === "rising_guide")).toBe(true);
});
```

### Test 2: Badge Not Awarded Twice

```typescript
test("Should not award same badge twice", async () => {
  // Complete 5 trips (gets Rising Guide)
  const result1 = await awardBadges(db, guide._id, bookingId1);
  expect(result1.newBadges.length).toBe(1);

  // Complete another trip (no new badge at 6 trips)
  const result2 = await awardBadges(db, guide._id, bookingId2);
  expect(result2.newBadges.length).toBe(0);
});
```

### Test 3: Leaderboard Ranking

```typescript
test("Leaderboard ranks guides correctly", async () => {
  // Create multiple guides with different badge counts
  const guide1 = await createGuide(db); // 10 badges
  const guide2 = await createGuide(db); // 15 badges

  const leaderboard = await getLeaderboard(db);

  // Verify ranking
  expect(leaderboard[0].guideId).toBe(guide2._id);
  expect(leaderboard[1].guideId).toBe(guide1._id);
});
```

---

## 📈 Performance Optimization

### 1. Query Optimization

```typescript
// Add indexes to MongoDB
db.guide_badges.createIndex({ guideId: 1 });
db.guide_badges.createIndex({ badgeId: 1 });
db.guide_badges.createIndex({ earnedAt: -1 });
db.badge_achievements.createIndex({ guideId: 1, achievedAt: -1 });
```

### 2. Caching Strategy

```typescript
// Cache badge counts for 1 hour
const cache = new Map();

async function getCachedBadges(guideId) {
  const cacheKey = `badges_${guideId}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const badges = await db
    .collection("guide_badges")
    .find({ guideId })
    .toArray();

  cache.set(cacheKey, badges);
  setTimeout(() => cache.delete(cacheKey), 3600000); // 1 hour

  return badges;
}
```

### 3. Batch Processing

```typescript
// Process multiple guides' badges efficiently
async function awardBatchBadges(db, guideIds) {
  const results = await Promise.all(
    guideIds.map((id) => awardBadges(db, id, bookingId)),
  );
  return results;
}
```

---

## 🚨 Error Handling

```typescript
try {
  const result = await awardBadges(db, guideId, bookingId);
  return {
    success: true,
    data: result,
  };
} catch (error) {
  console.error("Badge awarding failed:", error);

  // Still return success for booking to complete
  return {
    success: true,
    data: {
      booking: updatedBooking,
      badgesError: error.message,
    },
  };
}
```

---

## 📝 Deployment Checklist

- [ ] Database collections created (guide_badges, badge_achievements)
- [ ] MongoDB indexes created for performance
- [ ] All badge definitions verified
- [ ] API endpoints tested
- [ ] UI components tested
- [ ] Integration with booking flow verified
- [ ] Error handling validated
- [ ] Performance optimized
- [ ] Security review completed
- [ ] Documentation updated

---

## 🔄 Version History

| Version       | Changes                                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1.0           | Initial 25-badge system with milestone, rating, community, reliability, specialization, seasonal, and premium badges |
| 1.1 (Planned) | Real-time notifications, badge sharing, rewards store                                                                |
| 1.2 (Planned) | Challenge badges, seasonal events, badge tournaments                                                                 |

---

## 📞 Support

For integration questions:

- Review this guide thoroughly
- Check existing code examples
- Run tests to verify behavior
- Contact development team

---

**Last Updated:** January 2024  
**Maintained By:** TrailMate Development Team
