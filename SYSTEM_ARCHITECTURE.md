# System Architecture Diagram

## Overall TrailMate AI System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TRAILMATE CHATBOT & GUIDE MATCHING                │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │   USER (Chat)    │
                              └────────┬─────────┘
                                       │
                                       ▼
                        ┌──────────────────────────┐
                        │   Chatbot UI Component   │
                        │  (floating widget)       │
                        └────────┬─────────────────┘
                                 │
                                 ▼
                     ┌────────────────────────┐
                     │  POST /api/chat        │
                     │  (Message processing)  │
                     └────────┬───────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌─────────────────────┐  ┌────────────────────┐
        │   Intent Detection  │  │  User Auth Check   │
        │  - Navigation       │  │  (JWT Validation)  │
        │  - Booking          │  │  (Role Check)      │
        │  - Guide Matching   │  │  (Preferences)     │
        └────────┬────────────┘  └────────┬───────────┘
                 │                        │
                 └────────┬───────────────┘
                          │
                ┌─────────┴──────────┐
                │                    │
                ▼                    ▼
    ┌────────────────────┐  ┌───────────────────┐
    │ Simple Response    │  │ Complex Response  │
    │ (Rule-Based)       │  │ (LLM-Powered)     │
    └────────┬───────────┘  └────────┬──────────┘
             │                       │
             │              ┌────────┴────────┐
             │              │                 │
             │              ▼                 ▼
             │    ┌─────────────────┐ ┌──────────────┐
             │    │  Grok (X.AI)    │ │  OpenAI GPT  │
             │    │  (Default)      │ │  (Optional)  │
             │    └────────┬────────┘ └────────┬─────┘
             │             │                   │
             │             └───────┬───────────┘
             │                     │
             └─────────────────────┴────────────┐
                                               │
                                               ▼
                        ┌──────────────────────────────┐
                        │   Chat Response Payload      │
                        │  - reply                     │
                        │  - intent                    │
                        │  - actions                   │
                        │  - cards                     │
                        │  - followUp                  │
                        └──────────────────────────────┘


GUIDE MATCHING SUBSYSTEM:
════════════════════════════════════════════════════════════════════════════

                    ┌─────────────────────┐
                    │  User Preferences   │
                    │  (Set or Auto-infer)│
                    └────────┬────────────┘
                             │
                    ┌────────┴──────────┐
                    │                   │
                    ▼                   ▼
        ┌─────────────────────┐  ┌──────────────────┐
        │ GET /api/guides/match│  │ POST (Save Prefs)│
        └────────┬────────────┘  └──────────────────┘
                 │
    ┌────────────┴──────────────┐
    │                           │
    ▼                           ▼
┌─────────────────┐  ┌────────────────────┐
│ Load Preferences│  │ Fetch All Guides   │
│ from MongoDB    │  │ (Published+Verified)│
└────────┬────────┘  └────────┬───────────┘
         │                    │
         └────────┬───────────┘
                  │
                  ▼
    ┌──────────────────────────────┐
    │ Matching Algorithm (for each │
    │ guide):                      │
    │                              │
    │ 1. Location Similarity       │
    │ 2. Interest/Specialty Match  │
    │ 3. Language Similarity       │
    │ 4. Price Range Check         │
    │ 5. Experience Level Match    │
    │ 6. Certification Overlap     │
    │                              │
    │ → Calculate Weighted Score   │
    └──────────────────────────────┘
                  │
                  ▼
    ┌──────────────────────────────┐
    │ Filter (Score > 0.3)         │
    │ Sort by Score (DESC)         │
    │ Return Top N Matches         │
    └──────────────────────────────┘
                  │
                  ▼
    ┌──────────────────────────────────┐
    │ Response with Match Results      │
    │ - Guide Profile                  │
    │ - Match Score (%)                │
    │ - Match Breakdown                │
    │ - Action Links                   │
    └──────────────────────────────────┘


DATA FLOW: Chat Message → Guide Matching
════════════════════════════════════════════════════════════════════════════

1. User asks: "Find me a trekking guide"
                          ▼
2. Chat intent = "discover_guides"
                          ▼
3. If traveler role:
   - Load user preferences (or ask for input)
   - Trigger guide matching endpoint
   - Fetch top 3 matches
                          ▼
4. Return results in chat:
   - "I found X guides matching your preferences"
   - Links to top matching guides
   - Show match percentages


