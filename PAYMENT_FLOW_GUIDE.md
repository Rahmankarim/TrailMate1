# Payment Flow Guide

## Overview
This document explains the complete payment flow in TrailMate, from booking creation to payment completion and earnings tracking.

## Payment Status Flow

### 1. Booking Created (Initial State)
- **Booking Status**: `pending`
- **Payment Status**: `unpaid`
- User creates a booking request
- Booking appears in guide's "Pending Requests"
- No payment required yet
- **Earnings**: NOT counted in guide/company earnings

### 2. Guide Accepts Booking
- **Booking Status**: `pending` → `confirmed`
- **Payment Status**: `unpaid` (unchanged)
- Guide reviews and accepts the booking
- Booking moves to "Confirmed Tours" for user
- User can now proceed to payment
- **Earnings**: NOT counted yet (awaiting payment)

### 3. User Initiates Payment
- **Booking Status**: `confirmed` (unchanged)
- **Payment Status**: `unpaid` → `pending`
- User clicks "Proceed to Payment"
- Payment record created in database
- JazzCash payment initiated
- User redirected to JazzCash payment gateway
- **Earnings**: NOT counted yet

### 4. Payment Completed Successfully
- **Booking Status**: `confirmed` (unchanged)
- **Payment Status**: `pending` → `paid`
- JazzCash payment verification successful
- Payment record updated to `completed`
- Booking marked as paid
- **Earnings**: NOW counted in guide/company total earnings ✅

### 5. Tour Completed
- **Booking Status**: `confirmed` → `completed`
- **Payment Status**: `paid` (unchanged)
- Guide marks tour as complete
- Tour appears in "Completed Tours"
- **Earnings**: Continues to be counted

## Payment Statuses

### For Bookings
- `unpaid`: Initial state when booking is created
- `pending`: Payment initiated but not yet verified
- `paid`: Payment successfully completed and verified
- `refunded`: Payment was refunded to user

### For Payments (separate collection)
- `pending`: Payment transaction initiated with JazzCash
- `completed`: Payment successfully verified
- `failed`: Payment failed or was cancelled

## Earnings Calculation Rules

### Guide Earnings Dashboard
```typescript
// ONLY count bookings with paymentStatus = 'paid'
const paidBookings = bookings.filter(b => b.paymentStatus === "paid")
const totalEarnings = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0)
```

**Example**:
- 5 pending bookings ($500 total) = **$0 earnings**
- 3 confirmed but unpaid bookings ($300 total) = **$0 earnings**
- 2 paid bookings ($200 total) = **$200 earnings** ✅

### Company Revenue Dashboard
```typescript
// Actual Revenue (Paid bookings only)
const paidBookings = bookings.filter(b => b.paymentStatus === "paid")
const actualRevenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0)

// Pending Revenue (Awaiting payment)
const pendingPaymentBookings = bookings.filter(b => 
  b.paymentStatus === "unpaid" || b.paymentStatus === "pending"
)
const pendingRevenue = pendingPaymentBookings.reduce((sum, b) => sum + b.totalPrice, 0)
```

## Database Schema

