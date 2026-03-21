"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { MapPin, Search, Loader2, DollarSign, Star, Eye } from "lucide-react"

export default function AdminDestinationsPage() {
  const { user } = useAuth()
  const [destinations, setDestinations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchDestinations()
    }
  }, [user])

  const fetchDestinations = async () => {
    try {
      const response = await fetch("/api/destinations", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setDestinations(data.destinations || [])
      }
    } catch (error) {
      console.error("Error fetching destinations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDestinations = destinations.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        role="admin"
        user={{
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Admin",
          email: user?.email || "",
          avatar: user?.avatar,
        }}
      />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Destinations" />

        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Destinations</CardTitle>
                    <CardDescription>{destinations.length} total destinations</CardDescription>
                  </div>
                  <div className="relative w-64 mt-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search destinations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Destination</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDestinations.map((destination) => (
                        <TableRow key={destination._id}>
                          <TableCell className="font-medium">{destination.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {destination.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              PKR {destination.price?.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              {destination.rating?.toFixed(1) || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={destination.isPublished ? "default" : "secondary"}>
                              {destination.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
