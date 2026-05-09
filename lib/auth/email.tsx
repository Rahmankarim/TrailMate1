import crypto from "crypto"
import nodemailer from "nodemailer"

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function getFromAddress() {
  return process.env.FROM_EMAIL || process.env.SMTP_USER
}

// Generate a random verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Generate a password reset token
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Hash a token for secure storage
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

// Send OTP verification email
export async function sendOTPEmail(email: string, firstName: string, otp: string): Promise<void> {
  const transporter = createTransporter()

  const mailOptions = {
    from: `"TrailMate" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify Your Email - TrailMate",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background-color: #1a1a1a; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">TrailMate</h1>
                      <p style="margin: 8px 0 0; color: #cccccc; font-size: 14px;">Your Adventure Awaits</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px;">Welcome, ${firstName}!</h2>
                      <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                        Thank you for joining TrailMate! Please use the verification code below to complete your registration and start exploring amazing destinations.
                      </p>
                      <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; padding: 20px 40px; background-color: #f0f0f0; border-radius: 8px; border: 2px dashed #1a1a1a;">
                          <p style="margin: 0; color: #666666; font-size: 14px; font-weight: 500;">Your Verification Code</p>
                          <p style="margin: 10px 0 0; color: #1a1a1a; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            ${otp}
                          </p>
                        </div>
                      </div>
                      <p style="margin: 30px 0 0; color: #999999; font-size: 14px; text-align: center;">
                        This code will expire in <strong>10 minutes</strong>.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        If you didn't create an account with TrailMate, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`OTP verification email sent to ${email}`)
  } catch (error) {
    console.error("Error sending OTP email:", error)
    throw new Error("Failed to send verification email")
  }
}

// Keep old function for backward compatibility
export async function sendVerificationEmail(email: string, firstName: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`

  const transporter = createTransporter()

  const mailOptions = {
    from: `"TrailMate" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify Your Email - TrailMate",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background-color: #1a1a1a; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">TrailMate</h1>
                      <p style="margin: 8px 0 0; color: #cccccc; font-size: 14px;">Your Adventure Awaits</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px;">Welcome, ${firstName}!</h2>
                      <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                        Thank you for joining TrailMate! Please verify your email address to complete your registration and start exploring amazing destinations.
                      </p>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">Verify Email Address</a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 20px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 8px 0 0; color: #1a1a1a; font-size: 14px; word-break: break-all;">
                        ${verificationUrl}
                      </p>
                      <p style="margin: 30px 0 0; color: #999999; font-size: 14px;">
                        This link will expire in 24 hours.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        If you didn't create an account with TrailMate, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Verification email sent to ${email}`)
  } catch (error) {
    console.error("Error sending verification email:", error)
    // Don't throw - we don't want to break signup if email fails
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  const transporter = createTransporter()

  const mailOptions = {
    from: `"TrailMate" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset Your Password - TrailMate",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background-color: #1a1a1a; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">TrailMate</h1>
                      <p style="margin: 8px 0 0; color: #cccccc; font-size: 14px;">Password Reset Request</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px;">Hi ${firstName},</h2>
                      <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your password. Click the button below to create a new password.
                      </p>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">Reset Password</a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 20px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 8px 0 0; color: #1a1a1a; font-size: 14px; word-break: break-all;">
                        ${resetUrl}
                      </p>
                      <p style="margin: 30px 0 0; color: #999999; font-size: 14px;">
                        This link will expire in 1 hour.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        If you didn't request a password reset, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Password reset email sent to ${email}`)
  } catch (error) {
    console.error("Error sending password reset email:", error)
  }
}

// Send welcome email after verification
export async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const transporter = createTransporter()

  const mailOptions = {
    from: `"TrailMate" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: "Welcome to TrailMate! 🏔️",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to TrailMate</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background-color: #1a1a1a; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">TrailMate</h1>
                      <p style="margin: 8px 0 0; color: #cccccc; font-size: 14px;">Your Journey Begins</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px;">Welcome aboard, ${firstName}! 🎉</h2>
                      <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                        Your email has been verified and your account is now fully activated. You're ready to explore the most breathtaking destinations in Pakistan!
                      </p>
                      <h3 style="margin: 30px 0 15px; color: #1a1a1a; font-size: 18px;">What's Next?</h3>
                      <ul style="margin: 0; padding: 0 0 0 20px; color: #666666; font-size: 16px; line-height: 1.8;">
                        <li>Browse stunning destinations across Pakistan</li>
                        <li>Connect with certified local guides</li>
                        <li>Book your dream adventure</li>
                        <li>Share your experiences with fellow travelers</li>
                      </ul>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 30px 0 10px;">
                            <a href="${baseUrl}/destinations" style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">Explore Destinations</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        Have questions? Contact us at support@trailmate.pk
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Welcome email sent to ${email}`)
  } catch (error) {
    console.error("Error sending welcome email:", error)
  }
}

export async function sendContactFormEmail(input: {
  firstName: string
  lastName: string
  email: string
  phone?: string
  inquiryType?: string
  message: string
}): Promise<void> {
  const transporter = createTransporter()
  const inbox = process.env.CONTACT_INBOX_EMAIL || "infobytrailmate@gmail.com"

  const mailOptions = {
    from: `"TrailMate Contact Form" <${getFromAddress()}>`,
    to: inbox,
    replyTo: input.email,
    subject: `Contact Form: ${input.inquiryType || "General Inquiry"}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contact Form Submission</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 32px; background-color: #1a1a1a; color: #ffffff; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; font-size: 24px;">New Contact Message</h1>
                      <p style="margin: 8px 0 0; color: #cccccc; font-size: 14px;">TrailMate contact form submission</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 32px; color: #1a1a1a;">
                      <p style="margin: 0 0 12px;"><strong>Name:</strong> ${input.firstName} ${input.lastName}</p>
                      <p style="margin: 0 0 12px;"><strong>Email:</strong> ${input.email}</p>
                      <p style="margin: 0 0 12px;"><strong>Phone:</strong> ${input.phone || "Not provided"}</p>
                      <p style="margin: 0 0 20px;"><strong>Inquiry Type:</strong> ${input.inquiryType || "General Inquiry"}</p>
                      <div style="padding: 16px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #e5e5e5;">
                        <p style="margin: 0 0 8px; font-weight: 700;">Message</p>
                        <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; color: #444444;">${input.message}</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Contact form email sent to ${inbox}`)
  } catch (error) {
    console.error("Error sending contact form email:", error)
    throw new Error("Failed to send contact message")
  }
}
