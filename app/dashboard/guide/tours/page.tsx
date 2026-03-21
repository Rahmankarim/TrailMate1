"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { Plus, Search, Loader2, MapPin, Eye, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Tour {
  _id: string
  name: string
  location: string
  price: number
  coverImage: string
  isPublished: boolean
  createdAt: string
}

export default function GuideToursPage() {
  const { user } = useAuth()
  const [tours, setTours] = useState<Tour[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchTours()
  }, [])

  const fetchTours = async () => {
    try {
      const res = await fetch("/api/destinations?userOnly=true", {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setTours(data.destinations || [])
      }
    } catch (error) {
      console.error("Error fetching tours:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tour?")) return

    try {
      const res = await fetch(`/api/destinations/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (res.ok) {
        fetchTours()
      }
    } catch (error) {
      console.error("Error deleting tour:", error)
    }
  }

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/destinations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isPublished: !currentStatus }),
      })
      if (res.ok) {
        fetchTours()
      }
    } catch (error) {
      console.error("Error updating tour:", error)
    }
  }

  const filteredTours = tours.filter((tour) =>
    tour.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tour.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="guide" user={user ? { name: user.firstName + ' ' + user.lastName, email: user.email, avatar: user.avatar } : undefined} />
      
      <div className="flex-1 ml-64">
        <DashboardTopbar title="My Tours" />
        
        <main className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Tours</CardDescription>
                <CardTitle className="text-3xl">{tours.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Published</CardDescription>
                <CardTitle className="text-3xl text-green-500">
                  {tours.filter((t) => t.isPublished).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Drafts</CardDescription>
                <CardTitle className="text-3xl text-yellow-500">
                  {tours.filter((t) => !t.isPublished).length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tours..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Link href="/dashboard/guide/destinations/new">
                  <Button className="cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Tour
                  </Button>
                </Link>
              </div>
            </CardHeader>
          </Card>

          {/* Tours Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredTours.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tours found</p>
                <Link href="/dashboard/guide/destinations/new">
                  <Button variant="outline" className="mt-4 cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Tour
                  </Button>
                </Link>
              </div>
            ) : (
              filteredTours.map((tour) => (
                <Card key={tour._id} className="overflow-hidden">
                  <div className="relative h-48">
                    <Image
                      src={tour.coverImage || "/placeholder.svg"}
                      alt={tour.name}
                      fill
                      className="object-cover"
                    />
                    <Badge
                      className={`absolute top-2 right-2 ${tour.isPublished ? "bg-green-500" : "bg-yellow-500"}`}
                    >
                      {tour.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{tour.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {tour.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold">${tour.price}</span>
                      <span className="text-sm text-muted-foreground">per person</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/destinations/${tour._id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full cursor-pointer">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/dashboard/guide/destinations/${tour._id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full cursor-pointer">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublish(tour._id, tour.isPublished)}
                        className="cursor-pointer"
                      >
                        {tour.isPublished ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(tour._id)}
                        className="cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
