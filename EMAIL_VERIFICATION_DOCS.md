# Email Verification Implementation - TrailMate

## Overview

This implementation adds a secure email verification flow using OTP (One-Time Password) codes. Users must verify their email before their account is created in the database.

## Implementation Summary

### 1. Database Schema

#### Users Collection

- `isVerified`: boolean - Indicates if email is verified
- All users created through the new flow have `isVerified: true`

#### Pending Verifications Collection (New)

- `email`: string - User's email address
- `password`: string - Hashed password
- `firstName`: string
- `lastName`: string
- `role`: string - User role (traveler, guide, company)
- `phone`: string (optional)
- `otp`: string - 6-digit verification code
- `expiresAt`: Date - OTP expiration time (10 minutes)
- `createdAt`: Date
- `attempts`: number - Failed verification attempts

### 2. Authentication Flow

#### Signup Flow

1. User submits signup form → `/api/auth/signup`
2. System validates input and checks for existing users
3. Password is hashed using bcrypt
4. 6-digit OTP is generated
5. Data stored in `pending_verifications` collection
6. OTP sent via email using Nodemailer
7. User redirected to `/verify-email` page

#### Email Verification Flow

1. User receives email with 6-digit OTP code
2. User enters email and OTP on `/verify-email` page
3. System validates OTP and expiration
4. If valid:
   - User account created in `users` collection with `isVerified: true`
   - Pending verification deleted
   - Welcome email sent
   - User redirected to signin page
5. If invalid:
   - Attempt counter incremented
   - After 5 failed attempts, pending verification deleted

#### Signin Flow

1. User submits credentials → `/api/auth/signin`
2. System checks if user exists
3. Verifies email is verified (`isVerified: true`)
4. Validates password
5. Generates JWT tokens
6. User logged in

### 3. API Endpoints

#### POST `/api/auth/signup`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "traveler",
  "phone": "+1234567890"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Verification code sent to your email. Please check your inbox."
}
```

#### POST `/api/auth/verify-email`

**Request:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Email verified successfully! Your account has been created. Please sign in."
}
```

**Response (Invalid OTP):**

```json
{
  "success": false,
  "message": "Invalid verification code. 3 attempts remaining."
}
```

#### POST `/api/auth/resend-verification`

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "A new verification code has been sent to your email."
}
```

#### POST `/api/auth/signin`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (Unverified):**

```json
{
  "success": false,
  "message": "Please verify your email address before signing in. Check your inbox for the verification code."
}
```

### 4. Security Features

✅ **Password Hashing**: bcrypt with salt rounds
✅ **OTP Expiration**: 10 minutes validity
✅ **Rate Limiting**: Max 5 verification attempts
✅ **Auto Cleanup**: Expired/failed verifications deleted
✅ **Email Validation**: Regex pattern matching
✅ **Password Strength**: Enforced via validation
✅ **No Enumeration**: Generic error messages

### 5. Email Templates

The system sends three types of emails:

1. **OTP Verification Email** - Contains 6-digit code
2. **Welcome Email** - Sent after successful verification
3. **Password Reset Email** - For forgotten passwords

### 6. Configuration Required

#### Environment Variables (.env.local)

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/trailmate

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Setting up Gmail App Password

1. Go to Google Account: https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Create new app password for "Mail"
5. Copy the 16-character password
6. Add to `.env.local` as `SMTP_PASS`

### 7. Files Created/Modified

#### New Files:

- `lib/db/models/pending-verification.ts` - Model definition
- `lib/auth/otp.ts` - OTP generation and validation utilities

#### Modified Files:

- `app/api/auth/signup/route.ts` - Updated to use OTP flow
- `app/api/auth/verify-email/route.ts` - Updated for OTP verification
- `app/api/auth/signin/route.ts` - Added verification check
- `app/api/auth/resend-verification/route.ts` - Updated for OTP resend
- `app/verify-email/verify-email-content.tsx` - New OTP input UI
- `app/signup/signup-form.tsx` - Redirect to verify page
- `lib/auth/email.tsx` - Added OTP email template
- `.env.local` - Added SMTP configuration

### 8. Testing the Flow

1. **Start MongoDB**: `mongod --dbpath C:/data/db`
2. **Start Dev Server**: `npm run dev`
3. **Sign Up**: Visit http://localhost:3000/signup
4. **Check Email**: Look for 6-digit OTP code
5. **Verify**: Enter code on verify page
6. **Sign In**: Use credentials to log in

### 9. Database Cleanup

Expired pending verifications should be cleaned up periodically. Consider adding a cron job:

```javascript
// Clean up expired verifications (older than 24 hours)
await pendingVerificationsCollection.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
});
```

### 10. Future Enhancements

- [ ] Add rate limiting on resend verification
- [ ] Implement background job for cleanup
- [ ] Add SMS verification option
- [ ] Support for multiple email providers
- [ ] Email template customization in admin panel
- [ ] Verification analytics dashboard

## Troubleshooting

### Email Not Sending

- Check SMTP credentials in `.env.local`
- Verify Gmail app password is correct
- Check firewall/antivirus blocking port 587
- Review server logs for detailed errors

### OTP Expired

- Default expiry is 10 minutes
- User must request new code via resend

### User Already Exists

- Check if email is in `users` collection
- If in `pending_verifications`, delete and retry signup

### MongoDB Connection Error

- Ensure MongoDB is running
- Verify `MONGODB_URI` in `.env.local`
- Check MongoDB service status

## Support

For issues or questions, contact the development team.
