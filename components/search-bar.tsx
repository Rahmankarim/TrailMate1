"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface Destination {
  name: string
  rating: number
  travelers: number
  image: string
  description: string
}

interface SearchBarProps {
  destinations?: Destination[]
}

export default function SearchBar({ destinations = [] }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Destination[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length > 0) {
      const filtered = destinations.filter((dest) => dest.name.toLowerCase().includes(query.toLowerCase()))
      setSuggestions(filtered)
      setIsOpen(true)
    } else {
      setSuggestions([])
      setIsOpen(false)
    }
  }, [query, destinations])

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/destinations?search=${encodeURIComponent(query)}`)
    } else {
      router.push("/destinations")
    }
  }

  const handleSuggestionClick = (destination: Destination) => {
    const slug = destination.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    router.push(`/eco-adventure/${slug}`)
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl">
      <div className="flex items-center gap-2 p-2 bg-card border border-border rounded-2xl shadow-lg">
        <div className="flex-1 flex items-center gap-2 px-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search destinations, guides, or experiences..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button onClick={handleSearch} className="bg-foreground text-background hover:bg-foreground/90 rounded-xl px-6">
          Search
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {suggestions.map((destination, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(destination)}
              className="w-full flex items-center gap-4 p-4 hover:bg-accent transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={destination.image || "/placeholder.svg?height=48&width=48&query=mountain landscape"}
                  alt={destination.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium text-foreground">{destination.name}</p>
                <p className="text-sm text-muted-foreground">{destination.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
