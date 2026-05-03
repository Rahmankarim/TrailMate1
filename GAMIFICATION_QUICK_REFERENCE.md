# TrailMate Guide Dashboard - Gamification Quick Reference

## 📍 Access Gamification Dashboard

Navigate to: **`/dashboard/guide/gamification`**

---

## 🎯 Main Features

### 1. **Stats Overview Cards**

Three key metrics displayed at the top:

#### Total Badges
- Shows your earned badge count
- Increases with each new achievement
- Reset monthly for seasonal badges

#### Total Points  
- Sum of points from all badges
- Common: 10-40 pts
- Rare: 50-75 pts
- Epic: 80-150 pts
- Legendary: 150-250 pts

#### Leaderboard Rank
- Your position among all guides
- Based on badge count and rating
- Updates daily

---

## 📑 Dashboard Tabs

### Tab 1: Badges (Default View)

**Displays:**
- Your earned badges in a grid
- Sorted by category with icon filters
- Each badge shows:
  - Icon (unique emoji)
  - Name
  - Rarity level
  - Points earned
  - Date earned

**Filter Options:**
- All Badges (default)
- 🎯 Milestones (5+, 10, 25 trips, etc.)
- ⭐ Ratings (4.0+, 4.5+, 4.9+ star badges)
- 💬 Community (review-based)
- ⚡ Reliability (response time)
- 🏔️ Specialization (activity type)
- 🌸 Seasonal (time-based)
- 💎 Premium (earnings-based)

**Hover Actions:**
- See full badge description
- View unlock criteria
- Check earning date

---

### Tab 2: Progress

**Shows:**
- Badges you're working towards
- Progress bar for each badge
- Current vs. required milestones
- Percentage complete

**Example:**
```
Master Guide
████████░░ 80/100 trips (80% complete)
```

---

### Tab 3: Analytics

**Charts & Visualizations:**

1. **Badge Distribution Pie Chart**
   - Visual breakdown by category
   - See which areas you excel in

2. **Rarity Bar Chart**
   - Common, Rare, Epic, Legendary count
   - Track achievement tier distribution

3. **Recent Achievements**
   - 5 most recent badges
   - Earning dates
   - Badge descriptions
   - Points breakdown

---

### Tab 4: Leaderboard

