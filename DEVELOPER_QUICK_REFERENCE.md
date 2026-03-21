# TrailMate Developer Quick Reference

## Common Patterns

### 1. Adding Pagination to an API Endpoint

```typescript
import { getPaginationParams, createPaginatedResponse } from "@/lib/utils/pagination"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const paginate = searchParams.get("paginate") !== "false"
  
  if (paginate) {
    const { page, limit, skip } = getPaginationParams(searchParams, 20) // default 20/page
    const total = await collection.countDocuments(query)
    
    const items = await collection
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray()
    
    return NextResponse.json(createPaginatedResponse(items, total, page, limit))
  } else {
    const items = await collection.find(query).toArray()
    return NextResponse.json({ items })
  }
}
```

### 2. Adding Search to an API Endpoint

```typescript
import { buildRegexSearchQuery, getSortParams } from "@/lib/utils/search"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get("search")
  
  const query: any = {}
  
  // Search across multiple fields
  if (search) {
    const searchQuery = buildRegexSearchQuery(search, ["name", "description", "location"])
    Object.assign(query, searchQuery)
  }
  
  // Add sorting
  const { sortBy, sortOrder } = getSortParams(searchParams, "createdAt", "desc")
  const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 }
  
  const items = await collection.find(query).sort(sortOptions).toArray()
  return NextResponse.json({ items })
}
```

### 3. Standardized Response Format

```typescript
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/responses"

export async function POST(request: NextRequest) {
  try {
    // Validation
    if (!requiredField) {
      return NextResponse.json(
        createErrorResponse("Missing required field", 400),
        { status: 400 }
      )
    }
    
    // Success
    return NextResponse.json(
      createSuccessResponse({ data }, "Operation successful")
    )
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      createErrorResponse("Internal server error", 500),
      { status: 500 }
    )
  }
}
```

### 4. Input Validation

```typescript
import { isValidObjectId, sanitizeInput, validateRequestBody } from "@/lib/utils/validation"
import { z } from "zod"

// Define schema
const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  price: z.number().positive()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate with Zod
    const validation = validateRequestBody(body, schema)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse("Validation failed", 400, "VALIDATION_ERROR", validation.errors),
        { status: 400 }
      )
    }
    
    // Use validated data
    const data = validation.data
    
    // Sanitize string inputs
    const cleanName = sanitizeInput(data.name)
    
    // Validate ObjectId
    if (!isValidObjectId(someId)) {
      return NextResponse.json(
        createErrorResponse("Invalid ID format", 400),
        { status: 400 }
      )
    }
    
    // ... rest of handler
  } catch (error) {
    // Error handling
  }
}
```

### 5. Protected API Route with Role Check

```typescript
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value
    
    if (!token) {
      return NextResponse.json(
        createErrorResponse("Unauthorized", 401),
        { status: 401 }
      )
    }
    
    const payload = await verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json(
        createErrorResponse("Invalid token", 401),
        { status: 401 }
      )
    }
    
    // Role check
    if (payload.role !== "admin" && payload.role !== "company") {
      return NextResponse.json(
        createErrorResponse("Forbidden", 403),
        { status: 403 }
      )
    }
    
    // ... rest of handler
  } catch (error) {
    // Error handling
  }
}
```

### 6. Check Resource Ownership

```typescript
// Get resource
const booking = await collection.findOne({ _id: new ObjectId(id) })

if (!booking) {
  return NextResponse.json(
    createErrorResponse("Booking not found", 404),
    { status: 404 }
  )
}

// Verify ownership
if (booking.userId.toString() !== payload.userId && payload.role !== "admin") {
  return NextResponse.json(
    createErrorResponse("You don't have permission to access this resource", 403),
    { status: 403 }
  )
}
```

### 7. Create Notification

```typescript
await notificationsCollection.insertOne({
  userId: new ObjectId(userId),
  type: "booking", // or "payment", "message", "system"
  title: "New Booking",
  message: "You have received a new booking.",
  actionUrl: "/dashboard/guide/bookings/123",
  read: false,
  createdAt: new Date()
})
```

