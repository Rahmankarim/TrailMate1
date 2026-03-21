"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Plus, Mail, Phone, Shield, Loader2, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface TeamMember {
  _id: string
  name: string
  email: string
  role: string
  phone?: string
  createdAt: string
  status: "active" | "inactive"
}

export default function CompanyTeamPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "Tour Guide",
    phone: "",
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?callbackUrl=/dashboard/company/team")
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch team members from API
  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/team", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setTeamMembers(data.teamMembers || [])
        } else {
          console.error("Failed to fetch team members")
        }
      } catch (error) {
        console.error("Error fetching team members:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchTeamMembers()
    }
  }, [user])

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newMember),
      })

      if (response.ok) {
        const data = await response.json()
        setTeamMembers([data.teamMember, ...teamMembers])
        setNewMember({ name: "", email: "", role: "Tour Guide", phone: "" })
        setIsDialogOpen(false)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to add team member")
      }
    } catch (error) {
      console.error("Error adding team member:", error)
      alert("Failed to add team member")
    }
  }

  const handleRemoveMember = async (id: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return

    try {
      const response = await fetch(`/api/team/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        setTeamMembers(teamMembers.filter((m) => m._id !== id))
      } else {
        const data = await response.json()
        alert(data.error || "Failed to remove team member")
      }
    } catch (error) {
      console.error("Error removing team member:", error)
      alert("Failed to remove team member")
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-secondary">
        <DashboardSidebar
          role="company"
          user={
            user
              ? {
                  name: `${user.firstName} ${user.lastName}`,
                  email: user.email,
                  avatar: user.avatar,
                }
              : undefined
          }
        />
        <div className="flex-1">
          <DashboardTopbar />
          <div className="p-6">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar
        role="company"
        user={
          user
            ? {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                avatar: user.avatar,
              }
            : undefined
        }
      />
      <div className="flex-1 ml-64">
        <DashboardTopbar title="Team" />
        <main className="p-6 space-y-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Team</h1>
              <p className="text-muted-foreground mt-1">Manage your team members and staff</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>Add a new member to your team</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newMember.role} onValueChange={(value) => setNewMember({ ...newMember, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guide">Tour Guide</SelectItem>
                        <SelectItem value="coordinator">Trip Coordinator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="support">Support Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      placeholder="+92 300 1234567"
                    />
                  </div>
                  <Button onClick={handleAddMember} className="w-full">
                    Add Member
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{teamMembers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Active staff</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tour Guides</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {teamMembers.filter((m) => m.role === "Tour Guide").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Certified guides</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Coordinators</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {teamMembers.filter((m) => m.role === "Trip Coordinator").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Trip coordinators</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                <Users className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-2">
                  {teamMembers.filter((m) => m.status === "active").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Currently active</p>
              </CardContent>
            </Card>
          </div>

          {/* Team Members List */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No team members yet</h3>
                  <p className="text-muted-foreground mb-6">Start by adding your first team member</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-foreground text-background">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground">{member.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                            {member.phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {member.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{member.role}</Badge>
                        <Badge variant={member.status === "active" ? "default" : "secondary"}>
                          {member.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
