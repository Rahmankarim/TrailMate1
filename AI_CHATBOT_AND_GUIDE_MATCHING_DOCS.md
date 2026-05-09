# AI Chatbot & Guide Matching Implementation Guide

## Overview

This document provides comprehensive documentation for the two major features implemented:

1. **AI Chatbot Integration** - Enhanced with OpenAI and Grok LLM support
2. **Guide Matching System** - Intelligent guide discovery using cosine similarity

---

## 1. AI Chatbot Integration

### Architecture

The chatbot system consists of several components:

#### Files Created/Modified:

- `lib/chat/llm-provider.ts` - Multi-provider LLM abstraction layer
- `app/api/chat/route.ts` - Enhanced chat API endpoint with guide matching
- `components/chatbot/trailmate-chatbot.tsx` - Chatbot UI (existing)
- `.env.local` - Updated with LLM configuration

### Features

**Multi-Provider Support:**

- **Grok (X.AI)** - Default provider, fast responses
- **OpenAI** - Optional GPT-powered alternative (add API key to enable)
- Automatic fallback between providers

**Context-Aware Responses:**

```typescript
// System prompt automatically includes:
- User role (traveler, guide, company, admin)
- User preferences (interests, locations, languages)
- Conversation history (last 10 messages)
```

**Intelligent Intent Detection:**

- Navigation commands (`"go to bookings"`, `"/dashboard"`)
- Guide matching requests (`"find me a guide"`, `"recommend a guide"`)
- General travel queries
- Account/payment help
- Booking status checks

### Configuration

#### Using Grok (Default)

```env
LLM_PROVIDER=grok
GROK_API_KEY=REDACTED_GROK_API_KEY
GROK_MODEL=grok-2-latest
GROK_BASE_URL=https://api.x.ai/v1
```

#### Switching to OpenAI

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

### API Endpoints

**Chat Endpoint:**

```bash
POST /api/chat
Content-Type: application/json

{
  "message": "Find me a guide for trekking in Hunza",
  "sessionId": "uuid" // optional
}

Response:
{
  "sessionId": "uuid",
  "role": "traveler",
  "intent": "discover_guides",
  "reply": "I found 3 great guides that match your preferences!",
  "actions": [
    { "label": "Guide Name (95% match)", "href": "/guides/id" }
  ],
  "followUp": ["Ask about availability"]
}
```

### Usage Examples

**From Frontend (TypeScript/React):**

```typescript
// In chatbot component
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: userInput,
    sessionId: sessionId,
  }),
});

const data = await response.json();
```

**Travel-Related Queries:**

```
User: "Tell me about Hunza"
Bot: "Hunza is stunning! Known for Baltit Fort, Attabad Lake, Passu Cones..."

User: "How should I pack for trekking?"
Bot: "Pack layers, good trekking shoes, sun protection, first aid kit..."

User: "Find me an experienced guide"
Bot: "I'll help! Let me match you with guides based on your preferences..."

User: "Go to my bookings"
Bot: "Opening bookings. You can track and manage reservations here."
```

### LLM Provider Functions

**Core Functions in `lib/chat/llm-provider.ts`:**

```typescript
// Main LLM response generation
generateLLMResponse(
  userMessage: string,
  conversationHistory: LLMMessage[],
  systemPrompt: string,
  config?: Partial<LLMConfig>
): Promise<string | null>

// Build contextual system prompt
buildTrailMateSystemPrompt(
  userRole?: string,
  userPreferences?: Record<string, any>
): string

// Generate contextual travel response
generateContextualTravelResponse(
  userMessage: string,
  conversationHistory: LLMMessage[],
  userRole?: string,
  userPreferences?: Record<string, any>
): Promise<string | null>

// Generate guide recommendations
generateGuideRecommendationResponse(
  guideName: string,
  guideSpecialties: string[],
  guideLocation: string,
  guideRating: number,
  userPreferences: Record<string, any>
): Promise<string>

// Generate destination descriptions
generateDestinationDescription(
  destinationName: string,
  activities: string[],
  bestSeason: string,
  attractions?: string[]
): Promise<string>
```

---

## 2. Guide Matching System

### Architecture

