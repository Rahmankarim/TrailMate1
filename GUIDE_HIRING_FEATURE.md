# Guide Hiring Feature - Complete Implementation

## Overview
The guide hiring feature allows companies to hire guides for corporate events, team building activities, and other business tours. This is separate from regular destination bookings.

## How It Works

### For Companies

#### 1. **Browse Guides**
- Navigate to `/guides` to see all available guides
- Click on any guide to view their detailed profile

#### 2. **Hire a Guide (On Guide Detail Page)**
- When logged in as a company, you'll see a **"Hire for Corporate Event"** button (blue button)
- Regular users see "Check Availability" instead
- This button only appears for company accounts

#### 3. **Fill Corporate Event Details**
The hiring dialog includes corporate-specific fields:
- **Event/Tour Name** (required) - e.g., "Annual Team Building Retreat"
- **Event Description** - Details about the corporate event, objectives, requirements
- **Start Date** (required) - Event start date
- **End Date** (required) - Event end date  
- **Number of Employees** (required) - How many employees will attend
- **Additional Notes** - Special requirements, dietary restrictions, accessibility needs

#### 4. **Price Calculation**
- Automatically calculates: Guide's daily rate × Number of days
- Shows duration and estimated cost in real-time
- PKR currency (Pakistan Rupees)

#### 5. **Submit Hiring Request**
- Creates a booking with `bookingType: "guide_hiring"`
- Status starts as "pending" 
- Payment status starts as "unpaid"
- Redirects to company guide hiring dashboard after submission

### Managing Hirings

#### Access Your Hirings
- Navigate to **Dashboard → Guide Hiring** (in company sidebar)
- Or go directly to `/dashboard/company/guide-hiring`

#### View All Hirings
The page shows all your guide hirings organized by status:
- **Pending** - Awaiting guide confirmation
- **Confirmed** - Guide accepted, payment needed
- **Completed** - Tour finished and paid

#### Statistics Dashboard
- Total Hirings
- Confirmed Tours
- Total Spent (PKR)

#### Each Hiring Card Shows:
- Guide information (name, avatar, location)
- Event/Tour name and description
- Employee count
- Date range and duration
- Total cost
- Current status (pending/confirmed/completed)
- Payment status (unpaid/pending/paid)

#### Available Actions:
1. **Process Payment** (for confirmed, unpaid hirings)
   - Initiates JazzCash payment
   - Updates payment status to "pending" → "paid"
   
2. **Message Guide** (for confirmed/completed tours)
   - Opens messaging dialog
   - Direct communication with the guide
   - Messages appear in company messages page

## Technical Implementation

### Database Structure
```typescript
{
  bookingType: "guide_hiring",  // Distinguishes from regular bookings
  guideId: string,              // Guide profile ID
  tourName: string,             // Corporate event name
  tourDescription: string,      // Event details
  employees: number,            // Number of attendees
  startDate: Date,              // Event start
  endDate: Date,                // Event end
  totalPrice: number,           // Guide rate × days
  status: "pending" | "confirmed" | "completed" | "cancelled",
  paymentStatus: "unpaid" | "pending" | "paid" | "refunded"
}
```

### API Endpoints

#### Create Hiring
```
POST /api/bookings
Body: { bookingType: "guide_hiring", ... }
```

#### Fetch Company Hirings
```
GET /api/bookings?type=company&bookingType=guide_hiring
```

#### Process Payment
```
POST /api/payments
Body: { bookingId, amount, type: "guide_hiring" }
```

#### Send Message
```
POST /api/messages
Body: { guideId, message, ... }
```

### Key Files
- `/app/guides/[id]/page.tsx` - Guide detail with hiring button & dialog
- `/app/dashboard/company/guide-hiring/page.tsx` - Hirings management
- `/app/api/bookings/route.ts` - Booking creation & retrieval
- `/components/dashboard/sidebar.tsx` - Navigation with "Guide Hiring" link

## Separation from Regular Bookings

### Regular Bookings (`bookingType: "destination_booking"`)
- Users book company destinations
- Shown in `/dashboard/company/bookings`
- Includes destination details, activities

### Guide Hirings (`bookingType: "guide_hiring"`)
- Companies hire guides for corporate events
- Shown in `/dashboard/company/guide-hiring`
- Includes tour name, employee count, corporate details

This separation ensures:
- Clear organization of different booking types
- Accurate reporting and analytics
- Proper workflow for each booking type
- No confusion between destination bookings and guide hiring

## Payment Flow

1. **Unpaid** - Initial state when hiring request is created
2. **Pending** - Payment initiated via JazzCash gateway
3. **Paid** - Payment verified and completed
4. **Refunded** - Payment refunded (if applicable)

Only "paid" bookings count toward company spending statistics.

## User Experience Flow

```
Company Login 
  → Browse Guides (/guides)
    → View Guide Profile (/guides/[id])
      → Click "Hire for Corporate Event" (company only)
        → Fill Event Details
          → Submit Request
            → Redirected to Guide Hiring Dashboard
              → View Pending Request
                → Guide Confirms
                  → Process Payment
                    → Message Guide
                      → Complete Tour
```

## Features

✅ Corporate-specific hiring form
✅ Automatic price calculation
✅ Date range selection
✅ Employee count tracking
✅ Event details (name, description)
✅ Separate from regular bookings
✅ Payment processing
✅ Direct messaging with guides
✅ Statistics dashboard
✅ Status tracking (pending/confirmed/completed)
✅ Payment status tracking
✅ Role-based access (company only)

## Testing the Feature

1. Sign in as a company account
2. Go to `/guides`
3. Click on any guide
4. Look for the blue "Hire for Corporate Event" button
5. Fill in the corporate event details
6. Submit the request
7. Check `/dashboard/company/guide-hiring` to see your hiring
8. Process payment when guide confirms
9. Message the guide for coordination

## Notes

- Only company accounts can hire guides
- Regular users see "Check Availability" for personal bookings
- Guides can be hired for multiple concurrent events
- Payment is required after guide confirmation
- All communication happens through the messaging system
