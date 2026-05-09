"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import AdminAccessGuard from "@/components/dashboard/admin-access-guard"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { Building2, Search, Loader2, Mail, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminCompaniesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [companies, setCompanies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchCompanies()
    }
  }, [user])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/admin/users", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.users.filter((u: any) => u.role === "company"))
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCompanies = companies.filter((c) =>
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!window.confirm(`Delete ${companyName}? This will permanently remove the account and its related destinations.`)) {
      return
    }

    setProcessingId(companyId)
    try {
      const response = await fetch(`/api/admin/users/${companyId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        setCompanies(companies.filter((company) => company._id !== companyId))
        toast({
          title: "Success",
          description: "Company deleted successfully",
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete company")
      }
    } catch (error) {
      console.error("Error deleting company:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete company",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <AdminAccessGuard>
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
        <DashboardTopbar title="Companies" />

        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Companies</CardTitle>
                    <CardDescription>{companies.length} registered companies</CardDescription>
                  </div>
                  <div className="relative w-64 mt-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search companies..."
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
                        <TableHead>Company</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompanies.map((company) => (
                        <TableRow key={company._id}>
                          <TableCell className="font-medium">
                            {company.firstName && company.lastName
                              ? `${company.firstName} ${company.lastName}`
                              : "Company"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {company.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={company.isActive ? "default" : "destructive"}>
                              {company.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(company.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() =>
                                handleDeleteCompany(
                                  company._id,
                                  company.companyProfile?.companyName || `${company.firstName || ""} ${company.lastName || ""}`.trim() || company.email
                                )
                              }
                              disabled={processingId === company._id}
                            >
                              {processingId === company._id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Delete
                            </Button>
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
    </AdminAccessGuard>
  )
}
