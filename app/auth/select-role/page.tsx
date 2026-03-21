"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Mountain, User, Building2, Loader2, Map } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const roles = [
  {
    value: "user",
    label: "Traveler",
    description: "Discover adventures and book experiences",
    icon: User,
  },
  {
    value: "guide",
    label: "Guide",
    description: "Share your expertise and lead tours",
    icon: Map,
  },
  {
    value: "company",
    label: "Company",
    description: "Manage tours and team bookings",
    icon: Building2,
  },
]

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState("user")
  const [companyName, setCompanyName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    // Redirect based on role
    if (selectedRole === "company") {
      router.push("/dashboard/company")
    } else if (selectedRole === "guide") {
      router.push("/dashboard/guide")
    } else {
      router.push("/dashboard/user")
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Mountain className="h-10 w-10 text-foreground" />
            <span className="text-2xl font-bold text-foreground">TrailMate</span>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>Choose how you want to use TrailMate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="grid gap-3">
                {roles.map((role) => (
                  <Label
                    key={role.value}
                    htmlFor={`role-${role.value}`}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedRole === role.value
                        ? "border-foreground bg-secondary"
                        : "border-border hover:border-foreground/50"
                    }`}
                  >
                    <RadioGroupItem value={role.value} id={`role-${role.value}`} className="sr-only" />
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        selectedRole === role.value ? "bg-foreground text-background" : "bg-secondary"
                      }`}
                    >
                      <role.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{role.label}</p>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>

              {selectedRole === "company" && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      placeholder="Your Company Ltd."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                className="w-full bg-foreground text-background hover:bg-foreground/90 h-11"
                disabled={isLoading || (selectedRole === "company" && !companyName)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
