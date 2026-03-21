"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { PAKISTAN_BANKS } from "@/lib/constants/banks"
import {
  User,
  Camera,
  Mail,
  Phone,
  Shield,
  Bell,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Award,
  Languages,
  DollarSign,
  Plus,
  X,
  CreditCard,
  Building2,
  Trash2,
  ChevronsUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface GuideProfileData {
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
    preferences: {
      newsletter: boolean
      notifications: boolean
      language: string
      currency: string
    }
  }
  guideProfile: {
    bio: string
    specialties: string[]
    languages: string[]
    experience: number
    certifications: string[]
    pricePerDay: number
    availability: boolean
    isPublished: boolean
  }
}

const defaultProfile: GuideProfileData = {
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
    preferences: {
      newsletter: true,
      notifications: true,
      language: "en",
      currency: "USD",
    },
  },
  guideProfile: {
    bio: "",
    specialties: [],
    languages: [],
    experience: 0,
    certifications: [],
    pricePerDay: 0,
    availability: true,
    isPublished: true,
  },
}

export default function GuideProfilePage() {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState<GuideProfileData>(defaultProfile)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // New item inputs
  const [newSpecialty, setNewSpecialty] = useState("")
  const [newLanguage, setNewLanguage] = useState("")
  const [newCertification, setNewCertification] = useState("")

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

  // Bank accounts state
  interface BankAccount {
    _id?: string
    bankName: string
    accountTitle: string
    accountNumber: string
    iban?: string
    branchCode?: string
  }
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isLoadingBanks, setIsLoadingBanks] = useState(false)
  const [showAddBank, setShowAddBank] = useState(false)
  const [editingBankId, setEditingBankId] = useState<string | null>(null)
  const [bankFormData, setBankFormData] = useState<BankAccount>({
    bankName: "",
    accountTitle: "",
    accountNumber: "",
    iban: "",
    branchCode: ""
  })
  const [openBankCombobox, setOpenBankCombobox] = useState(false)
  const [bankSearchTerm, setBankSearchTerm] = useState("")

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
                address: data.profile.profile?.address || defaultProfile.profile.address,
                preferences: data.profile.profile?.preferences || defaultProfile.profile.preferences,
              },
              guideProfile: {
                bio: data.profile.guideProfile?.bio || "",
                specialties: data.profile.guideProfile?.specialties || [],
                languages: data.profile.guideProfile?.languages || [],
                experience: data.profile.guideProfile?.experience || 0,
                certifications: data.profile.guideProfile?.certifications || [],
                pricePerDay: data.profile.guideProfile?.pricePerDay || 0,
                availability: data.profile.guideProfile?.availability ?? true,
                isPublished: data.profile.guideProfile?.isPublished ?? true,
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

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          profile: profile.profile,
          guideProfile: profile.guideProfile,
        }),
      })

      const data = await res.json()

      if (data.success) {
        const publishMsg = profile.guideProfile.isPublished 
          ? " Your profile is now visible on the Guides page!" 
          : " Toggle 'Publish Profile' to make it visible on the Guides page."
        setMessage({ type: "success", text: "Profile updated successfully!" + publishMsg })
        await refreshUser()
      } else {
        console.error("Profile update failed:", data)
        const errorMsg = data.errors 
          ? `Validation errors: ${Object.entries(data.errors).map(([k, v]) => `${k}: ${v}`).join(', ')}`
          : data.message || "Failed to update profile"
        setMessage({ type: "error", text: errorMsg })
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

  const addItem = (field: "specialties" | "languages" | "certifications", value: string) => {
    if (!value.trim()) return
    setProfile((prev) => ({
      ...prev,
      guideProfile: {
        ...prev.guideProfile,
        [field]: [...prev.guideProfile[field], value.trim()],
      },
    }))
    if (field === "specialties") setNewSpecialty("")
    if (field === "languages") setNewLanguage("")
    if (field === "certifications") setNewCertification("")
  }

  const removeItem = (field: "specialties" | "languages" | "certifications", index: number) => {
    setProfile((prev) => ({
      ...prev,
      guideProfile: {
        ...prev.guideProfile,
        [field]: prev.guideProfile[field].filter((_, i) => i !== index),
      },
    }))
  }

  // Bank account functions
  const fetchBankAccounts = async () => {
    setIsLoadingBanks(true)
    try {
      const res = await fetch("/api/bank-accounts", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setBankAccounts(data.bankAccounts || [])
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error)
    } finally {
      setIsLoadingBanks(false)
    }
  }

  useEffect(() => {
    fetchBankAccounts()
  }, [])

  const handleAddBank = async () => {
    if (!bankFormData.bankName || !bankFormData.accountTitle || !bankFormData.accountNumber) {
      setMessage({ type: "error", text: "Please fill in all required fields" })
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bankFormData)
      })

      if (res.ok) {
        setMessage({ type: "success", text: "Bank account added successfully" })
        setBankFormData({ bankName: "", accountTitle: "", accountNumber: "", iban: "", branchCode: "" })
        setShowAddBank(false)
        fetchBankAccounts()
      } else {
        const data = await res.json()
        setMessage({ type: "error", text: data.error || "Failed to add bank account" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to add bank account" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBank = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this bank account?")) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/bank-accounts?accountId=${accountId}`, {
        method: "DELETE",
        credentials: "include"
      })

      if (res.ok) {
        setMessage({ type: "success", text: "Bank account deleted successfully" })
        fetchBankAccounts()
      } else {
        setMessage({ type: "error", text: "Failed to delete bank account" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete bank account" })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredBanks = PAKISTAN_BANKS.filter(bank =>
    bank.label.toLowerCase().includes(bankSearchTerm.toLowerCase())
  )

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
        role="guide"
        user={{ name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Guide", email: user?.email || "", avatar: user?.avatar }}
      />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Guide Profile Settings" />

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
                value="guide"
                className="data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                <Award className="h-4 w-4 mr-2" />
                Guide Profile
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
              <TabsTrigger
                value="banking"
                className="data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Bank Details
              </TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>Upload a professional photo to attract more clients</CardDescription>
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
                      <p className="text-sm text-muted-foreground">Use a professional photo for better credibility</p>
                      <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG up to 5MB</p>
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" value={profile.email} disabled className="pl-10 bg-muted" />
                    </div>
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
                        placeholder="+92 300 1234567"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Guide Profile Tab */}
            <TabsContent value="guide" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                  <CardDescription>Details that will be shown on your guide profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="guideBio">Professional Bio</Label>
                    <Textarea
                      id="guideBio"
                      value={profile.guideProfile.bio}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          guideProfile: { ...profile.guideProfile, bio: e.target.value },
                        })
                      }
                      placeholder="Describe your experience, expertise, and what makes you unique as a guide..."
                      rows={5}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {profile.guideProfile.bio.length}/1000 characters
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        type="number"
                        min="0"
                        max="50"
                        value={profile.guideProfile.experience}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            guideProfile: { ...profile.guideProfile, experience: Number.parseInt(e.target.value) || 0 },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerDay">Price Per Day (USD)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="pricePerDay"
                          type="number"
                          min="0"
                          value={profile.guideProfile.pricePerDay}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              guideProfile: {
                                ...profile.guideProfile,
                                pricePerDay: Number.parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Availability</p>
                      <p className="text-sm text-muted-foreground">Set your availability for new bookings</p>
                    </div>
                    <Switch
                      checked={profile.guideProfile.availability}
                      onCheckedChange={(checked) =>
                        setProfile({
                          ...profile,
                          guideProfile: { ...profile.guideProfile, availability: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-primary/5 border-primary/20">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">Publish Profile</p>
                        {profile.guideProfile.isPublished && (
                          <Badge variant="default" className="text-xs">Live</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {profile.guideProfile.isPublished 
                          ? "Your profile is visible on /guides page. Turn off to hide it." 
                          : "Turn on to make your profile visible to clients on the Guides page"}
                      </p>
                    </div>
                    <Switch
                      checked={profile.guideProfile.isPublished}
                      onCheckedChange={(checked) =>
                        setProfile({
                          ...profile,
                          guideProfile: { ...profile.guideProfile, isPublished: checked },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Specialties</CardTitle>
                  <CardDescription>Areas of expertise (e.g., Mountain Trekking, Photography Tours)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      placeholder="Add a specialty..."
                      onKeyDown={(e) => e.key === "Enter" && addItem("specialties", newSpecialty)}
                    />
                    <Button onClick={() => addItem("specialties", newSpecialty)} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.guideProfile.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {specialty}
                        <button
                          onClick={() => removeItem("specialties", index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Languages</CardTitle>
                  <CardDescription>Languages you can communicate in</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      placeholder="Add a language..."
                      onKeyDown={(e) => e.key === "Enter" && addItem("languages", newLanguage)}
                    />
                    <Button onClick={() => addItem("languages", newLanguage)} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.guideProfile.languages.map((language, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        <Languages className="h-3 w-3" />
                        {language}
                        <button onClick={() => removeItem("languages", index)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Certifications</CardTitle>
                  <CardDescription>Professional certifications and licenses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      placeholder="Add a certification..."
                      onKeyDown={(e) => e.key === "Enter" && addItem("certifications", newCertification)}
                    />
                    <Button onClick={() => addItem("certifications", newCertification)} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.guideProfile.certifications.map((cert, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        <Award className="h-3 w-3" />
                        {cert}
                        <button
                          onClick={() => removeItem("certifications", index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive booking updates via email</p>
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
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Newsletter</p>
                      <p className="text-sm text-muted-foreground">Receive tips and updates for guides</p>
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
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
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
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
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button onClick={handleChangePassword} disabled={isChangingPassword} className="w-full">
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bank Details Tab */}
            <TabsContent value="banking" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bank Account Details</CardTitle>
                  <CardDescription>Add your bank accounts for receiving payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingBanks ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {bankAccounts.length > 0 && (
                        <div className="space-y-4 mb-6">
                          {bankAccounts.map((account) => (
                            <div
                              key={account._id}
                              className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <Building2 className="h-5 w-5 text-muted-foreground mt-1" />
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-foreground">{account.bankName}</h4>
                                      <Badge variant="outline" className="text-xs">
                                        {PAKISTAN_BANKS.find(b => b.value === account.bankName)?.label || account.bankName}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Account Title: <span className="text-foreground">{account.accountTitle}</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Account Number: <span className="text-foreground font-mono">{account.accountNumber}</span>
                                    </p>
                                    {account.iban && (
                                      <p className="text-sm text-muted-foreground">
                                        IBAN: <span className="text-foreground font-mono">{account.iban}</span>
                                      </p>
                                    )}
                                    {account.branchCode && (
                                      <p className="text-sm text-muted-foreground">
                                        Branch Code: <span className="text-foreground">{account.branchCode}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => account._id && handleDeleteBank(account._id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!showAddBank ? (
                        <Button
                          onClick={() => setShowAddBank(true)}
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Bank Account
                        </Button>
                      ) : (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold">Add New Bank Account</h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setShowAddBank(false)
                                setBankFormData({ bankName: "", accountTitle: "", accountNumber: "", iban: "", branchCode: "" })
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name *</Label>
                            <Popover open={openBankCombobox} onOpenChange={setOpenBankCombobox}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={openBankCombobox}
                                  className="w-full justify-between"
                                >
                                  {bankFormData.bankName
                                    ? PAKISTAN_BANKS.find((bank) => bank.value === bankFormData.bankName)?.label
                                    : "Select bank..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput 
                                    placeholder="Search bank..." 
                                    value={bankSearchTerm}
                                    onValueChange={setBankSearchTerm}
                                  />
                                  <CommandEmpty>No bank found.</CommandEmpty>
                                  <CommandGroup className="max-h-64 overflow-auto">
                                    {filteredBanks.map((bank) => (
                                      <CommandItem
                                        key={bank.value}
                                        value={bank.value}
                                        onSelect={(currentValue) => {
                                          setBankFormData({ ...bankFormData, bankName: currentValue })
                                          setOpenBankCombobox(false)
                                          setBankSearchTerm("")
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            bankFormData.bankName === bank.value ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {bank.label}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="accountTitle">Account Title *</Label>
                            <Input
                              id="accountTitle"
                              placeholder="John Doe"
                              value={bankFormData.accountTitle}
                              onChange={(e) => setBankFormData({ ...bankFormData, accountTitle: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="accountNumber">Account Number *</Label>
                            <Input
                              id="accountNumber"
                              placeholder="1234567890"
                              value={bankFormData.accountNumber}
                              onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="iban">IBAN (Optional)</Label>
                            <Input
                              id="iban"
                              placeholder="PK36SCBL0000001123456702"
                              value={bankFormData.iban}
                              onChange={(e) => setBankFormData({ ...bankFormData, iban: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="branchCode">Branch Code (Optional)</Label>
                            <Input
                              id="branchCode"
                              placeholder="1234"
                              value={bankFormData.branchCode}
                              onChange={(e) => setBankFormData({ ...bankFormData, branchCode: e.target.value })}
                            />
                          </div>

                          <Button
                            onClick={handleAddBank}
                            disabled={isSaving}
                            className="w-full"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Account
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {bankAccounts.length === 0 && !showAddBank && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No bank accounts added yet. Add one to receive payments.</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSaving} size="lg">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
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