DATABASE SCHEMA
════════════════════════════════════════════════════════════════════════════

guides (existing):
{
  _id, userId, name, email, phone,
  bio, shortBio, profileImage, coverImage,
  location, languages[], specialties[],
  experience, certifications[],
  pricePerDay, availability, rating,
  reviewCount, totalTours,
  isVerified, isPublished,
  socialLinks, createdAt, updatedAt
}

guide_matching_preferences (new):
{
  _id, userId,
  interests[],
  languages[],
  skillLevel,           // beginner|intermediate|advanced|expert
  location[],
  minPricePerDay,
  maxPricePerDay,
  experience,           // all|experienced|highly-experienced
  certifications[],
  createdAt, updatedAt
}

chat_sessions (existing):
{
  sessionId, userId, role,
  history[],            // Last 10 messages
  metadata,
  createdAt, updatedAt
}


KEY ALGORITHMS
════════════════════════════════════════════════════════════════════════════

Cosine Similarity (for arrays):
─────────────────
intersection_size / union_size

Example:
  traveler_interests = ["Trekking", "Photography", "Culture"]
  guide_specialties = ["Trekking", "Mountaineering", "Culture"]
  intersection = ["Trekking", "Culture"] = 2 items
  union = ["Trekking", "Photography", "Culture", "Mountaineering"] = 4 items
  similarity = 2/4 = 0.5 (50%)

Weighted Score (for guide matching):
─────────────────
score = (location×0.20) + (interests×0.25) + (language×0.15) +
        (price×0.15) + (experience×0.15) + (certification×0.10)

Final score: 0-1 (0%-100%)


INTEGRATION POINTS
════════════════════════════════════════════════════════════════════════════

1. Chatbot Widget
   └─ Displays in all pages via layout
   └─ Can trigger guide matching on user input

2. Guide Browse Page (/guides)
   └─ Uses GuideMatchingPreferencesForm
   └─ Displays GuideMatchResults

3. User Dashboard
   └─ Option to set matching preferences
   └─ View previously matched guides

4. API Layer
   └─ /api/chat - Main chatbot endpoint
   └─ /api/guides/match - Guide matching endpoint
   └─ Both authenticated with JWT

5. Database
   └─ MongoDB collections auto-created
   └─ Preferences auto-saved on first use


RESPONSE EXAMPLES
════════════════════════════════════════════════════════════════════════════

Chat Response (Guide Matching Intent):
{
  "sessionId": "uuid",
  "role": "traveler",
  "intent": "discover_guides",
  "reply": "I found 3 great guides that match your preferences!",
  "actions": [
    { "label": "Ali (95% match)", "href": "/guides/guide-id-1" },
    { "label": "Sara (88% match)", "href": "/guides/guide-id-2" },
    { "label": "Khan (85% match)", "href": "/guides/guide-id-3" }
  ],
  "followUp": ["Ask about availability", "Check reviews"]
}

Guide Matching API Response:
{
  "success": true,
  "matches": [
    {
      "guide": { /* full guide object */ },
      "matchScore": 0.95,
      "matchDetails": {
        "locationMatch": 100,
        "interestMatch": 100,
        "languageMatch": 100,
        "priceMatch": 95,
        "experienceMatch": 90,
        "certificationMatch": 80
      }
    },
    // ... more guides
  ],
  "totalMatches": 45,
  "preferences": { /* user preferences */ }
}


ERROR HANDLING FLOW
════════════════════════════════════════════════════════════════════════════

Chat Error:
  LLM API Down → Try Fallback LLM → Use Rule-Based Response → Generic Reply

Guide Matching Error:
  DB Error → Return Empty Results
  No Preferences → Use Defaults
  No Guides → Return Empty Matches
  Invalid Params → Return 400 Error


PERFORMANCE OPTIMIZATION
════════════════════════════════════════════════════════════════════════════

1. Caching:
   - Guide list (1 hour TTL)
   - User preferences (until updated)
   - LLM responses (for common questions)

2. Indexing:
   - guides.isPublished
   - guides.isVerified
   - guide_matching_preferences.userId
   - Text indexes for full-text search

3. Batching:
   - Multiple preference updates combined
   - Bulk guide fetching

4. Limits:
   - Max 10 conversation history entries
   - Max 500 tokens per LLM response
   - Max 100 guides per match request

