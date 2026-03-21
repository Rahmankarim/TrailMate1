"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { Shield, AlertTriangle, CheckCircle, XCircle, Loader2, Flag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminModerationPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

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
        <DashboardTopbar title="Moderation" />

        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Moderation</CardTitle>
                <CardDescription>Review and moderate platform content</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="reports">
                  <TabsList>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                  </TabsList>
                  <TabsContent value="reports" className="space-y-4 mt-4">
                    <div className="text-center py-12">
                      <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Reports</h3>
                      <p className="text-muted-foreground">All content is currently clean. No reported items.</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="reviews" className="space-y-4 mt-4">
                    <div className="text-center py-12">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Pending Reviews</h3>
                      <p className="text-muted-foreground">All reviews have been moderated.</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="content" className="space-y-4 mt-4">
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <h3 className="text-lg font-semibold mb-2">All Content Approved</h3>
                      <p className="text-muted-foreground">No content pending moderation.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
