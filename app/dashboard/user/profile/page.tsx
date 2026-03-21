"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import {
  User,
  Camera,
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  Globe,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react"

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar: string
  profile: {
    bio: string
    dateOfBirth: string
    gender: string
    nationality: string
    address: {
      street: string
      city: string
      state: string
      country: string
      zipCode: string
    }
    emergencyContact: {
      name: string
      phone: string
      relationship: string
    }
    preferences: {
      newsletter: boolean
      notifications: boolean
      language: string
      currency: string
    }
    socialLinks: {
      facebook: string
      instagram: string
      twitter: string
      linkedin: string
    }
    travelPreferences: {
      adventureLevel: string
      interests: string[]
      dietaryRestrictions: string[]
    }
  }
}

const defaultProfile: ProfileData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  avatar: "",
  profile: {
    bio: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    },
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
    preferences: {
      newsletter: true,
      notifications: true,
      language: "en",
      currency: "USD",
    },
    socialLinks: {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
    },
    travelPreferences: {
      adventureLevel: "moderate",
      interests: [],
      dietaryRestrictions: [],
    },
  },
}

export default function ProfileSettingsPage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData>(defaultProfile)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Redirect non-users to their proper dashboards
  useEffect(() => {
    if (user && user.role === "guide") {
      router.push("/dashboard/guide/profile")
    }
    if (user && user.role === "company") {
      router.push("/dashboard/company/profile")
    }
    if (user && user.role === "admin") {
      router.push("/dashboard/admin/profile")
    }
  }, [user, router])

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile")
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.profile) {
            setProfile({
              firstName: data.profile.firstName || "",
              lastName: data.profile.lastName || "",
              email: data.profile.email || "",
              phone: data.profile.phone || "",
              avatar: data.profile.avatar || "",
              profile: {
                bio: data.profile.profile?.bio || "",
                dateOfBirth: data.profile.profile?.dateOfBirth
                  ? new Date(data.profile.profile.dateOfBirth).toISOString().split("T")[0]
                  : "",
                gender: data.profile.profile?.gender || "",
                nationality: data.profile.profile?.nationality || "",
                address: {
                  street: data.profile.profile?.address?.street || "",
                  city: data.profile.profile?.address?.city || "",
                  state: data.profile.profile?.address?.state || "",
                  country: data.profile.profile?.address?.country || "",
                  zipCode: data.profile.profile?.address?.zipCode || "",
                },
                emergencyContact: {
                  name: data.profile.profile?.emergencyContact?.name || "",
                  phone: data.profile.profile?.emergencyContact?.phone || "",
                  relationship: data.profile.profile?.emergencyContact?.relationship || "",
                },
                preferences: {
                  newsletter: data.profile.profile?.preferences?.newsletter ?? true,
                  notifications: data.profile.profile?.preferences?.notifications ?? true,
                  language: data.profile.profile?.preferences?.language || "en",
                  currency: data.profile.profile?.preferences?.currency || "USD",
                },
                socialLinks: {
                  facebook: data.profile.profile?.socialLinks?.facebook || "",
                  instagram: data.profile.profile?.socialLinks?.instagram || "",
                  twitter: data.profile.profile?.socialLinks?.twitter || "",
                  linkedin: data.profile.profile?.socialLinks?.linkedin || "",
                },
                travelPreferences: {
                  adventureLevel: data.profile.profile?.travelPreferences?.adventureLevel || "moderate",
                  interests: data.profile.profile?.travelPreferences?.interests || [],
                  dietaryRestrictions: data.profile.profile?.travelPreferences?.dietaryRestrictions || [],
                },
              },
            })
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setMessage(null)
    setErrors({})

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          avatar: profile.avatar,
          profile: {
            bio: profile.profile.bio,
            dateOfBirth: profile.profile.dateOfBirth ? new Date(profile.profile.dateOfBirth) : undefined,
            gender: profile.profile.gender || undefined,
            nationality: profile.profile.nationality || undefined,
            address: profile.profile.address,
            emergencyContact: profile.profile.emergencyContact,
            preferences: profile.profile.preferences,
            socialLinks: profile.profile.socialLinks,
            travelPreferences: profile.profile.travelPreferences,
          },
        }),
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" })
        await refreshUser()
      } else {
        if (data.errors) {
          setErrors(data.errors)
        }
        setMessage({ type: "error", text: data.message || "Failed to update profile" })
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      setMessage({ type: "error", text: "An error occurred while saving" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setIsChangingPassword(true)
    setMessage(null)

    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: "success", text: data.message })
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        setMessage({ type: "error", text: data.message || "Failed to change password" })
      }
    } catch (error) {
      console.error("Error changing password:", error)
      setMessage({ type: "error", text: "An error occurred" })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string

      try {
        const res = await fetch("/api/profile/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: base64 }),
        })

        const data = await res.json()
        if (data.success) {
          setProfile((prev) => ({ ...prev, avatar: data.avatar }))
          setMessage({ type: "success", text: "Avatar updated successfully!" })
          await refreshUser()
        } else {
          setMessage({ type: "error", text: data.message })
        }
      } catch (error) {
        console.error("Error uploading avatar:", error)
        setMessage({ type: "error", text: "Failed to upload avatar" })
      }
    }
    reader.readAsDataURL(file)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-secondary items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar
        role="user"
        user={{ name: user?.firstName + " " + user?.lastName || "User", email: user?.email || "", avatar: user?.avatar }}
      />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Profile Settings" />

        <main className="p-6">
          {message && (
            <Alert
              className={`mb-6 ${message.type === "success" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
            >
              {message.type === "success" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="bg-background border">
              <TabsTrigger
                value="personal"
                className="data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                <User className="h-4 w-4 mr-2" />
                Personal Info
              </TabsTrigger>
              <TabsTrigger
                value="contact"
                className="data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Contact & Address
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                <Bell className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>Upload a profile picture to personalize your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profile.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-2xl bg-foreground text-background">
                          {profile.firstName?.[0]}
                          {profile.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <label className="absolute bottom-0 right-0 p-1.5 bg-foreground text-background rounded-full cursor-pointer hover:bg-foreground/90 transition-colors">
                        <Camera className="h-4 w-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                      </label>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Recommended: Square image, at least 200x200 pixels
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, GIF up to 5MB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        className={errors.firstName ? "border-red-500" : ""}
                      />
                      {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        className={errors.lastName ? "border-red-500" : ""}
                      />
                      {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" value={profile.email} disabled className="pl-10 bg-muted" />
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={profile.profile.dateOfBirth}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            profile: { ...profile.profile, dateOfBirth: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={profile.profile.gender}
                        onValueChange={(value) =>
                          setProfile({
                            ...profile,
                            profile: { ...profile.profile, gender: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={profile.profile.nationality}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          profile: { ...profile.profile, nationality: e.target.value },
                        })
                      }
                      placeholder="e.g., Pakistani"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.profile.bio}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          profile: { ...profile.profile, bio: e.target.value },
                        })
                      }
                      placeholder="Tell us about yourself..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {profile.profile.bio.length}/500 characters
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact & Address Tab */}
            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Address</CardTitle>
                  <CardDescription>Your residential address</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={profile.profile.address.street}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          profile: {
                            ...profile.profile,
                            address: { ...profile.profile.address, street: e.target.value },
                          },
                        })
                      }
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profile.profile.address.city}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            profile: {
                              ...profile.profile,
                              address: { ...profile.profile.address, city: e.target.value },
                            },
                          })
                        }
                        placeholder="Islamabad"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Input
                        id="state"
                        value={profile.profile.address.state}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            profile: {
                              ...profile.profile,
                              address: { ...profile.profile.address, state: e.target.value },
                            },
                          })
                        }
                        placeholder="Punjab"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={profile.profile.address.country}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            profile: {
                              ...profile.profile,
                              address: { ...profile.profile.address, country: e.target.value },
                            },
                          })
                        }
                        placeholder="Pakistan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip / Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={profile.profile.address.zipCode}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            profile: {
                              ...profile.profile,
                              address: { ...profile.profile.address, zipCode: e.target.value },
                            },
                          })
                        }
                        placeholder="44000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                  <CardDescription>Someone we can contact in case of emergency</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName">Contact Name</Label>
                    <Input
                      id="emergencyName"
                      value={profile.profile.emergencyContact.name}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          profile: {
                            ...profile.profile,
                            emergencyContact: { ...profile.profile.emergencyContact, name: e.target.value },
                          },
                        })
                      }
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Contact Phone</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        value={profile.profile.emergencyContact.phone}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            profile: {
                              ...profile.profile,
                              emergencyContact: { ...profile.profile.emergencyContact, phone: e.target.value },
                            },
                          })
                        }
                        placeholder="+92 300 1234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyRelationship">Relationship</Label>
                      <Select
                        value={profile.profile.emergencyContact.relationship}
                        onValueChange={(value) =>
                          setProfile({
                            ...profile,
                            profile: {
                              ...profile.profile,
                              emergencyContact: { ...profile.profile.emergencyContact, relationship: value },
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Links</CardTitle>
                  <CardDescription>Connect your social media profiles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        value={profile.profile.socialLinks.facebook}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            profile: {
                              ...profile.profile,
                              socialLinks: { ...profile.profile.socialLinks, facebook: e.target.value },
                            },
                          })
                        }
                        placeholder="https://facebook.com/username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={profile.profile.socialLinks.instagram}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            profile: {
                              ...profile.profile,
                              socialLinks: { ...profile.profile.socialLinks, instagram: e.target.value },
                            },
                          })
                        }
                        placeholder="https://instagram.com/username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter / X</Label>
                      <Input
                        id="twitter"
                        value={profile.profile.socialLinks.twitter}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            profile: {
                              ...profile.profile,
                              socialLinks: { ...profile.profile.socialLinks, twitter: e.target.value },
                            },
                          })
                        }
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={profile.profile.socialLinks.linkedin}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            profile: {
                              ...profile.profile,
                              socialLinks: { ...profile.profile.socialLinks, linkedin: e.target.value },
                            },
                          })
                        }
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage how you receive updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Newsletter</Label>
                      <p className="text-sm text-muted-foreground">Receive travel tips and destination highlights</p>
                    </div>
                    <Switch
                      checked={profile.profile.preferences.newsletter}
                      onCheckedChange={(checked) =>
                        setProfile({
                          ...profile,
                          profile: {
                            ...profile.profile,
                            preferences: { ...profile.profile.preferences, newsletter: checked },
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get notified about bookings and updates</p>
                    </div>
                    <Switch
                      checked={profile.profile.preferences.notifications}
                      onCheckedChange={(checked) =>
                        setProfile({
                          ...profile,
                          profile: {
                            ...profile.profile,
                            preferences: { ...profile.profile.preferences, notifications: checked },
                          },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Language & Currency</CardTitle>
                  <CardDescription>Set your display preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={profile.profile.preferences.language}
                        onValueChange={(value) =>
                          setProfile({
                            ...profile,
                            profile: {
                              ...profile.profile,
                              preferences: { ...profile.profile.preferences, language: value },
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <Globe className="h-4 w-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ur">Urdu</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={profile.profile.preferences.currency}
                        onValueChange={(value) =>
                          setProfile({
                            ...profile,
                            profile: {
                              ...profile.profile,
                              preferences: { ...profile.profile.preferences, currency: value },
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="PKR">PKR (Rs)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Travel Preferences</CardTitle>
                  <CardDescription>Help us personalize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Adventure Level</Label>
                    <Select
                      value={profile.profile.travelPreferences.adventureLevel}
                      onValueChange={(value) =>
                        setProfile({
                          ...profile,
                          profile: {
                            ...profile.profile,
                            travelPreferences: { ...profile.profile.travelPreferences, adventureLevel: value },
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy - Leisurely trips</SelectItem>
                        <SelectItem value="moderate">Moderate - Some physical activity</SelectItem>
                        <SelectItem value="challenging">Challenging - Requires fitness</SelectItem>
                        <SelectItem value="extreme">Extreme - Expert level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      isChangingPassword ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword
                    }
                    className="bg-foreground text-background hover:bg-foreground/90"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>Manage your account security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Email Verified</p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}