### 8. Filter by Date Range

```typescript
import { buildDateRangeQuery } from "@/lib/utils/search"

const startDate = searchParams.get("startDate")
const endDate = searchParams.get("endDate")

if (startDate || endDate) {
  const dateQuery = buildDateRangeQuery("createdAt", startDate, endDate)
  Object.assign(query, dateQuery)
}
```

---

## Utility Functions Reference

### Pagination
```typescript
// Get params from URL
const { page, limit, skip } = getPaginationParams(searchParams, 20)

// Create metadata
const meta = createPaginationMeta(total, page, limit)

// Create paginated response
const response = createPaginatedResponse(data, total, page, limit)

// With additional data
const response = createPaginatedResponse(data, total, page, limit, {
  averageRating: 4.5,
  totalReviews: 100
})
```

### Search & Filter
```typescript
// Regex search across fields
const searchQuery = buildRegexSearchQuery("keyword", ["name", "description"])

// Text search (requires MongoDB text index)
const searchQuery = buildTextSearchQuery("keyword")

// Sort params
const { sortBy, sortOrder } = getSortParams(searchParams, "createdAt", "desc")

// Dynamic filters
const filters = buildFilterQuery(searchParams, {
  difficulty: "exact",
  category: "exact",
  status: "exact"
})

// Date range
const dateQuery = buildDateRangeQuery("createdAt", "2024-01-01", "2024-12-31")
```

### Validation
```typescript
// Email
if (!isValidEmail(email)) { /* error */ }

// ObjectId
if (!isValidObjectId(id)) { /* error */ }

// URL
if (!isValidUrl(url)) { /* error */ }

// Phone
if (!isValidPhoneNumber(phone)) { /* error */ }

// Sanitize
const clean = sanitizeInput(userInput)

// Parse JSON safely
const data = safeJsonParse(jsonString)

// Validate with Zod
const result = validateRequestBody(body, schema)
if (!result.success) {
  // result.errors contains error array
}
```

### Responses
```typescript
// Success
createSuccessResponse({ user }, "User created")

// Error
createErrorResponse("Not found", 404, "NOT_FOUND")

// Pre-defined errors
ErrorResponses.UNAUTHORIZED
ErrorResponses.FORBIDDEN
ErrorResponses.NOT_FOUND
ErrorResponses.BAD_REQUEST
ErrorResponses.VALIDATION_ERROR
ErrorResponses.INTERNAL_SERVER_ERROR
```

---

## Common Queries

### Get user's bookings with pagination
```
GET /api/bookings?userOnly=true&page=1&limit=20
```

### Search destinations
```
GET /api/destinations?search=mountain&difficulty=hard&page=1
```

### Filter guides by location and price
```
GET /api/guides?location=Lahore&minPrice=1000&maxPrice=5000&minRating=4
```

### Get unread notifications
```
GET /api/notifications?unreadOnly=true&page=1&limit=50
```

### Get conversation messages
```
GET /api/messages?conversationId=userId123&paginate=true&page=1&limit=50
```

---

## MongoDB Aggregation Examples

### Calculate average rating
```typescript
const pipeline = [
  { $match: { guideId: new ObjectId(guideId) } },
  { $group: {
    _id: null,
    averageRating: { $avg: "$rating" },
    totalReviews: { $sum: 1 }
  }}
]

const [result] = await collection.aggregate(pipeline).toArray()
```

### Get monthly revenue
```typescript
const pipeline = [
  { $match: { paymentStatus: "paid" } },
  { $group: {
    _id: { 
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" }
    },
    revenue: { $sum: "$totalPrice" },
    bookings: { $sum: 1 }
  }},
  { $sort: { "_id.year": -1, "_id.month": -1 } }
]

const monthlyData = await collection.aggregate(pipeline).toArray()
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| BAD_REQUEST | 400 | Invalid request data |
| VALIDATION_ERROR | 400 | Request validation failed |
| ALREADY_EXISTS | 409 | Resource already exists |
| INTERNAL_SERVER_ERROR | 500 | Server error |
| TOO_MANY_REQUESTS | 429 | Rate limit exceeded |

---

## Environment Variables Required

```env
# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/trailmate

