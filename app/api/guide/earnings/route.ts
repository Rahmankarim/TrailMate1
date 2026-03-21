import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"

// GET - Fetch guide earnings data
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload || payload.role !== "guide") {
      return NextResponse.json({ error: "Forbidden - Guide access required" }, { status: 403 })
    }

    const userId = new ObjectId(payload.userId)
    const db = await getDatabase()

    // Find guide profile
    const guideProfile = await db.collection("guides").findOne({ userId })
    
    if (!guideProfile) {
      return NextResponse.json({ error: "Guide profile not found" }, { status: 404 })
    }

    // Fetch guide's bookings
    const bookings = await db.collection("bookings")
      .find({ guideId: guideProfile._id })
      .toArray()

    // Fetch destinations for reference
    const destinations = await db.collection("destinations").find({}).toArray()

    // Calculate earnings by payment status
    const paidBookings = bookings.filter((b: any) => b.paymentStatus === "paid")
    const unpaidBookings = bookings.filter((b: any) => b.paymentStatus === "unpaid")
    const pendingBookings = bookings.filter((b: any) => b.paymentStatus === "pending")

    const totalEarnings = paidBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
    const pendingEarnings = pendingBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
    const unpaidEarnings = unpaidBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)

    // Calculate earnings by booking status
    const completedEarnings = paidBookings
      .filter((b: any) => b.status === "completed")
      .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
    
    const confirmedEarnings = paidBookings
      .filter((b: any) => b.status === "confirmed")
      .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
    
    const upcomingBookings = bookings.filter((b: any) => {
      const startDate = new Date(b.startDate)
      return startDate > new Date() && b.status !== "cancelled"
    })
    const upcomingEarnings = upcomingBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)

    // Monthly earnings (last 12 months)
    const monthlyEarnings: any[] = []
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

      monthlyEarnings.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        year: monthStart.getFullYear(),
        monthNumber: monthStart.getMonth() + 1,
        earnings: monthPaidBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0),
        bookings: monthPaidBookings.length,
        totalBookings: monthAllBookings.length,
      })
    }

    // Weekly earnings (last 8 weeks)
    const weeklyEarnings: any[] = []
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7))
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      
      const weekPaidBookings = paidBookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt)
        return bookingDate >= weekStart && bookingDate < weekEnd
      })

      weeklyEarnings.push({
        week: `Week ${8 - i}`,
        date: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        earnings: weekPaidBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0),
        bookings: weekPaidBookings.length,
      })
    }

    // Daily earnings (last 30 days)
    const dailyEarnings: any[] = []
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const dayPaidBookings = paidBookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt)
        return bookingDate >= date && bookingDate < nextDay
      })

      dailyEarnings.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        earnings: dayPaidBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0),
        bookings: dayPaidBookings.length,
      })
    }

    // Earnings by destination/tour
    const earningsByDestination = new Map<string, {
      name: string
      earnings: number
      bookings: number
      avgEarning: number
    }>()

    paidBookings.forEach((booking: any) => {
      let destName = booking.tourName || "Direct Hire"
      
      if (booking.destinationId) {
        const dest = destinations.find((d: any) => 
          d._id.toString() === booking.destinationId.toString()
        )
        if (dest) {
          destName = dest.name
        }
      }

      const key = destName
      if (!earningsByDestination.has(key)) {
        earningsByDestination.set(key, {
          name: destName,
          earnings: 0,
          bookings: 0,
          avgEarning: 0,
        })
      }

      const data = earningsByDestination.get(key)!
      data.earnings += booking.totalPrice || 0
      data.bookings += 1
      data.avgEarning = data.earnings / data.bookings
    })

    const topEarningTours = Array.from(earningsByDestination.values())
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 10)

    // Recent transactions (last 20)
    const recentTransactions = paidBookings
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map((booking: any) => {
        let destinationName = booking.tourName || "Direct Hire"
        
        if (booking.destinationId) {
          const dest = destinations.find((d: any) => 
            d._id.toString() === booking.destinationId.toString()
          )
          if (dest) {
            destinationName = dest.name
          }
        }

        return {
          _id: booking._id.toString(),
          amount: booking.totalPrice,
          destination: destinationName,
          date: booking.createdAt,
          status: booking.paymentStatus,
          bookingStatus: booking.status,
        }
      })

    // Calculate growth metrics
    const currentMonth = monthlyEarnings[monthlyEarnings.length - 1]
    const previousMonth = monthlyEarnings[monthlyEarnings.length - 2]
    const lastYearSameMonth = monthlyEarnings[0]
    
    const monthOverMonthGrowth = previousMonth && previousMonth.earnings > 0
      ? ((currentMonth.earnings - previousMonth.earnings) / previousMonth.earnings) * 100
      : 0
    
    const yearOverYearGrowth = lastYearSameMonth && lastYearSameMonth.earnings > 0
      ? ((currentMonth.earnings - lastYearSameMonth.earnings) / lastYearSameMonth.earnings) * 100
      : 0

    // This month's earnings
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthBookings = paidBookings.filter((b: any) => {
      const bookingDate = new Date(b.createdAt)
      return bookingDate >= thisMonthStart
    })
    const thisMonthEarnings = thisMonthBookings.reduce(
      (sum: number, b: any) => sum + (b.totalPrice || 0), 
      0
    )

    // This week's earnings
    const thisWeekStart = new Date()
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
    thisWeekStart.setHours(0, 0, 0, 0)
    
    const thisWeekBookings = paidBookings.filter((b: any) => {
      const bookingDate = new Date(b.createdAt)
      return bookingDate >= thisWeekStart
    })
    const thisWeekEarnings = thisWeekBookings.reduce(
      (sum: number, b: any) => sum + (b.totalPrice || 0), 
      0
    )

    const earningsData = {
      summary: {
        totalEarnings,
        pendingEarnings,
        unpaidEarnings,
        completedEarnings,
        confirmedEarnings,
        upcomingEarnings,
        thisMonthEarnings,
        thisWeekEarnings,
        paidBookings: paidBookings.length,
        pendingBookings: pendingBookings.length,
        unpaidBookings: unpaidBookings.length,
        upcomingBookings: upcomingBookings.length,
        totalBookings: bookings.length,
      },
      monthlyEarnings,
      weeklyEarnings,
      dailyEarnings,
      topEarningTours,
      recentTransactions,
      growth: {
        monthOverMonth: monthOverMonthGrowth,
        yearOverYear: yearOverYearGrowth,
      },
      averages: {
        avgEarningPerBooking: paidBookings.length > 0 
          ? totalEarnings / paidBookings.length 
          : 0,
        avgMonthlyEarnings: monthlyEarnings.reduce((sum, m) => sum + m.earnings, 0) / monthlyEarnings.length,
        avgWeeklyEarnings: weeklyEarnings.reduce((sum, w) => sum + w.earnings, 0) / weeklyEarnings.length,
      },
    }

    return NextResponse.json(earningsData)
  } catch (error) {
    console.error("Error fetching guide earnings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
