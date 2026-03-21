import { type NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"

// GET - Export company analytics as CSV
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

    // Fetch analytics data
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/company/revenue`, {
      headers: {
        Cookie: `access_token=${token}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
    }

    const revenueData = await response.json()

    // Generate CSV content
    const csv = generateRevenueCSV(revenueData)

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="revenue-report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateRevenueCSV(revenueData: any): string {
  const lines: string[] = []

  // Header
  lines.push("Revenue Report")
  lines.push(`Generated: ${new Date().toLocaleString()}`)
  lines.push("")

  // Summary
  lines.push("Summary")
  lines.push("Metric,Value")
  lines.push(`Total Revenue,PKR ${revenueData.summary.totalRevenue}`)
  lines.push(`Pending Revenue,PKR ${revenueData.summary.pendingRevenue}`)
  lines.push(`Paid Bookings,${revenueData.summary.paidBookings}`)
  lines.push(`Pending Bookings,${revenueData.summary.pendingBookings}`)
  lines.push("")

  // Monthly Revenue
  lines.push("Monthly Revenue")
  lines.push("Month,Revenue,Bookings")
  revenueData.monthlyRevenue.forEach((month: any) => {
    lines.push(`${month.month},PKR ${month.totalRevenue},${month.bookings}`)
  })
  lines.push("")

  // Growth Metrics
  lines.push("Growth Metrics")
  lines.push("Metric,Value")
  lines.push(`Month over Month,${revenueData.growth.monthOverMonth.toFixed(2)}%`)
  lines.push(`Year over Year,${revenueData.growth.yearOverYear.toFixed(2)}%`)
  lines.push(`Quarter over Quarter,${revenueData.growth.quarterOverQuarter.toFixed(2)}%`)
  lines.push("")

  // Top Revenue Destinations
  if (revenueData.topRevenueDestinations && revenueData.topRevenueDestinations.length > 0) {
    lines.push("Top Revenue Destinations")
    lines.push("Destination,Revenue,Bookings,Avg Booking Value")
    revenueData.topRevenueDestinations.forEach((dest: any) => {
      lines.push(`${dest.name},PKR ${dest.revenue},${dest.bookings},PKR ${dest.avgBookingValue.toFixed(2)}`)
    })
  }

  return lines.join("\n")
}