**Shows:**
- Top 10 guides by badges
- Rankings (🥇🥈🥉 or #4+)
- Guide name and avatar
- Guide rating
- Total badges & points

**Your Position:**
- Highlighted if in top 10
- Shows "You" indicator
- Displays comparative stats

---

## 🏆 Complete Badge Catalog

### Milestone Badges (Effort-Based)
| Badge | Icon | Requirement | Points | Rarity |
|-------|------|-------------|--------|--------|
| First Step | 🌱 | 1 trip | 10 | Common |
| Rising Guide | 📈 | 5 trips | 25 | Common |
| Seasoned Guide | ⭐ | 10 trips | 50 | Rare |
| Master Guide | 🏆 | 25 trips | 100 | Epic |
| Legend Guide | 👑 | 50 trips | 250 | Legendary |

### Rating Badges (Quality)
| Badge | Icon | Requirement | Points | Rarity |
|-------|------|-------------|--------|--------|
| Well Liked | 🌟 | 4.0+ rating | 30 | Common |
| Excellent Guide | ✨ | 4.5+ rating | 60 | Rare |
| Perfect Guide | 💎 | 4.9+ rating | 150 | Epic |

### Community Badges (Engagement)
| Badge | Icon | Requirement | Points | Rarity |
|-------|------|-------------|--------|--------|
| Reviewer Magnet | 💬 | 10+ reviews | 35 | Common |
| Community Favorite | ❤️ | 25+ reviews | 75 | Rare |

### Reliability Badges (Service)
| Badge | Icon | Requirement | Points | Rarity |
|-------|------|-------------|--------|--------|
| Quick Replier | ⚡ | <1 hr avg response | 25 | Common |
| Always Available | 🚀 | <30 min avg response | 50 | Rare |

### Specialization Badges (Activity Type)
| Badge | Icon | Requirement | Points | Rarity |
|-------|------|-------------|--------|--------|
| Trekking Expert | ⛰️ | 10 trekking trips | 75 | Rare |
| Mountain Master | 🏔️ | 10 mountaineering | 150 | Epic |
| Photography Master | 📸 | 5 photo tours | 75 | Rare |
| Culture Guide | 🎭 | 5 cultural tours | 60 | Rare |

### Seasonal Badges (Time-Based)
| Badge | Icon | Requirement | Points | Rarity |
|-------|------|-------------|--------|--------|
| Spring Guide | 🌸 | 3 spring trips | 30 | Common |
| Summer Warrior | ☀️ | 5 summer trips | 40 | Common |
| Autumn Adventurer | 🍂 | 3 autumn trips | 35 | Common |
| Winter Warrior | ❄️ | 3 winter trips | 80 | Rare |

### Premium Badges (Revenue-Based)
| Badge | Icon | Requirement | Points | Rarity |
|-------|------|-------------|--------|--------|
| Earning Start | 💰 | PKR 50,000 earned | 50 | Rare |
| Big Earner | 💵 | PKR 250,000 earned | 100 | Epic |

---

## 💡 How to Earn Badges

### Step-by-Step Guide

**1. Complete a Trip**
```
Create Booking → Guest Completes Trip → Mark as Completed
```

**2. System Checks Eligibility**
```
✓ Trip count
✓ Average rating  
✓ Review count
✓ Response time
✓ Specialization
✓ Earnings
✓ Season
```

**3. New Badges Awarded**
```
Response: { 
  newBadges: [...],
  badgeMessage: "Congratulations! You earned 2 new badges"
}
```

**4. Badge Added to Profile**
```
Your badge collection updated
Points added to total
Leaderboard rank recalculated
```

---

## ⚡ Quick Actions

### See Your Rank
1. Go to **Gamification Dashboard**
2. Check **Leaderboard Rank** card (top right)
3. Click **Leaderboard** tab to see top 10

### Track Progress
1. Click **Progress** tab
2. See % complete for upcoming badges
3. Example: "80% towards Master Guide"

### View Achievements
1. Click **Analytics** tab
2. See recent badges with dates
3. View badge distribution charts

### Compare with Others
1. Click **Leaderboard** tab
2. See top 10 guides
3. Check your comparative stats

---

## 📊 Understanding Rarity Levels

```
🟦 COMMON        - Basic achievements        (10-40 pts)
🟪 RARE          - Significant milestones    (50-75 pts)
🟫 EPIC          - Major accomplishments     (80-150 pts)
🟨 LEGENDARY      - Extraordinary feats      (150-250 pts)
```

---

## 🎓 Strategies to Earn More Badges

### Strategy 1: Complete More Trips
- **Target:** Milestone badges
- **Path:** 1 → 5 → 10 → 25 → 50 trips
- **Benefit:** Visibility boost, guest confidence

### Strategy 2: Maintain Quality
- **Target:** Rating badges
- **Path:** 4.0 → 4.5 → 4.9+ rating
- **Benefit:** Higher position in search results
- **Tip:** Respond well to feedback, ensure quality

### Strategy 3: Build Community
- **Target:** Community badges
- **Path:** 10 → 25+ positive reviews
- **Benefit:** Social proof, booking increase
- **Tip:** Ask satisfied guests to leave reviews

### Strategy 4: Specialize
- **Target:** Specialization badges
- **Path:** Focus on 1-2 activity types
- **Benefit:** Recognized expert, premium pricing
- **Tip:** Complete 5-10 trips in same category

### Strategy 5: Earn More
- **Target:** Premium badges
- **Path:** Increase average booking value
- **Benefit:** High-value guide perception
- **Tip:** Premium tours, corporate bookings

### Strategy 6: Be Responsive
- **Target:** Reliability badges
- **Path:** Respond to messages <1 hour
- **Benefit:** Booking conversion increase
- **Tip:** Enable push notifications

---

## 🔔 Badge Notifications

### When You Earn a Badge
- ✅ Badge appears in dashboard
- ✅ Points added to total
- ✅ Profile updated automatically
- 🔜 Toast notification (if enabled)
- 🔜 Email notification (if opted-in)

### Notification Content
```
🎉 Congratulations!
You earned "Master Guide" badge
+100 points added
View your badge collection →
```

---

## 📈 Leaderboard Rankings

### How Ranking Works
1. **Primary:** Total badges earned
2. **Secondary:** Average rating
3. **Tertiary:** Total points
4. **Tertiary:** Active status

### Your Rank Update
- Calculated daily
- Updated when you earn badges
- Affected by other guides' progress

### Top Positions
- 🥇 **#1** - 30+ badges, 5.0 rating
- 🥈 **#2-3** - 25+ badges, 4.8+ rating
- 🥉 **#4-10** - 15+ badges, 4.5+ rating

---

## 🐛 Troubleshooting

### "No Badges Showing"
- ✅ Complete your first trip
- ✅ Mark booking as "completed"
- ✅ Wait 5 minutes for system update
- ✅ Refresh page

### "Points Not Updating"
- ✅ System processes on trip completion
- ✅ Check trip status is "completed"
- ✅ Verify booking is assigned to you
- ✅ Contact support if persists

### "Rank Not Updating"
- ✅ Leaderboard updates daily
- ✅ Manual updates on new badges
- ✅ Reload page to see latest rank
- ✅ Check analytics tab

### "Missing Expected Badge"
- ✅ Check criteria in badge catalog
- ✅ Verify you meet requirement
- ✅ Example: "Needs 5 trips, have 4"
- ✅ Progress tab shows % complete

---

## 🎯 Integration with Profile

### Where Badges Appear
1. **Your Profile Page** (/profile)
   - Badge showcase section
   - Recent badges highlighted
   - Total count displayed

2. **Guide Card** (Search results)
   - Top 3 badges shown
   - "Verified Expert" badge if applicable
   - Rating + badge stars

3. **Leaderboard** (/dashboard/guide/gamification)
   - Ranking with total badges
   - Point score visible
   - Badge distribution shown

4. **Booking Details**
   - Guest sees guide's badges
   - Increases booking trust
   - Differentiates experienced guides

---

## 📱 Mobile Access

Gamification dashboard is fully responsive:

- ✅ View badges on mobile
- ✅ Check leaderboard on-the-go
- ✅ Track progress from anywhere
- ✅ All charts optimized for mobile

---

## ⏰ When Does System Check?

**Automatic Checks Occur:**
- ✅ When trip marked "completed"
- ✅ When booking status changes
- ✅ When rating updated
- ✅ When review added
- ✅ When new booking completed

**Not Automatic:**
- ❌ Real-time progress tracking
- ❌ Leaderboard updates (daily)
- ❌ Seasonal badge transition (daily)

---

## 🚀 Future Enhancements

Coming Soon:
- 🔜 Real-time notification system
- 🔜 Badge sharing on social media
- 🔜 Badge-based rewards store
- 🔜 Challenge badges (limited-time)
- 🔜 Badge tournaments
- 🔜 Tier rankings (Bronze, Silver, Gold)

---

## ❓ FAQ

**Q: Can I lose badges?**
A: No, badges are permanent achievements.

**Q: How often does ranking update?**
A: Daily automatic update, or immediately on new badge.

**Q: Do badges affect my bookings?**
A: Yes, higher badge count increases visibility and trust.

**Q: Can I preview unreleased badges?**
A: Yes, check Progress tab to see upcoming badges.

**Q: Are points convertible to money?**
A: Not yet, but future rewards store coming.

**Q: How do seasonal badges work?**
A: Trip date determines season. Trips auto-categorized.

---

## 📞 Support

For badge system issues:
- Email: support@trailmate.pk
- In-app: Help → Gamification
- Dashboard: Chat with support

---

**Keep completing trips and building your guide reputation! Every achievement gets you closer to legend status.** 🚀
