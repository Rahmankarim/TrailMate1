# Booking System Logical Separation - Implementation Guide

## Problem Fixed
Previously, the system treated company guide hiring the same as destination bookings, causing logical issues in analytics and revenue tracking.

## Solution Overview
Implemented a clear separation between:
1. **Destination Bookings** - Users/companies booking destinations/tours
2. **Guide Hiring** - Companies hiring guides for corporate events

## Database Changes

### Booking Model Updates
**File**: `lib/db/models/booking.ts`

Added new fields:
```typescript
bookingType: "destination_booking" | "guide_hiring"
employees?: number // For company guide hiring
tourName?: string // For guide hiring
tourDescription?: string // For guide hiring
```

## API Changes

### Bookings API
**File**: `app/api/bookings/route.ts`

- Added `bookingType` parameter to filter bookings
- Query parameter: `?bookingType=destination_booking` or `?bookingType=guide_hiring`
- All booking creation now includes `bookingType` field

## Company Dashboard Changes

### New Pages

#### 1. Guide Hiring Page
**File**: `app/dashboard/company/guide-hiring/page.tsx`
- **Route**: `/dashboard/company/guide-hiring`
- **Purpose**: Manage all guide hirings for corporate events
- **Features**:
  - View pending, confirmed, and completed hirings
  - Process payments for guide services
  - Message guides about corporate tours
  - Track employees count and tour details

### Updated Pages

#### 2. Bookings Page
**File**: `app/dashboard/company/bookings/page.tsx`
- **Filter**: Now only shows `bookingType=destination_booking`
- **Purpose**: Display only destination bookings (user bookings of company tours)

#### 3. Analytics Page
**File**: `app/dashboard/company/analytics/page.tsx`
- **Filter**: Only analyzes destination bookings
- **Metrics**: Separate from guide hiring statistics

#### 4. Revenue Page
**File**: `app/dashboard/company/revenue/page.tsx`
- **Filter**: Only tracks revenue from destination bookings
- **Separation**: Guide hiring revenue tracked separately

#### 5. Main Dashboard
**File**: `app/dashboard/company/page.tsx`
- **Stats**: Shows both metrics separately:
  - Destination Revenue (from paid bookings)
  - Total Bookings (destination bookings)
  - Guide Hirings (corporate guide hiring count)
  - Active Tours

### Navigation Update
**File**: `components/dashboard/sidebar.tsx`
- Added "Guide Hiring" menu item with Briefcase icon
- Positioned between "Bookings" and "Tours"

## Data Flow

### Destination Booking Flow
```
User → Destination → Book → Booking (bookingType: "destination_booking")
→ Shows in Company Bookings page
→ Counts toward Destination Revenue
→ Included in Analytics
```

### Guide Hiring Flow
```
Company → Guide → Hire → Booking (bookingType: "guide_hiring")
→ Shows in Guide Hiring page
→ Separate from destination revenue
→ NOT in regular bookings/analytics
```

## Key Distinctions

| Aspect | Destination Booking | Guide Hiring |
|--------|-------------------|--------------|
| **Who Books** | Users/Travelers | Companies |
| **What's Booked** | Destinations/Tours | Guide Services |
| **Page** | Bookings | Guide Hiring |
| **Revenue** | Destination Revenue | Guide Hiring Revenue |
| **Analytics** | Included | Separate |
| **Fields** | guests, destinationId | employees, tourName |

## API Usage Examples

### Fetch Destination Bookings
```javascript
fetch('/api/bookings?bookingType=destination_booking')
```

### Fetch Guide Hirings
```javascript
fetch('/api/bookings?bookingType=guide_hiring')
```

### Create Destination Booking
```javascript
{
  bookingType: "destination_booking",
  destinationId: "...",
  guests: 4,
  // ...
}
```

### Create Guide Hiring
```javascript
{
  bookingType: "guide_hiring",
  guideId: "...",
  employees: 25,
  tourName: "Corporate Team Building",
  tourDescription: "...",
  // ...
}
```

## Benefits

1. **Clear Separation**: Destination bookings and guide hiring are completely separate
2. **Accurate Analytics**: Revenue and metrics only count relevant bookings
3. **Better UX**: Companies see guide hirings in dedicated section
4. **Logical Flow**: Each booking type has appropriate fields and tracking
5. **Scalable**: Easy to add more booking types in future

## Migration Notes

For existing bookings without `bookingType`:
- Can run a migration script to set default values based on presence of `destinationId` vs `tourName`
- Or set default to `"destination_booking"` for backward compatibility

## Testing Checklist

- [ ] Company can create guide hiring
- [ ] Guide hiring shows in Guide Hiring page
- [ ] Guide hiring does NOT show in Bookings page
- [ ] Destination bookings show in Bookings page
- [ ] Destination bookings do NOT show in Guide Hiring page
- [ ] Analytics only counts destination bookings
- [ ] Revenue page only tracks destination bookings
- [ ] Dashboard shows separate counts for each type
- [ ] Payment flow works for both types
- [ ] Messaging works from both pages
