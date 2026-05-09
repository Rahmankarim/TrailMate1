/**
 * Enhanced LLM utility supporting both OpenAI and Grok
 * Handles multi-turn conversations with context
 */

export type LLMProvider = "openai" | "grok"
export type LLMModel = "gpt-4" | "gpt-3.5-turbo" | "grok-2-latest" | "grok-4.20-reasoning"

export interface LLMMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface LLMResponse {
  content: string
  tokens?: {
    prompt: number
    completion: number
    total: number
  }
}

export interface LLMConfig {
  provider: LLMProvider
  model: LLMModel
  apiKey: string
  baseUrl?: string
  maxTokens?: number
  temperature?: number
}

/**
 * Generate OpenAI response
 */
async function generateOpenAIResponse(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<LLMResponse | null> {
  if (!config.apiKey) return null

  try {
    const baseUrl = config.baseUrl || "https://api.openai.com/v1"
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || "gpt-3.5-turbo",
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 500,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("OpenAI API error:", error)
      return null
    }

    const data = (await response.json()) as any
    return {
      content: data?.choices?.[0]?.message?.content?.trim() || "",
      tokens: {
        prompt: data?.usage?.prompt_tokens || 0,
        completion: data?.usage?.completion_tokens || 0,
        total: data?.usage?.total_tokens || 0,
      },
    }
  } catch (error) {
    console.error("OpenAI request error:", error)
    return null
  }
}

/**
 * Generate Grok response
 */
async function generateGrokResponse(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<LLMResponse | null> {
  if (!config.apiKey) return null

  try {
    const baseUrl = config.baseUrl || "https://api.x.ai/v1"
    // Detect fine-tuned model if available (optional)
    let model = config.model || "grok-2-latest"
    // Fine-tuned model check skipped in production build

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 500,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Grok API error:", error)
      return null
    }

    const data = (await response.json()) as any
    return {
      content: data?.choices?.[0]?.message?.content?.trim() || "",
      tokens: {
        prompt: data?.usage?.prompt_tokens || 0,
        completion: data?.usage?.completion_tokens || 0,
        total: data?.usage?.total_tokens || 0,
      },
    }
  } catch (error) {
    console.error("Grok request error:", error)
    return null
  }
}

/**
 * Main function to get LLM response with context
 */
export async function generateLLMResponse(
  userMessage: string,
  conversationHistory: LLMMessage[] = [],
  systemPrompt: string,
  config: Partial<LLMConfig> = {}
): Promise<string | null> {
  // Use environment variables as fallback
  const provider = (config.provider || process.env.LLM_PROVIDER || "grok") as LLMProvider
  const apiKey =
    config.apiKey ||
    (provider === "openai" ? process.env.OPENAI_API_KEY : process.env.GROK_API_KEY)

  if (!apiKey) {
    console.error(`No API key found for ${provider}`)
    return null
  }

  const fullConfig: LLMConfig = {
    provider,
    model: config.model || (provider === "openai" ? "gpt-3.5-turbo" : "grok-2-latest"),
    apiKey,
    baseUrl: config.baseUrl,
    maxTokens: config.maxTokens ?? 500,
    temperature: config.temperature ?? 0.7,
  }

  // Build messages with history
  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-10), // Keep last 10 messages for context
    { role: "user", content: userMessage },
  ]

  if (provider === "openai") {
    const response = await generateOpenAIResponse(messages, fullConfig)
    return response?.content || null
  } else if (provider === "grok") {
    const response = await generateGrokResponse(messages, fullConfig)
    return response?.content || null
  }

  return null
}

/**
 * Build system prompt for TrailMate AI assistant
 */
