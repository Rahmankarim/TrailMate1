"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { Plus, Search, Edit, Trash2, Eye, EyeOff, MapPin, DollarSign, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

interface Destination {
  _id: string
  name: string
  slug: string
  location: string
  coverImage: string
  price: number
  duration: string
  difficulty: string
  isPublished: boolean
  createdAt: string
}

export default function GuideDestinationsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchDestinations() {
      try {
        const res = await fetch("/api/destinations?userOnly=true")
        if (res.ok) {
          const data = await res.json()
          setDestinations(data.destinations || [])
        }
      } catch (error) {
        console.error("Error fetching destinations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchDestinations()
    }
  }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this destination?")) return

    try {
      const res = await fetch(`/api/destinations/${id}`, { method: "DELETE" })
      if (res.ok) {
        setDestinations((prev) => prev.filter((d) => d._id !== id))
      }
    } catch (error) {
      console.error("Error deleting destination:", error)
    }
  }

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/destinations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentStatus }),
      })
      if (res.ok) {
        setDestinations((prev) => prev.map((d) => (d._id === id ? { ...d, isPublished: !currentStatus } : d)))
      }
    } catch (error) {
      console.error("Error updating destination:", error)
    }
  }

  const filteredDestinations = destinations.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-secondary items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar role="guide" user={{ name: user?.name || "Guide", email: user?.email || "" }} />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="My Destinations" />

        <main className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">My Tours & Destinations</h2>
              <p className="text-muted-foreground">Manage your tour packages</p>
            </div>
            <Link href="/dashboard/guide/destinations/new">
              <Button className="bg-foreground text-background hover:bg-foreground/90">
                <Plus className="h-4 w-4 mr-2" />
                Add New Destination
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Destinations Grid */}
          {filteredDestinations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No destinations yet</h3>
                <p className="text-muted-foreground mb-4">Create your first tour package to get started</p>
                <Link href="/dashboard/guide/destinations/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Destination
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDestinations.map((destination) => (
                <Card key={destination._id} className="overflow-hidden">
                  <div className="relative h-48">
                    <img
                      src={destination.coverImage || "/placeholder.svg?height=192&width=384&query=mountain landscape"}
                      alt={destination.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge
                      className={`absolute top-3 right-3 ${
                        destination.isPublished ? "bg-green-600 text-white" : "bg-yellow-600 text-white"
                      }`}
                    >
                      {destination.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground text-lg mb-1">{destination.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>{destination.location}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">${destination.price}</span>
                        <span className="text-sm text-muted-foreground">/person</span>
                      </div>
                      <Badge variant="outline">{destination.duration}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/guide/destinations/${destination._id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublish(destination._id, destination.isPublished)}
                      >
                        {destination.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive bg-transparent"
                        onClick={() => handleDelete(destination._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
