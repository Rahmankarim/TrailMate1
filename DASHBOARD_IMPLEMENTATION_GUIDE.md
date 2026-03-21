# TrailMate Dashboard & Tour Management - Implementation Guide

## ✅ What's Already Working

1. **Email Verification System** - Fully functional with OTP
2. **User Authentication** - Sign up, sign in, JWT tokens
3. **API Endpoints Already Created**:
   - `/api/destinations` - Create and fetch tours/destinations
   - `/api/bookings` - Create and fetch bookings
   - Both with proper authentication

## 🎯 Required Changes

### 1. Update Company Dashboard with Real Data

**File**: `app/dashboard/company/page.tsx`

**Current Issue**: Uses dummy/static data  
**Solution**: Fetch real data from MongoDB Atlas via API

**Changes Needed**:

```typescript
// Add these imports
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";

// Replace dummy data with API calls
useEffect(() => {
  fetchBookings(); // GET /api/bookings
  fetchDestinations(); // GET /api/destinations?userOnly=true
}, []);
```

**What to Display**:

- Total Revenue → Sum of all booking prices
- Total Bookings → Count of bookings
- Active Tours → Count of published destinations
- Recent Bookings → Last 4-5 bookings with real customer names
- Top Tours → Destinations sorted by booking count

---

### 2. Fix Create Tour Form

**File**: `app/dashboard/guide/destinations/new/page.tsx`

**Current Status**: Form exists but needs user context

**Required Changes**:

1. Get user info from `useAuth()` hook
2. Pass user ID, name, email to API when creating destination
3. Handle success/error responses properly

**Update handleSubmit**:

```typescript
const { user } = useAuth();

const payload = {
  ...formData,
  createdBy: user?._id,
  createdByName: `${user?.firstName} ${user?.lastName}`,
  createdByEmail: user?.email,
  // ... rest of fields
};
```

---

### 3. Update Destinations Page with Database Data

**File**: `app/destinations/destinations-content.tsx`

**Current Issue**: May be using static data  
**Solution**: Fetch from API

**Changes**:

```typescript
useEffect(() => {
  fetch("/api/destinations?published=true")
    .then((res) => res.json())
    .then((data) => setDestinations(data.destinations));
}, []);
```

Display:

- All published destinations
- Real prices, locations, images
- Filter by region, difficulty, price
- Link to detail pages

---

### 4. Create Dynamic Destination Detail Pages

**File**: `app/destinations/[slug]/page.tsx`

**Create if doesn't exist**

**Features**:

- Fetch destination by slug
- Show all details (itinerary, highlights, price)
- "Book Now" button → Creates booking
- Reviews section (future)

---

### 5. User Dashboard - Show User's Bookings

**File**: `app/dashboard/user/page.tsx`

**Display**:

- User's upcoming trips
- Past trips
- Booking status (pending, confirmed, completed)
- Total spent

**API Call**:

```typescript
GET / api / bookings;
// Automatically filters by user ID (from JWT token)
```

---

### 6. Guide Dashboard - Show Guide's Tours & Bookings

**File**: `app/dashboard/guide/page.tsx`

**Display**:

- Guide's created destinations
- Bookings for their tours
- Revenue earned
- Create new tour button → `/dashboard/guide/destinations/new`

---

## 📦 Database Collections

### Destinations Collection

```typescript
{
  _id: ObjectId
  name: string
  slug: string
  description: string
  price: number
  location: string
  difficulty: string
  duration: string
  images: string[]
  itinerary: array
  createdBy: ObjectId  // User ID of creator
  isPublished: boolean
  bookingsCount: number
  rating: number
  createdAt: Date
}
```

### Bookings Collection

```typescript
{
  _id: ObjectId;
  destinationId: ObjectId;
  destinationName: string;
  userId: ObjectId;
  userName: string;
  userEmail: string;
  companyId: ObjectId;
  numberOfPeople: number;
  totalPrice: number;
  startDate: Date;
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: "pending" | "paid";
  createdAt: Date;
}
```

### Users Collection

```typescript
{
  _id: ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  role: "traveler" | "guide" | "company";
  isVerified: boolean;
  createdAt: Date;
}
```

---

## 🚀 Quick Implementation Steps

### Step 1: Test Current APIs

```bash
# Test destinations API
curl http://localhost:3000/api/destinations

# Test create destination (need auth token)
# Try from browser after logging in as guide/company
```

### Step 2: Update Form to Include User Data

Edit: `app/dashboard/guide/destinations/new/page.tsx`

- Add `const { user } = useAuth()`
- Include user data in payload

### Step 3: Update Dashboards

For each role (company, guide, user):

- Replace static data with API calls
- Show loading states
- Handle empty states

### Step 4: Connect Destinations Page

- Fetch published destinations
- Display in grid
- Add filtering

### Step 5: Create Booking Flow

1. User clicks "Book Now" on destination
2. Fill booking form (dates, people)
3. POST to `/api/bookings`
4. Show confirmation

---

## 🎨 UI Components to Reuse

All these exist in `components/ui/`:

- `Card` - For containers
- `Button` - CTAs
- `Badge` - Status indicators
- `Input, Textarea` - Forms
- `Select` - Dropdowns
- `Avatar` - User images
- `Progress` - Tour completion
- `Table` - Bookings list

---

## 📝 Sample Code Snippets

### Fetch and Display Bookings

```typescript
const [bookings, setBookings] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("/api/bookings", {
    credentials: "include", // Include cookies
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        setBookings(data.bookings);
      }
    })
    .finally(() => setLoading(false));
}, []);
```

### Create New Booking

```typescript
const bookTour = async (destinationId, data) => {
  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      destinationId,
      numberOfPeople: data.people,
      startDate: data.date,
      specialRequests: data.notes,
    }),
  });

  const result = await res.json();
  if (result.success) {
    // Show success message
    router.push("/dashboard/user");
  }
};
```

---

## ✨ Priority Order

1. **High Priority** (Do First):

   - Fix create tour form with user context
   - Update company/guide dashboards with real data
   - Connect destinations page to database

2. **Medium Priority**:

   - Create destination detail pages
   - Add booking functionality
   - User dashboard with bookings

3. **Low Priority** (Polish):
   - Add reviews system
   - Advanced filtering
   - Analytics charts
   - Email notifications

---

## 🔒 Security Checklist

- ✅ APIs already check JWT tokens
- ✅ Users can only see their own bookings
- ✅ Only guides/companies can create destinations
- ✅ Passwords hashed with bcrypt
- ✅ Email verification required

---

## 🐛 Current Issues to Fix

1. **Create Tour Button** - Form exists, just needs user context
2. **Dummy Data** - Replace with database calls
3. **Destinations Page** - Connect to database
4. **No Booking Flow** - Need to add "Book Now" functionality

---

## Need Help?

All the infrastructure is ready. Just need to:

1. Connect forms to APIs
2. Replace static data with database calls
3. Add loading states
4. Handle errors gracefully

The APIs work, authentication works, database is ready. Just wire up the UI!
