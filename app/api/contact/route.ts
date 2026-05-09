import { type NextRequest, NextResponse } from "next/server"
import { sendContactFormEmail } from "@/lib/auth/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const firstName = String(body.firstName || "").trim()
    const lastName = String(body.lastName || "").trim()
    const email = String(body.email || "").trim()
    const phone = String(body.phone || "").trim()
    const inquiryType = String(body.inquiryType || "General Inquiry").trim()
    const message = String(body.message || "").trim()

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { success: false, message: "First name, last name, email, and message are required" },
        { status: 400 }
      )
    }

    await sendContactFormEmail({
      firstName,
      lastName,
      email,
      phone,
      inquiryType,
      message,
    })

    return NextResponse.json({ success: true, message: "Message sent successfully" })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to send message",
      },
      { status: 500 }
    )
  }
}