### Booking Document
```typescript
{
  _id: ObjectId,
  userId: ObjectId,              // The traveler
  guideId: ObjectId,             // The guide
  status: "pending" | "confirmed" | "completed" | "cancelled",
  paymentStatus: "unpaid" | "pending" | "paid" | "refunded",
  totalPrice: number,
  startDate: Date,
  endDate: Date,
  guests: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Payment Document
```typescript
{
  _id: ObjectId,
  bookingId: ObjectId,           // Links to booking
  userId: ObjectId,              // The payer (traveler)
  guideId: ObjectId,             // The recipient (guide)
  amount: number,
  currency: "PKR",
  transactionId: string,         // JazzCash transaction ID
  status: "pending" | "completed" | "failed",
  paymentMethod: "jazzcash",
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date              // When payment was verified
}
```

## API Endpoints

### 1. Create Booking
**POST** `/api/bookings`
```json
{
  "guideId": "guide_id",
  "startDate": "2026-02-01",
  "endDate": "2026-02-05",
  "guests": 2,
  "totalPrice": 500
}
```
**Result**: Creates booking with `status: "pending"`, `paymentStatus: "unpaid"`

### 2. Accept Booking (Guide)
**PATCH** `/api/bookings/:id`
```json
{
  "status": "confirmed"
}
```
**Result**: Updates `status` to `"confirmed"`, `paymentStatus` remains `"unpaid"`

### 3. Create Payment
**POST** `/api/payments`
```json
{
  "bookingId": "booking_id"
}
```
**Result**: 
- Creates payment record
- Updates booking `paymentStatus` to `"pending"`
- Returns JazzCash payment URL

### 4. Verify Payment
**POST** `/api/payments/verify`
```json
{
  "transactionId": "txn_123",
  "bookingId": "booking_id"
}
```
**Result**: 
- Verifies payment with JazzCash
- Updates payment status to `"completed"`
- Updates booking `paymentStatus` to `"paid"`

## User Journey

### Traveler Perspective
1. Browse guides and create booking
2. Wait for guide to accept (**Pending Requests**)
3. Once accepted, see in **Confirmed Tours** with "Not Paid" badge
4. Click "Proceed to Payment" button
5. Complete payment via JazzCash
6. Booking shows "Paid" badge
7. After tour, see in **Completed Tours**

### Guide Perspective
1. Receive booking request in **Pending Requests** with "Not Paid" badge
2. Review and accept booking
3. Booking moves to **Upcoming Tours** with "Payment Pending" badge
4. Wait for traveler to complete payment
5. Once paid, badge changes to "Paid" ✅
6. Amount added to **Total Earnings**
7. Complete tour to move to history

### Company/Admin Perspective
1. View all bookings in revenue dashboard
2. See **Pending Revenue** (bookings awaiting payment)
3. See **Actual Revenue** (paid bookings only)
4. Track monthly revenue based on PAID bookings only

## Dashboard Display

### User Bookings Page
```
┌─────────────────────────────────────┐
│ Pending Requests                    │
│ ┌─────────────────────────────────┐ │
│ │ Guide Name        [pending]     │ │
│ │ Tour Name        [Not Paid]     │ │
│ │ Dates, Guests, Price            │ │
│ │ [Cancel Request]                │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Confirmed Tours                     │
│ ┌─────────────────────────────────┐ │
│ │ Guide Name    [confirmed]       │ │
│ │ Tour Name    [Not Paid]         │ │
│ │ Dates, Guests, Price            │ │
│ │ [Proceed to Payment - $500]     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Guide Dashboard
```
┌─────────────────────────────────────┐
│ Stats                               │
│ Total Earnings: $1,200              │
│ (From paid tours only)              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Upcoming Tours                      │
│ ┌─────────────────────────────────┐ │
│ │ Traveler Name  [Confirmed]      │ │
│ │ Tour Name      [Payment Pending]│ │
│ │ Dates, Guests                   │ │
│ │ $500 [Message] [Complete]       │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Traveler Name  [Confirmed]      │ │
│ │ Tour Name      [Paid] ✓         │ │
│ │ Dates, Guests                   │ │
│ │ $300 [Message] [Complete]       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Key Points

1. **Earnings are ONLY counted when payment is completed** (`paymentStatus: "paid"`)
2. **Booking status and payment status are separate**:
   - Booking status tracks tour lifecycle (pending → confirmed → completed)
   - Payment status tracks payment state (unpaid → pending → paid)
3. **Payment can only be initiated for confirmed bookings**
4. **Refunds update paymentStatus to "refunded"** and earnings are automatically recalculated
5. **Monthly revenue charts only include PAID bookings**
6. **Pending payments are shown separately from actual earnings**

## Testing the Flow

### Mock Payment Mode
For development, use mock credentials:
```env
JAZZCASH_MERCHANT_ID=mock_merchant_id
JAZZCASH_PASSWORD=mock_password
JAZZCASH_INTEGRITY_SALT=mock_salt
JAZZCASH_ENVIRONMENT=sandbox
```

This will:
- Auto-approve payments immediately
- Skip JazzCash API calls
- Allow testing the complete flow locally

### Production
Replace with real JazzCash credentials:
```env
JAZZCASH_MERCHANT_ID=your_real_merchant_id
JAZZCASH_PASSWORD=your_real_password
JAZZCASH_INTEGRITY_SALT=your_real_salt
JAZZCASH_ENVIRONMENT=production
```

## Common Issues

### "Earnings showing $0"
- Check if bookings have `paymentStatus: "paid"`
- Confirm payment was verified successfully
- Review earnings calculation logic

### "Can't proceed to payment"
- Ensure booking status is `"confirmed"`
- Check if payment already exists for booking
- Verify user owns the booking

### "Payment shows but earnings don't increase"
- Verify payment status is `"completed"` not just `"pending"`
- Check if booking `paymentStatus` was updated to `"paid"`
- Review database for payment and booking records

## Support
For issues with JazzCash integration, refer to:
- [QUICK_START_JAZZCASH.md](./QUICK_START_JAZZCASH.md)
- [JAZZCASH_MIGRATION.md](./JAZZCASH_MIGRATION.md)