# JazzCash (Payment)
JAZZCASH_MERCHANT_ID=your-merchant-id
JAZZCASH_PASSWORD=your-password
JAZZCASH_INTEGRITY_SALT=your-salt
JAZZCASH_RETURN_URL=https://yourapp.com/payment/callback

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Testing with cURL

### Create booking
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -d '{
    "destinationId": "...",
    "startDate": "2024-06-01",
    "endDate": "2024-06-05",
    "travelers": 2
  }'
```

### Get paginated results
```bash
curl "http://localhost:3000/api/destinations?page=2&limit=10&search=mountain"
```

### Update booking status
```bash
curl -X PUT http://localhost:3000/api/bookings/BOOKING_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -d '{
    "status": "confirmed",
    "paymentStatus": "paid"
  }'
```

---

## Pro Tips

1. **Always use ObjectId for MongoDB IDs**: `new ObjectId(id)`
2. **Validate ObjectIds before queries**: Use `isValidObjectId(id)` to prevent crashes
3. **Check null before toString()**: `userId?.toString()` or check if exists first
4. **Use pagination for all list endpoints**: Protects against large dataset issues
5. **Add indexes before going to production**: See IMPROVEMENTS_SUMMARY.md for index list
6. **Sanitize user input**: Always use `sanitizeInput()` for text from users
7. **Use enum values**: Validate status values against allowed list
8. **Handle errors gracefully**: Use try-catch and return proper error responses
9. **Log important operations**: Use console.log for debugging, consider Winston for production
10. **Test edge cases**: Empty results, first/last page, invalid IDs, unauthorized access

---

## Common Pitfalls to Avoid

❌ **Don't** forget to await async operations
✅ **Do** use `await` with database operations

❌ **Don't** expose sensitive data in error messages
✅ **Do** use generic error messages for users, log details server-side

❌ **Don't** trust user input
✅ **Do** validate and sanitize all input

❌ **Don't** return unfiltered database documents
✅ **Do** use projection or explicitly return only needed fields

❌ **Don't** hardcode values
✅ **Do** use environment variables and constants

❌ **Don't** skip authentication checks
✅ **Do** verify tokens and ownership for all protected operations

❌ **Don't** use string concatenation for queries
✅ **Do** use parameterized queries and MongoDB operators

❌ **Don't** ignore TypeScript errors
✅ **Do** fix type issues properly

---

## Performance Checklist

- [ ] Add pagination to list endpoints
- [ ] Create database indexes
- [ ] Use projection to limit returned fields
- [ ] Implement caching for frequently accessed data
- [ ] Optimize MongoDB aggregation pipelines
- [ ] Use connection pooling
- [ ] Add rate limiting
- [ ] Compress API responses
- [ ] Use CDN for static assets
- [ ] Monitor query performance

---

## Security Checklist

- [ ] Validate all user input
- [ ] Sanitize text input to prevent XSS
- [ ] Use parameterized queries to prevent NoSQL injection
- [ ] Implement rate limiting
- [ ] Use HTTPS in production
- [ ] Set secure cookie flags (httpOnly, secure, sameSite)
- [ ] Verify JWT tokens on protected routes
- [ ] Check resource ownership before operations
- [ ] Don't expose stack traces to users
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Implement CORS properly

---

## Monitoring & Logging

Recommended tools:
- **Error tracking**: Sentry
- **Logging**: Winston or Pino
- **Performance**: New Relic or Datadog
- **Database**: MongoDB Atlas monitoring
- **Uptime**: UptimeRobot or Pingdom

Example Winston setup:
```typescript
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

// Usage
logger.info('Payment processed', { bookingId, amount })
logger.error('Payment failed', { error: error.message })
```

---

For more details, see [IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md)
