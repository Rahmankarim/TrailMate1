import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"

// GET - Fetch company revenue data
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

    // Revenue by payment status
    const paidBookings = bookings.filter((b: any) => b.paymentStatus === "paid")
    const unpaidBookings = bookings.filter((b: any) => b.paymentStatus === "unpaid")
    const pendingBookings = bookings.filter((b: any) => b.paymentStatus === "pending")
    const refundedBookings = bookings.filter((b: any) => b.paymentStatus === "refunded")

    const totalRevenue = paidBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
    const pendingRevenue = pendingBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
    const unpaidRevenue = unpaidBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
    const refundedAmount = refundedBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)

    // Revenue by booking status
    const confirmedRevenue = paidBookings
      .filter((b: any) => b.status === "confirmed")
      .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
    
    const completedRevenue = paidBookings
      .filter((b: any) => b.status === "completed")
      .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
    
    const cancelledRevenue = paidBookings
      .filter((b: any) => b.status === "cancelled")
      .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)

    // Revenue by booking type
    const destinationBookingRevenue = paidBookings
      .filter((b: any) => b.bookingType === "destination_booking")
      .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
    
    const guideHiringRevenue = paidBookings
      .filter((b: any) => b.bookingType === "guide_hiring")
      .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)

    // Monthly revenue breakdown (last 12 months)
    const monthlyRevenue: any[] = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthPaidBookings = paidBookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt)
        return bookingDate >= monthStart && bookingDate <= monthEnd
      })

      const monthAllBookings = bookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt)
        return bookingDate >= monthStart && bookingDate <= monthEnd
      })

      const monthPending = monthAllBookings.filter((b: any) => 
        b.paymentStatus === "pending" || b.paymentStatus === "unpaid"
      )

      monthlyRevenue.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        year: monthStart.getFullYear(),
        monthNumber: monthStart.getMonth() + 1,
        totalRevenue: monthPaidBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0),
        pendingRevenue: monthPending.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0),
        bookings: monthPaidBookings.length,
        totalBookings: monthAllBookings.length,
      })
    }

    // Quarterly revenue (last 4 quarters)
    const quarterlyRevenue: any[] = []
    
    for (let i = 3; i >= 0; i--) {
      const currentQuarter = Math.floor(now.getMonth() / 3)
      const quarter = currentQuarter - i
      const year = now.getFullYear()
      
      let quarterStart: Date
      let quarterEnd: Date
      let quarterName: string
      
      if (quarter >= 0) {
        quarterStart = new Date(year, quarter * 3, 1)
        quarterEnd = new Date(year, (quarter + 1) * 3, 0)
        quarterName = `Q${quarter + 1} ${year}`
      } else {
        const prevQuarter = 4 + quarter
        quarterStart = new Date(year - 1, prevQuarter * 3, 1)
        quarterEnd = new Date(year - 1, (prevQuarter + 1) * 3, 0)
        quarterName = `Q${prevQuarter + 1} ${year - 1}`
      }
      
      const quarterBookings = paidBookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt)
        return bookingDate >= quarterStart && bookingDate <= quarterEnd
      })

      quarterlyRevenue.push({
        quarter: quarterName,
        revenue: quarterBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0),
        bookings: quarterBookings.length,
      })
    }

    // Revenue by destination
    const revenueByDestination = new Map<string, {
      name: string
      revenue: number
      bookings: number
      avgBookingValue: number
    }>()

    destinations.forEach((dest: any) => {
      const destId = dest._id.toString()
      const destBookings = paidBookings.filter((b: any) => 
        b.destinationId && b.destinationId.toString() === destId
      )
      const revenue = destBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
      
      revenueByDestination.set(destId, {
        name: dest.name,
        revenue,
        bookings: destBookings.length,
        avgBookingValue: destBookings.length > 0 ? revenue / destBookings.length : 0,
      })
    })

    const topRevenueDestinations = Array.from(revenueByDestination.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Calculate growth metrics
    const currentMonth = monthlyRevenue[monthlyRevenue.length - 1]
    const previousMonth = monthlyRevenue[monthlyRevenue.length - 2]
    const lastYearSameMonth = monthlyRevenue[0]
    
    const monthOverMonthGrowth = previousMonth && previousMonth.totalRevenue > 0
      ? ((currentMonth.totalRevenue - previousMonth.totalRevenue) / previousMonth.totalRevenue) * 100
      : 0
    
    const yearOverYearGrowth = lastYearSameMonth && lastYearSameMonth.totalRevenue > 0
      ? ((currentMonth.totalRevenue - lastYearSameMonth.totalRevenue) / lastYearSameMonth.totalRevenue) * 100
      : 0

    // Current quarter vs previous quarter
    const currentQuarterData = quarterlyRevenue[quarterlyRevenue.length - 1]
    const previousQuarterData = quarterlyRevenue[quarterlyRevenue.length - 2]
    
    const quarterOverQuarterGrowth = previousQuarterData && previousQuarterData.revenue > 0
      ? ((currentQuarterData.revenue - previousQuarterData.revenue) / previousQuarterData.revenue) * 100
      : 0

    // Projections (based on current month's daily average)
    const today = new Date()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const currentDayOfMonth = today.getDate()
    
    const projectedMonthRevenue = currentMonth.totalRevenue > 0
      ? (currentMonth.totalRevenue / currentDayOfMonth) * daysInMonth
      : 0

    // Revenue forecast (simple linear projection based on growth)
    const avgMonthlyGrowth = monthlyRevenue.slice(1).reduce((sum, month, idx) => {
      const prevMonth = monthlyRevenue[idx]
      if (prevMonth.totalRevenue > 0) {
        return sum + ((month.totalRevenue - prevMonth.totalRevenue) / prevMonth.totalRevenue)
      }
      return sum
    }, 0) / (monthlyRevenue.length - 1)

    const nextMonthForecast = currentMonth.totalRevenue * (1 + avgMonthlyGrowth)

    const revenueData = {
      summary: {
        totalRevenue,
        pendingRevenue,
        unpaidRevenue,
        refundedAmount,
        paidBookings: paidBookings.length,
        pendingBookings: pendingBookings.length,
        unpaidBookings: unpaidBookings.length,
        refundedBookings: refundedBookings.length,
      },
      revenueByStatus: {
        confirmed: confirmedRevenue,
        completed: completedRevenue,
        cancelled: cancelledRevenue,
      },
      revenueByType: {
        destinationBooking: destinationBookingRevenue,
        guideHiring: guideHiringRevenue,
      },
      monthlyRevenue,
      quarterlyRevenue,
      topRevenueDestinations,
      growth: {
        monthOverMonth: monthOverMonthGrowth,
        yearOverYear: yearOverYearGrowth,
        quarterOverQuarter: quarterOverQuarterGrowth,
      },
      projections: {
        currentMonthProjected: projectedMonthRevenue,
        nextMonthForecast,
      },
      averages: {
        avgBookingValue: paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0,
        avgMonthlyRevenue: monthlyRevenue.reduce((sum, m) => sum + m.totalRevenue, 0) / monthlyRevenue.length,
        avgQuarterlyRevenue: quarterlyRevenue.reduce((sum, q) => sum + q.revenue, 0) / quarterlyRevenue.length,
      },
    }

    return NextResponse.json(revenueData)
  } catch (error) {
    console.error("Error fetching company revenue:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
