import type { ObjectId } from "mongodb"

export interface Booking {
  _id?: ObjectId
  userId: ObjectId
  destinationId?: ObjectId
  guideId?: ObjectId
  type: "destination" | "guide"
  bookingType: "destination_booking" | "guide_hiring" // destination_booking: user books destination, guide_hiring: company hires guide
  status: "pending" | "confirmed" | "completed" | "cancelled"
  paymentStatus: "unpaid" | "pending" | "paid" | "refunded" | null
  startDate: Date
  endDate: Date
  guests: number
  employees?: number // For company guide hiring
  totalPrice: number
  notes?: string
  travelerName: string
  travelerEmail: string
  travelerPhone?: string
  tourName?: string // For guide hiring
  tourDescription?: string // For guide hiring
  createdAt: Date
  updatedAt: Date
}
