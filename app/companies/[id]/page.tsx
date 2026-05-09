import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/db/mongodb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, Calendar, Globe, MapPin, Mail, Phone, Shield, Users, ArrowLeft, Star } from "lucide-react"

export const revalidate = 0

type CompanyRecord = {
  _id: ObjectId
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  createdAt?: Date | string
  companyProfile?: {
    companyName?: string
    description?: string
    license?: string
    address?: string
    website?: string
    foundedYear?: number
    teamSize?: number
    isApproved?: boolean
  }
}

type DestinationRecord = {
  _id: ObjectId
  slug: string
  name: string
  shortDescription?: string
  description: string
  location: string
  region?: string
  price?: number
  duration?: string
  difficulty?: string
  coverImage?: string
  images?: string[]
  rating?: number
  reviewsCount?: number
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!ObjectId.isValid(id)) return notFound()

  const db = await getDatabase()

  const company = (await db.collection<CompanyRecord>("users").findOne({
    _id: new ObjectId(id),
    role: "company",
  })) as CompanyRecord | null

  if (!company) return notFound()

  const destinations = await db
    .collection<DestinationRecord>("destinations")
    .find({ userId: company._id })
    .sort({ createdAt: -1 })
    .toArray()

  const companyName = company.companyProfile?.companyName || `${company.firstName} ${company.lastName}`
  const companyImage = company.avatar || "/placeholder.svg"
  const initials = companyName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      <section className="pt-24 pb-10 px-6 bg-secondary border-b border-border">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" asChild className="mb-6 cursor-pointer">
            <Link href="/companies">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Companies
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
            <div className="bg-card rounded-3xl border border-border shadow-sm p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 md:items-center">
                <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-background shadow-lg shrink-0">
                  <AvatarImage src={companyImage} alt={companyName} />
                  <AvatarFallback className="text-3xl">{initials || "C"}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h1 className="text-3xl md:text-5xl font-bold text-foreground text-balance">{companyName}</h1>
                    <Badge className={company.companyProfile?.isApproved ? "bg-chart-2/15 text-chart-2" : "bg-muted text-muted-foreground"}>
                      <Shield className="h-3 w-3 mr-1" />
                      {company.companyProfile?.isApproved ? "Verified" : "Company"}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl">
                    {company.companyProfile?.description || "No company description has been added yet."}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 text-sm text-muted-foreground">
                    {company.companyProfile?.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{company.companyProfile.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{company.email}</span>
                    </div>
                    {company.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{company.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-6">
                    {company.companyProfile?.website && (
                      <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
                        <a href={company.companyProfile.website} target="_blank" rel="noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          Visit Website
                        </a>
                      </Button>
                    )}
                    <Badge variant="secondary" className="h-10 px-4 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Profile
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <Card className="border-border shadow-sm">
                <CardContent className="p-5">
                  <div className="text-sm text-muted-foreground mb-1">Destinations</div>
                  <div className="text-3xl font-bold text-foreground">{destinations.length}</div>
                  <p className="text-sm text-muted-foreground mt-2">Uploaded by this company</p>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Founded</span>
                  </div>
                  <div className="text-xl font-semibold text-foreground">
                    {company.companyProfile?.foundedYear || "—"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/70">
                    <Users className="h-4 w-4" />
                    <span>Team size: {company.companyProfile?.teamSize || "—"}</span>
                  </div>
                  {company.companyProfile?.license && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>License: {company.companyProfile.license}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4" />
                    <span>Profile created {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "recently"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Uploaded Destinations</h2>
              <p className="text-muted-foreground">Trips and packages published by {companyName}</p>
            </div>
            <Badge variant="secondary" className="h-10 px-4">
              {destinations.length} total
            </Badge>
          </div>

          {destinations.length === 0 ? (
            <Card className="border-dashed border-border bg-background/60">
              <CardContent className="py-16 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No destinations yet</h3>
                <p className="text-muted-foreground">This company has not uploaded any destinations.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {destinations.map((destination) => {
                const imageUrl = destination.coverImage || destination.images?.[0] || "/placeholder.svg"
                return (
                  <Link key={destination._id.toString()} href={`/destinations/${destination.slug}`} className="group">
                    <Card className="overflow-hidden border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                      <div className="relative h-52 overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={destination.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <Badge className="mb-2 bg-background/90 text-foreground">{destination.region || "Destination"}</Badge>
                          <h3 className="text-2xl font-bold text-background">{destination.name}</h3>
                        </div>
                      </div>

                      <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-4 mb-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{destination.location}</span>
                          </div>
                          {destination.duration && <span>{destination.duration}</span>}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {destination.shortDescription || destination.description}
                        </p>

                        <div className="flex items-center justify-between mt-5">
                          <div>
                            <div className="text-2xl font-bold text-foreground">
                              {typeof destination.price === "number" ? `$${destination.price.toLocaleString()}` : "Contact"}
                            </div>
                            <div className="text-xs text-muted-foreground">per person</div>
                          </div>
                          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                            View Details
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
