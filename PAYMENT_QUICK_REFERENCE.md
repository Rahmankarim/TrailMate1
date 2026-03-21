# 🎯 Quick Reference: Payment Status System

## Payment Status Values

| Status | Meaning | Color | When It Happens |
|--------|---------|-------|-----------------|
| `unpaid` | Not yet paid | 🔴 Red | Booking created or confirmed but no payment |
| `pending` | Payment in process | 🟠 Orange | User initiated payment, awaiting verification |
| `paid` | Payment complete | 🟢 Green | Payment verified successfully |
| `refunded` | Money returned | ⚫ Gray | Refund processed |

## Earnings Rules

### ✅ Counted in Earnings
- Bookings with `paymentStatus: "paid"`

### ❌ NOT Counted in Earnings
- Bookings with `paymentStatus: "unpaid"`
- Bookings with `paymentStatus: "pending"`
- Bookings with `paymentStatus: "refunded"`
- Any booking without payment completion

## Code Snippets

### Check if Booking Contributes to Earnings
```typescript
// Correct way to calculate earnings
const earnings = bookings
  .filter(booking => booking.paymentStatus === "paid")
  .reduce((sum, booking) => sum + booking.totalPrice, 0)
```

### Display Payment Badge
```typescript
const getPaymentBadge = (status?: string) => {
  const styles = {
    unpaid: "bg-red-500/10 text-red-600",
    pending: "bg-orange-500/10 text-orange-600",
    paid: "bg-green-500/10 text-green-600",
    refunded: "bg-gray-500/10 text-gray-600"
  }
  return styles[status as keyof typeof styles] || styles.unpaid
}
```

## Where Payment Status Appears

### User Dashboard (`/dashboard/user/bookings`)
- Pending Requests → Shows payment status badge
- Confirmed Tours → Shows "Proceed to Payment" button if unpaid
- Completed Tours → Shows final payment status

### Guide Dashboard (`/dashboard/guide`)
- Pending Requests → Shows payment status
- Upcoming Tours → Shows payment status badge
- Total Earnings → Only includes paid bookings

### Guide Earnings (`/dashboard/guide/earnings`)
- Total Earnings → Paid bookings only
- Pending Payments → Unpaid + Pending bookings
- This Month → Paid bookings this month

### Company Revenue (`/dashboard/company/revenue`)
- Total Revenue → Paid bookings only
- Completed → Paid bookings
- Pending → Unpaid + Pending bookings
- Monthly Charts → Paid bookings only

## Quick Debugging

### Earnings Not Updating?
1. Check booking `paymentStatus` in database → Must be `"paid"`
2. Check payment record `status` → Must be `"completed"`
3. Verify payment verification ran successfully

### Payment Button Not Showing?
1. Check booking `status` → Should be `"confirmed"` or `"pending"`
2. Check booking `paymentStatus` → Should be `"unpaid"`
3. Check if payment already exists for booking

### Revenue Too High/Low?
1. Check filter: `bookings.filter(b => b.paymentStatus === "paid")`
2. Make sure not using `b.status === "completed"`
3. Verify paid bookings count matches

## API Quick Reference

### Create Booking
```typescript
POST /api/bookings
Body: { guideId, startDate, endDate, guests, totalPrice }
Result: paymentStatus = "unpaid"
```

### Accept Booking (Guide)
```typescript
PATCH /api/bookings/:id
Body: { status: "confirmed" }
Result: status changes, paymentStatus stays "unpaid"
```

### Create Payment
```typescript
POST /api/payments
Body: { bookingId }
Result: paymentStatus = "pending"
```

### Verify Payment
```typescript
POST /api/payments/verify
Body: { transactionId, bookingId }
Result: paymentStatus = "paid" ✅
```

## Visual Guide

### Booking Lifecycle with Payment
```
┌──────────────────────────────────────────────────────┐
│ 1. CREATED                                           │
│    Status: pending | Payment: unpaid                 │
│    Earnings: $0                                      │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 2. ACCEPTED BY GUIDE                                 │
│    Status: confirmed | Payment: unpaid               │
│    Earnings: $0                                      │
│    → User can now proceed to payment                 │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 3. PAYMENT INITIATED                                 │
│    Status: confirmed | Payment: pending              │
│    Earnings: $0                                      │
│    → User redirected to JazzCash                     │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 4. PAYMENT COMPLETED ✅                              │
│    Status: confirmed | Payment: paid                 │
│    Earnings: +$500 ✅                                │
│    → Shows green "Paid" badge                        │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 5. TOUR COMPLETED                                    │
│    Status: completed | Payment: paid                 │
│    Earnings: $500 (maintained)                       │
└──────────────────────────────────────────────────────┘
```

## Common Mistakes to Avoid

### ❌ WRONG
```typescript
// Don't use booking status for earnings
const earnings = bookings
  .filter(b => b.status === "completed")
  .reduce((sum, b) => sum + b.totalPrice, 0)
```

### ✅ CORRECT
```typescript
// Use payment status for earnings
const earnings = bookings
  .filter(b => b.paymentStatus === "paid")
  .reduce((sum, b) => sum + b.totalPrice, 0)
```

### ❌ WRONG
```typescript
// Don't count all confirmed bookings
if (booking.status === "confirmed") {
  totalRevenue += booking.totalPrice
}
```

### ✅ CORRECT
```typescript
// Only count paid bookings
if (booking.paymentStatus === "paid") {
  totalRevenue += booking.totalPrice
}
```

## Testing Checklist

- [ ] Create booking → `unpaid` status
- [ ] Accept booking → Still `unpaid`
- [ ] Initiate payment → `pending` status
- [ ] Complete payment → `paid` status
- [ ] Check earnings → Increased by booking amount
- [ ] Check pending revenue → Decreased
- [ ] Verify badges display correctly
- [ ] Test on all dashboard pages

## File Locations

### Models
- `lib/db/models/booking.ts` - Booking interface with paymentStatus

### API Routes
- `app/api/bookings/route.ts` - Booking CRUD
- `app/api/payments/route.ts` - Payment creation
- `app/api/payments/verify/route.ts` - Payment verification

### Dashboards
- `app/dashboard/user/bookings/page.tsx` - User bookings
- `app/dashboard/guide/page.tsx` - Guide main dashboard
- `app/dashboard/guide/earnings/page.tsx` - Guide earnings
- `app/dashboard/guide/bookings/page.tsx` - Guide bookings list
- `app/dashboard/company/revenue/page.tsx` - Company revenue

## Need Help?

See these detailed guides:
- `PAYMENT_FLOW_GUIDE.md` - Complete payment flow
- `PAYMENT_LOGIC_FIX_SUMMARY.md` - What was changed
- `PAYMENT_IMPLEMENTATION_CHECKLIST.md` - Full checklist
- `QUICK_START_JAZZCASH.md` - JazzCash setup

## Remember!

**🎯 Golden Rule**: Only count bookings with `paymentStatus: "paid"` in earnings calculations!