The guide matching system uses **Cosine Similarity** and **Weighted Scoring** to find the best guide matches.

#### Files Created:

- `lib/db/models/guide-matching.ts` - Data models and types
- `lib/utils/guide-matching.ts` - Matching algorithm
- `app/api/guides/match/route.ts` - API endpoint
- `components/guides/guide-matching-ui.tsx` - Frontend components

### Algorithm Details

**Matching Factors (Weights):**

1. **Location Match** (20%) - Exact, partial, or no match
2. **Interest Match** (25%) - Cosine similarity of specialties
3. **Language Match** (15%) - Cosine similarity of languages
4. **Price Match** (15%) - Budget compatibility
5. **Experience Match** (15%) - Guide experience vs traveler skill level
6. **Certification Match** (10%) - Professional certifications

**Scoring Formula:**

```
totalScore =
  (locationMatch × 0.20) +
  (interestMatch × 0.25) +
  (languageMatch × 0.15) +
  (priceMatch × 0.15) +
  (experienceMatch × 0.15) +
  (certificationMatch × 0.10)

Score Range: 0 - 1.0 (0% - 100%)
```

**Cosine Similarity:**

```typescript
similarity = intersection_size / union_size

Example:
Traveler interests: ["Trekking", "Photography", "Culture"]
Guide specialties: ["Trekking", "Mountaineering", "Culture"]
Intersection: ["Trekking", "Culture"] = 2
Union: ["Trekking", "Photography", "Culture", "Mountaineering"] = 4
Similarity: 2/4 = 0.5 (50%)
```

### API Endpoints

**Get Matching Guides:**

```bash
GET /api/guides/match?limit=10&interests=Trekking,Photography&skillLevel=intermediate

Response:
{
  "success": true,
  "matches": [
    {
      "guide": { /* guide data */ },
      "matchScore": 0.92,
      "matchDetails": {
        "locationMatch": 100,
        "interestMatch": 95,
        "languageMatch": 100,
        "priceMatch": 85,
        "experienceMatch": 90,
        "certificationMatch": 80
      }
    }
  ],
  "totalMatches": 45,
  "preferences": { /* saved preferences */ }
}
```

**Save Matching Preferences:**

```bash
POST /api/guides/match
Content-Type: application/json

{
  "interests": ["Trekking", "Photography"],
  "languages": ["English", "Urdu"],
  "skillLevel": "intermediate",
  "location": ["Hunza", "Skardu"],
  "minPricePerDay": 0,
  "maxPricePerDay": 10000,
  "experience": "experienced",
  "certifications": ["Mountain Guide Certified"]
}

Response:
{
  "success": true,
  "preferences": { /* saved preferences */ }
}
```

### Database Collections

**guide_matching_preferences:**

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  interests: ["Trekking", "Photography"],
  languages: ["English", "Urdu"],
  skillLevel: "intermediate",
  location: ["Hunza"],
  maxPricePerDay: 10000,
  minPricePerDay: 0,
  experience: "experienced",
  certifications: ["Mountain Guide Certified"],
  createdAt: Date,
  updatedAt: Date
}
```

### Frontend Components

**GuideMatchingPreferencesForm Component:**

```typescript
<GuideMatchingPreferencesForm
  onSave={(preferences) => {
    // Save to API and refresh matches
  }}
  isLoading={isLoading}
/>
```

**GuideMatchResults Component:**

```typescript
<GuideMatchResults
  matches={matchResults}
  isLoading={isLoading}
  onRefresh={() => refetchMatches()}
/>
```

### Usage Flow

1. **User Sets Preferences:**
   - Select skill level (beginner, intermediate, advanced, expert)
   - Choose interests (trekking, photography, culture, etc.)
   - Select languages
   - Set preferred locations
   - Define price range

2. **System Calculates Matches:**
   - Retrieves all published, verified guides
   - Calculates match score for each guide
   - Filters guides with score > 0.3 (30%)
   - Sorts by highest score

3. **Results Displayed:**
   - Shows top matching guides
   - Displays match percentage
   - Shows detailed matching breakdown
   - Links to guide profiles

### Integration with Chatbot

The chatbot can trigger guide matching:

```
User: "Find me a guide for trekking"
Bot: [Detects guide matching intent]
     [Fetches user preferences from DB]
     [Calculates matches]
     [Returns top 3 matches with links]

