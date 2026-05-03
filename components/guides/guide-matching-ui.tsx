import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { GuideMatchResult } from "@/lib/db/models/guide-matching"

interface GuideMatchingFormProps {
  onSave?: (preferences: any) => void
  isLoading?: boolean
}

export function GuideMatchingPreferencesForm({ onSave, isLoading = false }: GuideMatchingFormProps) {
  const [interests, setInterests] = useState<string[]>(["Trekking", "Sightseeing"])
  const [languages, setLanguages] = useState<string[]>(["English", "Urdu"])
  const [skillLevel, setSkillLevel] = useState<"beginner" | "intermediate" | "advanced" | "expert">("intermediate")
  const [locations, setLocations] = useState<string[]>(["Hunza", "Skardu"])
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(10000)

  const handleAddInterest = (interest: string) => {
    if (interest && !interests.includes(interest)) {
      setInterests([...interests, interest])
    }
  }

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest))
  }

  const handleSave = () => {
    onSave?.({
      interests,
      languages,
      skillLevel,
      location: locations,
      minPricePerDay: minPrice,
      maxPricePerDay: maxPrice,
    })
  }

  const commonInterests = ["Trekking", "Mountaineering", "Sightseeing", "Culture", "Adventure", "Photography", "Wildlife", "Beach"]
  const commonLanguages = ["English", "Urdu", "Punjabi", "Pashto"]
  const commonLocations = ["Hunza", "Skardu", "Fairy Meadows", "Lahore", "Islamabad", "Naran", "Gilgit"]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guide Matching Preferences</CardTitle>
        <CardDescription>Set your preferences to find the perfect guide for your adventure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Skill Level */}
        <div className="space-y-3">
          <Label>Skill Level</Label>
          <select
            value={skillLevel}
            onChange={e => setSkillLevel(e.target.value as any)}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        {/* Interests */}
        <div className="space-y-3">
          <Label>Interests</Label>
          <div className="flex flex-wrap gap-2">
            {interests.map(interest => (
              <Badge key={interest} variant="secondary">
                {interest}
                <button
                  onClick={() => handleRemoveInterest(interest)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            {commonInterests
              .filter(i => !interests.includes(i))
              .map(interest => (
                <Button
                  key={interest}
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddInterest(interest)}
                >
                  + {interest}
                </Button>
              ))}
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-3">
          <Label>Languages</Label>
          <div className="flex flex-wrap gap-2">
            {languages.map(lang => (
              <Badge key={lang} variant="outline">
                {lang}
                <button
                  onClick={() => setLanguages(languages.filter(l => l !== lang))}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            {commonLanguages
              .filter(l => !languages.includes(l))
              .map(lang => (
                <Button
                  key={lang}
                  size="sm"
                  variant="outline"
                  onClick={() => setLanguages([...languages, lang])}
                >
                  + {lang}
                </Button>
              ))}
          </div>
        </div>

        {/* Preferred Locations */}
        <div className="space-y-3">
          <Label>Preferred Locations</Label>
          <div className="flex flex-wrap gap-2">
            {locations.map(loc => (
              <Badge key={loc} variant="outline">
                {loc}
                <button
                  onClick={() => setLocations(locations.filter(l => l !== loc))}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {commonLocations
              .filter(l => !locations.includes(l))
              .map(loc => (
                <Button
                  key={loc}
                  size="sm"
                  variant="outline"
                  onClick={() => setLocations([...locations, loc])}
                >
                  + {loc}
                </Button>
              ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <Label>Price Range (PKR per day)</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Minimum</Label>
              <Input
                type="number"
                value={minPrice}
                onChange={e => setMinPrice(parseFloat(e.target.value))}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">Maximum</Label>
              <Input
                type="number"
                value={maxPrice}
                onChange={e => setMaxPrice(parseFloat(e.target.value))}
                placeholder="50000"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save Preferences & Find Guides"}
        </Button>
      </CardContent>
    </Card>
  )
}

interface GuideMatchResultsProps {
  matches: GuideMatchResult[]
  isLoading?: boolean
  onRefresh?: () => void
}

export function GuideMatchResults({ matches, isLoading = false, onRefresh }: GuideMatchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Finding your perfect guides...</p>
        </div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No matching guides found. Try adjusting your preferences.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {matches.map((match, idx) => (
        <Card key={idx} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{match.guide.name}</h3>
                  <Badge variant="default">{Math.round(match.matchScore * 100)}% Match</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{match.guide.shortBio}</p>
                
                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium">{match.guide.location}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price:</span>
                    <p className="font-medium">PKR {match.guide.pricePerDay}/day</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Experience:</span>
                    <p className="font-medium">{match.guide.experience} years</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rating:</span>
                    <p className="font-medium">{match.guide.rating?.toFixed(1) || "New"} ⭐</p>
                  </div>
                </div>

                {/* Match Details */}
                <div className="bg-muted p-2 rounded text-xs space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span>Location Match:</span>
                    <span className="font-medium">{match.matchDetails.locationMatch}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest Match:</span>
                    <span className="font-medium">{match.matchDetails.interestMatch}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Language Match:</span>
                    <span className="font-medium">{match.matchDetails.languageMatch}%</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {match.guide.specialties?.slice(0, 3).map((spec: string) => (
                    <Badge key={spec} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button asChild>
                <a href={`/guides/${match.guide._id}`}>View Profile</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {onRefresh && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onRefresh}>
            Refresh Results
          </Button>
        </div>
      )}
    </div>
  )
}
