"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  Loader2,
  CloudSnow,
  Eye,
  Search,
  MapPinned,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

interface WeatherWidgetProps {
  location: string
  region?: string
  country?: string
}

interface LocationSuggestion {
  name: string
  region?: string
  country: string
  lat: number
  lon: number
  label: string
}

const getWeatherIcon = (condition: string) => {
  const upperCondition = condition.toUpperCase()

  if (upperCondition.includes("RAIN")) {
    return <CloudRain className="w-12 h-12 text-blue-500" />
  }
  if (upperCondition.includes("CLEAR") || upperCondition.includes("SUNNY")) {
    return <Sun className="w-12 h-12 text-yellow-500" />
  }
  if (upperCondition.includes("CLOUD")) {
    return <Cloud className="w-12 h-12 text-gray-500" />
  }
  if (upperCondition.includes("SNOW")) {
    return <CloudSnow className="w-12 h-12 text-blue-300" />
  }

  return <Cloud className="w-12 h-12 text-gray-500" />
}

export function WeatherWidget({ location, region, country }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchLocation, setSearchLocation] = useState("")
  const [searchRegion, setSearchRegion] = useState<string | undefined>(undefined)
  const [searchCountry, setSearchCountry] = useState<string | undefined>(undefined)
  const [searchInput, setSearchInput] = useState("")
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false)
  const [isManualSearching, setIsManualSearching] = useState(false)

  const isLocationNotFoundMessage = (message: string) => {
    return message.toLowerCase().includes("location not found")
  }

  const fetchWeather = async (override?: { location: string; region?: string; country?: string }) => {
    try {
      setIsLoading(true)
      setError(null)

      const targetLocation = override?.location || searchLocation || location
      const targetRegion = override?.region ?? searchRegion ?? region
      const targetCountry = override?.country ?? searchCountry ?? country

      const params = new URLSearchParams({ location: targetLocation })
      if (targetRegion) {
        params.set("region", targetRegion)
      }
      if (targetCountry) {
        params.set("country", targetCountry)
      }

      const response = await fetch(`/api/weather?${params.toString()}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        const message = result.message || "Failed to fetch weather"
        setWeather(null)
        setError(message)
        return
      }

      setWeather(result.data)
      setLastUpdated(new Date())
      if (override?.location) {
        setSearchLocation(override.location)
        setSearchRegion(override.region)
        setSearchCountry(override.country)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch weather data"
      if (!isLocationNotFoundMessage(message)) {
        console.error("Weather fetch error:", err)
      }
      setError(message)
      setWeather(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (location) {
      fetchWeather()
    }
  }, [location, region, country])

  useEffect(() => {
    let isCancelled = false

    async function fetchSuggestions() {
      const query = searchInput.trim()
      if (query.length < 2) {
        setSuggestions([])
        return
      }

      try {
        setIsSearchingSuggestions(true)
        const response = await fetch(`/api/weather?suggest=true&q=${encodeURIComponent(query)}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to fetch suggestions")
        }

        if (!isCancelled) {
          setSuggestions(Array.isArray(result.suggestions) ? result.suggestions : [])
        }
      } catch (suggestionError) {
        console.error("Suggestion fetch error:", suggestionError)
        if (!isCancelled) {
          setSuggestions([])
        }
      } finally {
        if (!isCancelled) {
          setIsSearchingSuggestions(false)
        }
      }
    }

    const timeout = setTimeout(fetchSuggestions, 300)

    return () => {
      isCancelled = true
      clearTimeout(timeout)
    }
  }, [searchInput])

  const handleRefresh = () => {
    fetchWeather()
  }

  const handleManualSearch = async () => {
    const trimmed = searchInput.trim()
    if (!trimmed) {
      return
    }

    try {
      setIsManualSearching(true)
      await fetchWeather({ location: trimmed })
    } finally {
      setIsManualSearching(false)
    }
  }

  const handleSuggestionClick = async (suggestion: LocationSuggestion) => {
    setSearchInput(suggestion.label)
    setSuggestions([])
    await fetchWeather({
      location: suggestion.name,
      region: suggestion.region,
      country: suggestion.country,
    })
  }

  const formatTime = (date: Date | null) => {
    if (!date) return ""
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Weather Update
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full border-orange-100 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
            <AlertTriangle className="w-5 h-5" />
            Weather Update
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-orange-100 border-orange-300">
            <AlertDescription className="text-orange-800">{error}</AlertDescription>
          </Alert>

          <div className="mt-3 space-y-2">
            <p className="text-xs text-orange-900">Search another location</p>
            <div className="flex gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search city (e.g. Skardu, Hunza)"
                className="bg-white"
              />
              <Button onClick={handleManualSearch} disabled={isManualSearching || !searchInput.trim()} size="sm">
                {isManualSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {isSearchingSuggestions && (
              <div className="text-xs text-orange-900 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading suggestions...
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="max-h-36 overflow-y-auto rounded-md border border-orange-200 bg-white">
                {suggestions.map((item) => (
                  <button
                    key={`${item.lat}-${item.lon}-${item.label}`}
                    type="button"
                    onClick={() => handleSuggestionClick(item)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 border-b last:border-b-0"
                  >
                    <span className="inline-flex items-center gap-2">
                      <MapPinned className="h-3.5 w-3.5 text-orange-700" />
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Try Original Location Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!weather) {
    return null
  }

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            Real-Time Weather
          </CardTitle>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Refresh weather"
          >
            <Loader2 className="w-4 h-4" />
          </Button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-500 mt-1">
            Updated at {formatTime(lastUpdated)}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs text-gray-600">Search weather for another location</p>
          <div className="flex gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search city (e.g. Skardu, Hunza)"
              className="bg-white"
            />
            <Button onClick={handleManualSearch} disabled={isManualSearching || !searchInput.trim()} size="sm" variant="secondary">
              {isManualSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {isSearchingSuggestions && (
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading suggestions...
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="max-h-36 overflow-y-auto rounded-md border border-blue-100 bg-white">
              {suggestions.map((item) => (
                <button
                  key={`${item.lat}-${item.lon}-${item.label}`}
                  type="button"
                  onClick={() => handleSuggestionClick(item)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b last:border-b-0"
                >
                  <span className="inline-flex items-center gap-2">
                    <MapPinned className="h-3.5 w-3.5 text-blue-700" />
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Temperature Section */}
        <div className="flex items-center justify-between bg-white rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div>{getWeatherIcon(weather.condition)}</div>
            <div>
              <div className="text-4xl font-bold text-gray-900">{weather.temp}°C</div>
              <div className="text-sm text-gray-600 capitalize">{weather.description}</div>
              <div className="text-xs text-gray-500">Feels like {weather.feelsLike}°C</div>
            </div>
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Humidity */}
          <div className="bg-white rounded-lg p-3 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-gray-500">Humidity</div>
              <div className="text-sm font-semibold text-gray-900">{weather.humidity}%</div>
            </div>
          </div>

          {/* Wind Speed */}
          <div className="bg-white rounded-lg p-3 flex items-center gap-2">
            <Wind className="w-5 h-5 text-cyan-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-gray-500">Wind</div>
              <div className="text-sm font-semibold text-gray-900">{weather.windSpeed} m/s</div>
            </div>
          </div>

          {/* Pressure */}
          <div className="bg-white rounded-lg p-3 flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-gray-500">Pressure</div>
              <div className="text-sm font-semibold text-gray-900">{weather.pressure} mb</div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg p-3 flex items-center gap-2">
            <Sun className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-gray-500">Location</div>
              <div className="text-sm font-semibold text-gray-900 truncate">{weather.location}</div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="text-xs text-gray-600 bg-white rounded-lg p-2 text-center border border-blue-100">
          Weather data auto-updates every 30 minutes
        </div>
      </CardContent>
    </Card>
  )
}
