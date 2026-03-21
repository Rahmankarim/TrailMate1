import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"

// GET - Fetch company analytics
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload || payload.role !== "company") {
      return NextResponse.json({ error: "Forbidden - Company access required" }, { status: 403 })
    }

    const userId = new ObjectId(payload.userId)
    const db = await getDatabase()

    // Fetch company's destinations first
    const destinations = await db.collection("destinations").find({ userId }).toArray()
    const destinationIds = destinations.map(d => d._id)

    // Fetch bookings for company's destinations (only destination_booking type)
    const bookings = destinationIds.length > 0 
      ? await db.collection("bookings").find({ 
          destinationId: { $in: destinationIds },
          bookingType: "destination_booking" 
        }).toArray()
      : []

    // Calculate revenue metrics
    const paidBookings = bookings.filter((b: any) => b.paymentStatus === "paid")
    const totalRevenue = paidBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
    
    const pendingBookings = bookings.filter((b: any) => 
      b.paymentStatus === "unpaid" || b.paymentStatus === "pending"
    )
    const pendingRevenue = pendingBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)

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

    // Monthly data (last 12 months)
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

    // Weekly data (last 8 weeks)
    const weeklyData: any[] = []
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7))
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      
      const weekBookings = paidBookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt)
        return bookingDate >= weekStart && bookingDate < weekEnd
      })

      const allWeekBookings = bookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt)
        return bookingDate >= weekStart && bookingDate < weekEnd
      })

      weeklyData.push({
        week: `Week ${8 - i}`,
        date: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: weekBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0),
        bookings: allWeekBookings.length,
      })
    }

    // Daily data (last 7 days)
    const dailyData: any[] = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const dayBookings = paidBookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt)
        return bookingDate >= date && bookingDate < nextDay
      })

      const allDayBookings = bookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt)
        return bookingDate >= date && bookingDate < nextDay
      })

      dailyData.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: dayBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0),
        bookings: allDayBookings.length,
      })
    }

    // Destination performance
    const destinationPerformance = new Map<string, { 
      name: string
      bookings: number
      revenue: number
      views: number
      conversionRate: number
    }>()
    
    destinations.forEach((dest: any) => {
      const destId = dest._id.toString()
      const destBookings = bookings.filter((b: any) => 
        b.destinationId && b.destinationId.toString() === destId
      )
      const destPaidBookings = destBookings.filter((b: any) => b.paymentStatus === "paid")
      const views = dest.views || 0
      const conversionRate = views > 0 ? (destBookings.length / views) * 100 : 0
      
      destinationPerformance.set(destId, {
        name: dest.name,
        bookings: destBookings.length,
        revenue: destPaidBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0),
        views,
        conversionRate,
      })
    })

    const topDestinations = Array.from(destinationPerformance.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10)

    const topRevenueDestinations = Array.from(destinationPerformance.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentBookings = bookings.filter((b: any) => new Date(b.createdAt) >= thirtyDaysAgo)
    const recentRevenue = recentBookings
      .filter((b: any) => b.paymentStatus === "paid")
      .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)

    // Growth calculations
    const currentMonth = monthlyData[monthlyData.length - 1]
    const previousMonth = monthlyData[monthlyData.length - 2]
    
    const revenueGrowth = previousMonth && previousMonth.revenue > 0
      ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
      : 0
    
    const bookingGrowth = previousMonth && previousMonth.bookings > 0
      ? ((currentMonth.bookings - previousMonth.bookings) / previousMonth.bookings) * 100
      : 0

    // Average metrics
    const avgBookingValue = paidBookings.length > 0 
      ? totalRevenue / paidBookings.length 
      : 0
    
    const totalViews = destinations.reduce((sum: number, d: any) => sum + (d.views || 0), 0)
    const overallConversionRate = totalViews > 0 
      ? (bookings.length / totalViews) * 100 
      : 0

    const analytics = {
      overview: {
        totalBookings: bookings.length,
        totalRevenue,
        pendingRevenue,
        totalDestinations: destinations.length,
        publishedDestinations: destinations.filter((d: any) => d.isPublished).length,
        paidBookings: paidBookings.length,
        pendingBookings: pendingBookings.length,
        totalViews,
        conversionRate: overallConversionRate,
      },
      growth: {
        revenueGrowth,
        bookingGrowth,
      },
      bookingsByStatus,
      bookingsByType,
      monthlyData,
      weeklyData,
      dailyData,
      destinationPerformance: topDestinations,
      topRevenueDestinations,
      recentActivity: {
        bookings: recentBookings.length,
        revenue: recentRevenue,
      },
      averages: {
        avgBookingValue,
        avgBookingsPerDestination: destinations.length > 0 
          ? bookings.length / destinations.length 
          : 0,
      },
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching company analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