User: "Recommend guides"
Bot: [Same process]

User: "I need an experienced guide"
Bot: [Saves preference]
     [Returns matching guides]
```

---

## 3. Database Schema Updates

### Add Indexes for Performance

```javascript
// In MongoDB Atlas or connection
db.collection("guide_matching_preferences").createIndex({ userId: 1 });
db.collection("guide_matching_preferences").createIndex({ createdAt: -1 });
db.collection("guides").createIndex({ isPublished: 1 });
db.collection("guides").createIndex({ isVerified: 1 });
db.collection("guides").createIndex({ location: "text", specialties: "text" });
```

---

## 4. Testing

### Test Chatbot Responses

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Find me a guide for trekking in Hunza",
    "sessionId": "test-session"
  }'
```

### Test Guide Matching

```bash
curl -X GET "http://localhost:3000/api/guides/match?interests=Trekking&skillLevel=intermediate&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test LLM Response

```typescript
import { generateContextualTravelResponse } from "@/lib/chat/llm-provider";

const response = await generateContextualTravelResponse(
  "Tell me about Pakistan travel",
  [],
  "traveler",
  { interests: ["Trekking"], languages: ["English"] },
);
console.log(response);
```

---

## 5. Performance Optimization

**Caching Strategy:**

- Cache guide profiles (TTL: 1 hour)
- Cache user preferences (invalidate on update)
- Batch guide matching requests

**Database Indexes:**

- `guides.isPublished` and `guides.isVerified`
- `guide_matching_preferences.userId`
- Text indexes on guide fields

**LLM Optimization:**

- Limit conversation history to 10 messages
- Use shorter max_tokens for faster responses
- Implement response caching for common queries

---

## 6. Error Handling

**Chatbot Error Cases:**

- No API key configured → Fallback to rule-based responses
- LLM timeout → Use fallback `buildTravelResponse()`
- Invalid user token → Return auth error
- Guide matching API down → Suggest browsing guides

**Guide Matching Error Cases:**

- No user preferences → Use default preferences
- No guides available → Return empty matches
- Invalid parameters → Return 400 error
- Database error → Return 500 error

---

## 7. Future Enhancements

1. **Real-time Matching:**
   - WebSocket updates for live guide availability
   - Real-time price changes

2. **Advanced Filtering:**
   - Guide availability calendar
   - Weather-based recommendations
   - Seasonal destination suggestions

3. **Machine Learning:**
   - Learn from user booking patterns
   - Improve match scoring over time
   - Predict user preferences

4. **Integration Points:**
   - WhatsApp chatbot
   - Telegram bot integration
   - SMS support

5. **Analytics:**
   - Track popular guide-traveler matches
   - Measure conversion rates
   - Analyze matching effectiveness

---

## 8. Troubleshooting

**Chatbot Not Responding:**

- Check `LLM_PROVIDER` environment variable
- Verify API key is valid
- Check network connectivity
- Review application logs

**Guide Matching Returns No Results:**

- Verify guides are published and verified
- Check user preferences are saved
- Lower minimum match score threshold
- Verify guide language/location match

**Slow Response Times:**

- Check database indexes
- Monitor API response times
- Consider caching strategies
- Scale LLM provider if needed

---

## Configuration Checklist

- [ ] MongoDB collection `guide_matching_preferences` created
- [ ] Database indexes added
- [ ] LLM_PROVIDER selected (grok or openai)
- [ ] API keys configured in `.env.local`
- [ ] Chatbot UI component mounted in layout
- [ ] Guide matching component integrated into guide pages
- [ ] API endpoints tested and working
- [ ] Error handling verified
- [ ] Performance monitoring enabled
- [ ] Documentation shared with team

---

## Support & Maintenance

For issues or questions:

1. Check logs: `app/api/chat/route.ts` and `app/api/guides/match/route.ts`
2. Review error responses from LLM providers
3. Verify database collections and indexes
4. Check user preferences and guide data quality
5. Monitor API usage and response times
