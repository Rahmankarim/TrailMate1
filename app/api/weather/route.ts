import { type NextRequest, NextResponse } from "next/server"

interface WeatherData {
  temp: number
  feelsLike: number
  condition: string
  description: string
  humidity: number
  windSpeed: number
  icon: string
  pressure: number
  location: string
}

interface LocationSuggestion {
  name: string
  region?: string
  country: string
  lat: number
  lon: number
  label: string
}

// Simple in-memory cache with 30-minute TTL
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes in milliseconds

function getCachedWeather(cacheKey: string): WeatherData | null {
  const cached = weatherCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  weatherCache.delete(cacheKey)
  return null
}

function setCachedWeather(cacheKey: string, data: WeatherData) {
  weatherCache.set(cacheKey, { data, timestamp: Date.now() })
}

function createLocationCandidates(location: string, region?: string, country?: string): string[] {
  const safeLocation = location.trim()
  const safeRegion = region?.trim()
  const safeCountry = country?.trim()
  const basePart = safeLocation.split(",")[0]?.trim() || safeLocation

  const candidates = [
    safeLocation,
    safeRegion ? `${safeLocation}, ${safeRegion}` : "",
    safeCountry ? `${safeLocation}, ${safeCountry}` : "",
    safeRegion && safeCountry ? `${safeLocation}, ${safeRegion}, ${safeCountry}` : "",
    basePart,
    safeCountry ? `${basePart}, ${safeCountry}` : "",
    safeRegion ? `${basePart}, ${safeRegion}` : "",
    safeRegion && safeCountry ? `${basePart}, ${safeRegion}, ${safeCountry}` : "",
  ].filter(Boolean)

  return Array.from(new Set(candidates))
}

async function fetchWeatherByQuery(query: string, apiKey: string) {
  return fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${apiKey}&units=metric`
  )
}

async function fetchWeatherByCoordinates(lat: number, lon: number, apiKey: string) {
  return fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
  )
}

async function resolveCoordinates(locationCandidates: string[], apiKey: string) {
  for (const candidate of locationCandidates) {
    const geoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(candidate)}&limit=1&appid=${apiKey}`
    )

    if (!geoResponse.ok) {
      continue
    }

    const geoData = await geoResponse.json()
    if (Array.isArray(geoData) && geoData.length > 0) {
      return {
        lat: geoData[0].lat,
        lon: geoData[0].lon,
      }
    }
  }

  return null
}

function buildSuggestionLabel(name: string, region: string | undefined, country: string) {
  const parts = [name]
  if (region) {
    parts.push(region)
  }
  parts.push(country)
  return parts.join(", ")
}

async function fetchLocationSuggestions(query: string, apiKey: string): Promise<LocationSuggestion[]> {
  const response = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`
  )

  if (!response.ok) {
    throw new Error(`OpenWeatherMap Geocoding API error: ${response.status}`)
  }

  const data = await response.json()
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((item) => {
    const name = item.name as string
    const region = item.state as string | undefined
    const country = item.country as string
    return {
      name,
      region,
      country,
      lat: item.lat as number,
      lon: item.lon as number,
      label: buildSuggestionLabel(name, region, country),
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const suggestMode = searchParams.get("suggest") === "true"
    const searchQuery = searchParams.get("q")?.trim() || ""
    const location = searchParams.get("location")
    const region = searchParams.get("region") || undefined
    const country = searchParams.get("country") || undefined

    const apiKey = process.env.NEXT_PUBLIC_OPENWEAT
    if (!apiKey) {
      console.error("OpenWeatherMap API key not configured")
      return NextResponse.json(
        {
          success: false,
          message: "Weather service not configured. Please set NEXT_PUBLIC_OPENWEAT",
        },
        { status: 500 }
      )
    }

    if (suggestMode) {
      if (!searchQuery) {
        return NextResponse.json({ success: true, suggestions: [] })
      }

      const suggestions = await fetchLocationSuggestions(searchQuery, apiKey)
      return NextResponse.json({ success: true, suggestions })
    }

    if (!location) {
      return NextResponse.json(
        { success: false, message: "Location parameter is required" },
        { status: 400 }
      )
    }

    const cacheKey = `${location}||${region || ""}||${country || ""}`

    // Check cache first
    const cachedWeather = getCachedWeather(cacheKey)
    if (cachedWeather) {
      return NextResponse.json({
        success: true,
        data: cachedWeather,
        cached: true,
      })
    }

    const locationCandidates = createLocationCandidates(location, region, country)
    let weatherResponse: Response | null = null

    // Try direct city-name lookups first.
    for (const candidate of locationCandidates) {
      const response = await fetchWeatherByQuery(candidate, apiKey)
      if (response.ok) {
        weatherResponse = response
        break
      }

      if (response.status !== 404) {
        throw new Error(`OpenWeatherMap API error: ${response.status}`)
      }
    }

    // If no direct match found, use geocoding and then fetch by coordinates.
    if (!weatherResponse) {
      const coordinates = await resolveCoordinates(locationCandidates, apiKey)
      if (!coordinates) {
        return NextResponse.json(
          { success: false, message: "Location not found" },
          { status: 404 }
        )
      }

      const response = await fetchWeatherByCoordinates(coordinates.lat, coordinates.lon, apiKey)
      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status}`)
      }

      weatherResponse = response
    }

    const weatherData = await weatherResponse.json()

    const formattedData: WeatherData = {
      temp: Math.round(weatherData.main.temp),
      feelsLike: Math.round(weatherData.main.feels_like),
      condition: weatherData.weather[0].main,
      description: weatherData.weather[0].description,
      humidity: weatherData.main.humidity,
      windSpeed: Math.round(weatherData.wind.speed * 10) / 10,
      icon: weatherData.weather[0].icon,
      pressure: weatherData.main.pressure,
      location: weatherData.name,
    }

    // Cache the result
    setCachedWeather(cacheKey, formattedData)

    return NextResponse.json({
      success: true,
      data: formattedData,
      cached: false,
    })
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch weather data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
