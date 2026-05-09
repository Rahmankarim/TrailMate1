"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, CheckCircle } from "lucide-react"

const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    value: "support@trailmate.com",
    description: "We'll respond within 24 hours",
  },
  {
    icon: Phone,
    title: "Call Us",
    value: "+92 51 123 4567",
    description: "Mon-Fri, 9am-6pm PKT",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    value: "Islamabad, Pakistan",
    description: "F-7 Markaz, Blue Area",
  },
  {
    icon: Clock,
    title: "Working Hours",
    value: "9:00 AM - 6:00 PM",
    description: "Monday to Saturday",
  },
]

const inquiryTypes = [
  "General Inquiry",
  "Booking Question",
  "Become a Guide",
  "Partnership Opportunity",
  "Technical Support",
  "Feedback",
]

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inquiryType, setInquiryType] = useState("general-inquiry")
  const [submitError, setSubmitError] = useState("")
  const heroBackground = "/islamabad-pakistan-map.jpg"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const form = e.currentTarget as HTMLFormElement
    const formData = new FormData(form)

    try {
      setSubmitError("")
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: String(formData.get("firstName") || ""),
          lastName: String(formData.get("lastName") || ""),
          email: String(formData.get("email") || ""),
          phone: String(formData.get("phone") || ""),
          inquiryType,
          message: String(formData.get("message") || ""),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to send message")
      }

      form.reset()
      setInquiryType("general-inquiry")
      setIsSubmitted(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-12 px-6">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/60 to-foreground/25" />
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-background mb-4 text-balance">Get In Touch</h1>
          <p className="text-xl text-background/85 max-w-2xl mx-auto text-pretty">
            Have a question or want to plan your next adventure? We're here to help you every step of the way.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <info.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{info.title}</h3>
                  <p className="text-foreground font-medium mb-1">{info.value}</p>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Send Us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-chart-2/20 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-chart-2" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Message Sent!</h3>
                      <p className="text-muted-foreground mb-6">
                        Thank you for reaching out. We'll get back to you within 24 hours.
                      </p>
                      <Button onClick={() => setIsSubmitted(false)} variant="outline">
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" name="firstName" placeholder="John" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" name="lastName" placeholder="Doe" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input id="phone" name="phone" type="tel" placeholder="+92 300 1234567" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inquiryType">Inquiry Type</Label>
                        <Select value={inquiryType} onValueChange={setInquiryType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select inquiry type" />
                          </SelectTrigger>
                          <SelectContent>
                            {inquiryTypes.map((type) => (
                              <SelectItem key={type} value={type.toLowerCase().replace(/\s+/g, "-")}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <input type="hidden" name="inquiryType" value={inquiryType} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Your Message</Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Tell us about your inquiry..."
                          rows={5}
                          required
                          className="resize-none"
                        />
                      </div>
                      {submitError && (
                        <p className="text-sm text-destructive">{submitError}</p>
                      )}
                      <Button
                        type="submit"
                        className="w-full bg-foreground text-background hover:bg-foreground/90 h-12"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          "Sending..."
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Map & Additional Info */}
            <div className="space-y-6">
              {/* Map Placeholder */}
              <Card className="overflow-hidden">
                <div className="h-[300px] bg-secondary relative">
                  <img src="/islamabad-pakistan-map.jpg" alt="Map location" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-foreground/10 flex items-center justify-center">
                    <div className="bg-background p-4 rounded-xl shadow-lg">
                      <MapPin className="h-6 w-6 text-foreground mx-auto mb-2" />
                      <p className="font-semibold text-foreground">TrailMate HQ</p>
                      <p className="text-sm text-muted-foreground">F-7 Markaz, Islamabad</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* FAQ Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">How do I book a tour?</h4>
                    <p className="text-sm text-muted-foreground">
                      Browse our destinations, select your preferred trip, and click "Book Now" to start.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Can I cancel my booking?</h4>
                    <p className="text-sm text-muted-foreground">
                      Free cancellation is available up to 14 days before your trip start date.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">How do I become a guide?</h4>
                    <p className="text-sm text-muted-foreground">
                      Sign up as a guide, complete your profile, and submit your certifications for review.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
