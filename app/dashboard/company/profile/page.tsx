"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { cn } from "@/lib/utils"
import {
  Building2,
  Camera,
  Mail,
  Phone,
  Shield,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
  Calendar,
  Users,
  CreditCard,
  Plus,
  X,
  Trash2,
  ChevronsUpDown,
} from "lucide-react"

interface CompanyProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar: string
  companyProfile: {
    companyName: string
    description: string
    license: string
    address: string
    website: string
    foundedYear: number
    teamSize: number
  }
}

const defaultProfile: CompanyProfileData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  avatar: "",
  companyProfile: {
    companyName: "",
    description: "",
    license: "",
    address: "",
    website: "",
    foundedYear: new Date().getFullYear(),
    teamSize: 1,
  },
}

export default function CompanyProfilePage() {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState<CompanyProfileData>(defaultProfile)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

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
              companyProfile: {
                companyName: data.profile.companyProfile?.companyName || "",
                description: data.profile.companyProfile?.description || "",
                license: data.profile.companyProfile?.license || "",
                address: data.profile.companyProfile?.address || "",
                website: data.profile.companyProfile?.website || "",
                foundedYear: data.profile.companyProfile?.foundedYear || new Date().getFullYear(),
                teamSize: data.profile.companyProfile?.teamSize || 1,
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
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          companyProfile: profile.companyProfile,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" })
        await refreshUser()
      } else {
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
          setMessage({ type: "success", text: "Logo updated successfully!" })
          await refreshUser()
        } else {
          setMessage({ type: "error", text: data.message })
        }
      } catch (error) {
        console.error("Error uploading avatar:", error)
        setMessage({ type: "error", text: "Failed to upload logo" })
      }
    }
    reader.readAsDataURL(file)
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
        role="company"
        user={{
          name:
            profile.companyProfile.companyName ||
            `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
            "Company",
          email: user?.email || "",
          avatar: profile.avatar || user?.avatar,
        }}
      />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Company Profile Settings" />

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

          <Tabs defaultValue="company" className="space-y-6">
            <TabsList className="bg-background border">
              <TabsTrigger
                value="company"
                className="data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Company Info
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

            {/* Company Info Tab */}
            <TabsContent value="company" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Logo</CardTitle>
                  <CardDescription>Upload your company logo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profile.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-2xl bg-foreground text-background">
                          {profile.companyProfile.companyName?.[0] || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <label className="absolute bottom-0 right-0 p-1.5 bg-foreground text-background rounded-full cursor-pointer hover:bg-foreground/90 transition-colors">
                        <Camera className="h-4 w-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                      </label>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Upload a professional company logo</p>
                      <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG up to 5MB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Company Details</CardTitle>
                  <CardDescription>Information about your company</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyName"
                        value={profile.companyProfile.companyName}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            companyProfile: { ...profile.companyProfile, companyName: e.target.value },
                          })
                        }
                        placeholder="Your Company Name"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      value={profile.companyProfile.description}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          companyProfile: { ...profile.companyProfile, description: e.target.value },
                        })
                      }
                      placeholder="Describe your company and services..."
                      rows={5}
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {profile.companyProfile.description.length}/2000 characters
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="foundedYear">Founded Year</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="foundedYear"
                          type="number"
                          min="1800"
                          max={new Date().getFullYear()}
                          value={profile.companyProfile.foundedYear}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              companyProfile: {
                                ...profile.companyProfile,
                                foundedYear: Number.parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamSize">Team Size</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="teamSize"
                          type="number"
                          min="1"
                          value={profile.companyProfile.teamSize}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              companyProfile: {
                                ...profile.companyProfile,
                                teamSize: Number.parseInt(e.target.value) || 1,
                              },
                            })
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license">Business License</Label>
                    <Input
                      id="license"
                      value={profile.companyProfile.license}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          companyProfile: { ...profile.companyProfile, license: e.target.value },
                        })
                      }
                      placeholder="Business license number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        type="url"
                        value={profile.companyProfile.website}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            companyProfile: { ...profile.companyProfile, website: e.target.value },
                          })
                        }
                        placeholder="https://www.yourcompany.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address</Label>
                    <Textarea
                      id="address"
                      value={profile.companyProfile.address}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          companyProfile: { ...profile.companyProfile, address: e.target.value },
                        })
                      }
                      placeholder="Full business address"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Person</CardTitle>
                  <CardDescription>Primary contact details</CardDescription>
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
                              placeholder="Company Name"
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