export function buildTrailMateSystemPrompt(
  userRole?: string,
  userPreferences?: Record<string, any>
): string {
  let prompt = `You are TrailMate, a professional AI travel assistant specializing in adventure tourism in Pakistan. 

Core characteristics:
- Be helpful, friendly, and concise (under 150 words per response)
- Provide accurate travel information about Pakistan
- Recommend destinations, guides, activities, and travel tips
- Support users in multiple contexts: travel planning, booking assistance, payment help, messaging

Key responsibilities:
- Answer travel questions about Pakistani destinations
- Help users discover guides and bookings
- Provide safety and packing advice
- Suggest itineraries based on preferences
- Handle navigation requests to app pages`

  if (userRole) {
    prompt += `\n\nUser Role: ${userRole}`
    if (userRole === "traveler") {
      prompt += `\n- Help with destination discovery and booking
- Assist with guide selection and hiring
- Support payment and reservation tracking`
    } else if (userRole === "guide") {
      prompt += `\n- Discuss earnings and bookings
- Help manage availability and schedules
- Support guide portfolio optimization`
    } else if (userRole === "company") {
      prompt += `\n- Assist with destination publishing
- Support team and revenue management
- Help with guide hiring for corporate events`
    }
  }

  if (userPreferences) {
    if (userPreferences.interests?.length) {
      prompt += `\n\nUser Interests: ${userPreferences.interests.join(", ")}`
    }
    if (userPreferences.location?.length) {
      prompt += `\nPreferred Locations: ${userPreferences.location.join(", ")}`
    }
    if (userPreferences.languages?.length) {
      prompt += `\nLanguages: ${userPreferences.languages.join(", ")}`
    }
  }

  prompt += `\n\nAlways be encouraging about Pakistan travel and ensure responses align with TrailMate's mission of safe, sustainable adventure tourism.`

  return prompt
}

/**
 * Parse user intent and generate contextual response
 */
export async function generateContextualTravelResponse(
  userMessage: string,
  conversationHistory: LLMMessage[] = [],
  userRole?: string,
  userPreferences?: Record<string, any>
): Promise<string | null> {
  const systemPrompt = buildTrailMateSystemPrompt(userRole, userPreferences)
  const { buildTrainingContext } = await import("@/lib/ai/local-training-context")
  const trainingContext = buildTrainingContext(userMessage, 3)
  const enhancedSystemPrompt = trainingContext
    ? `${systemPrompt}\n\nUse these TrailMate examples as style and knowledge references:\n${trainingContext}`
    : systemPrompt

  return generateLLMResponse(userMessage, conversationHistory, enhancedSystemPrompt)
}

/**
 * Generate a guide recommendation response
 */
export async function generateGuideRecommendationResponse(
  guideName: string,
  guideSpecialties: string[],
  guideLocation: string,
  guideRating: number,
  userPreferences: Record<string, any> = {}
): Promise<string> {
  const systemPrompt = `You are a helpful TrailMate assistant. Briefly recommend a guide (under 80 words).
Focus on why this guide matches the user's interests.`

  const message = `Recommend this guide: ${guideName} from ${guideLocation} (${guideRating}★). Specializes in: ${guideSpecialties.join(", ")}. User interests: ${userPreferences.interests?.join(", ") || "adventure tourism"}`

  const response = await generateLLMResponse(message, [], systemPrompt)
  return response || `${guideName} is an excellent choice! They specialize in ${guideSpecialties.slice(0, 2).join(" and ")} in ${guideLocation}.`
}

/**
 * Generate destination description
 */
export async function generateDestinationDescription(
  destinationName: string,
  activities: string[],
  bestSeason: string,
  attractions: string[] = []
): Promise<string> {
  const systemPrompt = `You are a TrailMate travel expert. Write a brief, engaging description (under 100 words) of a destination.`

  const message = `Create a travel description for ${destinationName}. Activities: ${activities.join(", ")}. Best time: ${bestSeason}. Attractions: ${attractions.join(", ")}`

  const response = await generateLLMResponse(message, [], systemPrompt)
  return (
    response ||
    `${destinationName} is a stunning destination perfect for ${activities.slice(0, 2).join(" and ")}. Best visited during ${bestSeason}.`
  )
}
