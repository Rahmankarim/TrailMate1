import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"

// GET - Fetch admin analytics
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const db = await getDatabase()
    
    // Fetch all collections data
    const [users, bookings, destinations, guides] = await Promise.all([
      db.collection("users").find({}).toArray(),
      db.collection("bookings").find({}).toArray(),
      db.collection("destinations").find({}).toArray(),
      db.collection("guides").find({}).toArray(),
    ])

    // Calculate total revenue (only paid bookings)
    const paidBookings = bookings.filter((b: any) => b.paymentStatus === "paid")
    const totalRevenue = paidBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
    
    // Calculate pending revenue
    const pendingBookings = bookings.filter((b: any) => 
      b.paymentStatus === "unpaid" || b.paymentStatus === "pending"
    )
    const pendingRevenue = pendingBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)

    // User statistics by role
    const usersByRole = users.reduce((acc: any, user: any) => {
      const role = user.role || "user"
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {})

    // Booking statistics by status
    const bookingsByStatus = bookings.reduce((acc: any, booking: any) => {
      const status = booking.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // Booking statistics by type
    const bookingsByType = bookings.reduce((acc: any, booking: any) => {
      const type = booking.bookingType || "destination_booking"
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    // Monthly revenue and bookings (last 12 months)
    const monthlyData: any[] = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const monthBookings = paidBookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt)
        return bookingDate >= date && bookingDate < nextMonth
      })

      const allMonthBookings = bookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt)
        return bookingDate >= date && bookingDate < nextMonth
      })

      monthlyData.push({
        month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue: monthBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0),
        bookings: allMonthBookings.length,
        paidBookings: monthBookings.length,
      })
    }

    // Top destinations by bookings
    const destinationBookings = new Map<string, { name: string; bookings: number; revenue: number }>()
    
    bookings.forEach((booking: any) => {
      if (booking.destinationId) {
        const destId = booking.destinationId.toString()
        if (!destinationBookings.has(destId)) {
          const dest = destinations.find((d: any) => d._id.toString() === destId)
          destinationBookings.set(destId, {
            name: dest?.name || "Unknown",
            bookings: 0,
            revenue: 0,
          })
        }
        const data = destinationBookings.get(destId)!
        data.bookings += 1
        if (booking.paymentStatus === "paid") {
          data.revenue += booking.totalPrice || 0
        }
      }
    })

    const topDestinations = Array.from(destinationBookings.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10)

    // Top guides by bookings
    const guideBookings = new Map<string, { name: string; email: string; bookings: number; revenue: number }>()
    
    for (const booking of bookings) {
      if (booking.guideId) {
        const guideId = booking.guideId.toString()
        if (!guideBookings.has(guideId)) {
          const guide = guides.find((g: any) => g._id.toString() === guideId)
          let guideName = "Unknown"
          let guideEmail = ""
          
          if (guide && guide.userId) {
            const guideUser = users.find((u: any) => u._id.toString() === guide.userId.toString())
            if (guideUser) {
              guideName = `${guideUser.firstName || ""} ${guideUser.lastName || ""}`.trim()
              guideEmail = guideUser.email || ""
            }
          }
          
          guideBookings.set(guideId, {
            name: guideName,
            email: guideEmail,
            bookings: 0,
            revenue: 0,
          })
        }
        const data = guideBookings.get(guideId)!
        data.bookings += 1
        if (booking.paymentStatus === "paid") {
          data.revenue += booking.totalPrice || 0
        }
      }
    }

    const topGuides = Array.from(guideBookings.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10)

    // Top companies by revenue
    const companyRevenue = new Map<string, { name: string; email: string; bookings: number; revenue: number }>()
    
    const companies = users.filter((u: any) => u.role === "company")
    
    for (const company of companies) {
      const companyId = company._id.toString()
      const companyBookings = bookings.filter((b: any) => b.userId.toString() === companyId)
      const companyPaidBookings = companyBookings.filter((b: any) => b.paymentStatus === "paid")
      
      const revenue = companyPaidBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
      
      companyRevenue.set(companyId, {
        name: `${company.firstName || ""} ${company.lastName || ""}`.trim() || company.email,
        email: company.email,
        bookings: companyBookings.length,
        revenue,
      })
    }

    const topCompanies = Array.from(companyRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentUsers = users.filter((u: any) => new Date(u.createdAt) >= sevenDaysAgo).length
    const recentBookings = bookings.filter((b: any) => new Date(b.createdAt) >= sevenDaysAgo).length
    const recentDestinations = destinations.filter((d: any) => new Date(d.createdAt) >= sevenDaysAgo).length

    // Average metrics
    const avgBookingValue = paidBookings.length > 0 
      ? totalRevenue / paidBookings.length 
      : 0
    
    const avgDestinationsPerCompany = companies.length > 0
      ? destinations.length / companies.length
      : 0

    const analytics = {
      overview: {
        totalUsers: users.length,
        totalBookings: bookings.length,
        totalRevenue,
        pendingRevenue,
        totalDestinations: destinations.length,
        totalGuides: guides.length,
        activeGuides: guides.filter((g: any) => g.isPublished).length,
        totalCompanies: usersByRole.company || 0,
        paidBookings: paidBookings.length,
        pendingBookings: pendingBookings.length,
      },
      usersByRole,
      bookingsByStatus,
      bookingsByType,
      monthlyData,
      topDestinations,
      topGuides,
      topCompanies,
      recentActivity: {
        newUsers: recentUsers,
        newBookings: recentBookings,
        newDestinations: recentDestinations,
      },
      averages: {
        avgBookingValue,
        avgDestinationsPerCompany,
      },
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching admin analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
