import Link from "next/link"
import Image from "next/image"
import { getDatabase } from "@/lib/db/mongodb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, Globe, MapPin, Star, Users } from "lucide-react"

export const revalidate = 0

export default async function CompaniesPage() {
  const db = await getDatabase()

  const companies = await db
    .collection("users")
    .aggregate([
      {
        $match: {
          role: "company",
          $or: [{ isActive: true }, { isActive: { $exists: false } }],
        },
      },
      {
        $lookup: {
          from: "destinations",
          localField: "_id",
          foreignField: "userId",
          as: "destinations",
        },
      },
      {
        $addFields: {
          destinationCount: { $size: "$destinations" },
        },
      },
      {
        $sort: {
          "companyProfile.companyName": 1,
          firstName: 1,
          lastName: 1,
        },
      },
    ])
    .toArray()

  const featuredCount = companies.length
  const totalDestinations = companies.reduce((sum: number, company: any) => sum + (company.destinationCount || 0), 0)
  const heroBackground = "/eco-tourism-sustainable-travel-nature.jpg"

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden pt-24 pb-14 px-6 border-b border-border">
        <div className="absolute inset-0">
          <Image
            src={heroBackground}
            alt="Partner Directory background"
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/60 to-foreground/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_30%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
            <div>
              <Badge className="mb-4 bg-background/90 text-foreground backdrop-blur-sm">Partner Directory</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-background text-balance">
                Companies on TrailMate
              </h1>
              <p className="text-lg text-background/85 mt-4 max-w-2xl">
                Browse the companies publishing destinations, review their profile details, and open any company to see the trips they uploaded.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-background/20 bg-background/10 text-background backdrop-blur-md shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-background/80 text-sm mb-2">
                    <Building2 className="h-4 w-4" />
                    <span>Companies</span>
                  </div>
                  <div className="text-3xl font-bold text-background">{featuredCount}</div>
                </CardContent>
              </Card>
              <Card className="border-background/20 bg-background/10 text-background backdrop-blur-md shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-background/80 text-sm mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>Destinations</span>
                  </div>
                  <div className="text-3xl font-bold text-background">{totalDestinations}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {companies.length === 0 ? (
            <Card className="border-dashed border-border bg-background/60">
              <CardContent className="py-20 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">No companies found</h2>
                <p className="text-muted-foreground">No active company profiles are available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {companies.map((company: any) => {
                const companyName = company.companyProfile?.companyName || `${company.firstName} ${company.lastName}`
                const companyImage = company.avatar || "/placeholder.svg"
                const companyInitials = companyName
                  .split(" ")
                  .filter(Boolean)
                  .map((part: string) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()

                return (
                  <Link key={company._id.toString()} href={`/companies/${company._id.toString()}`} className="group block h-full">
                    <Card className="overflow-hidden border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full bg-card">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <Avatar className="h-16 w-16 border-2 border-border shadow-sm shrink-0">
                              <AvatarImage src={companyImage} alt={companyName} />
                              <AvatarFallback className="text-lg">{companyInitials || "C"}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <Badge className="mb-2 bg-secondary text-foreground">Company</Badge>
                              <h3 className="text-xl font-bold text-foreground truncate">{companyName}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {company.companyProfile?.description || "Professional travel company on TrailMate"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                          {company.companyProfile?.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 shrink-0" />
                              <span className="line-clamp-1">{company.companyProfile.address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 shrink-0" />
                            <span>{company.destinationCount || 0} destinations uploaded</span>
                          </div>
                          {company.companyProfile?.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 shrink-0" />
                              <a
                                href={company.companyProfile.website}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4 hover:text-foreground"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Visit website
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Star className="h-4 w-4" />
                            <span>{company.companyProfile?.isApproved ? "Verified partner" : "Company profile"}</span>
                          </div>
                          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                            View Profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
