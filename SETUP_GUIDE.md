# Quick Setup Guide - Email Verification

## ✅ What Was Implemented

Your TrailMate app now has a complete email verification flow using OTP codes!

### New Features:

1. **6-Digit OTP Codes** - Secure verification via email
2. **Pending Verification System** - Users created only after verification
3. **Email Verification Check** - Login blocked until email verified
4. **OTP Expiration** - 10-minute validity with auto-cleanup
5. **Attempt Limiting** - Max 5 failed attempts before reset
6. **Resend Functionality** - Users can request new codes

## 🚀 Setup Steps

### 1. Configure Gmail for Sending Emails

Update your [.env.local](.env.local) file with your Gmail credentials:

```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
FROM_EMAIL=your-email@gmail.com
```

**To get Gmail App Password:**

1. Visit: https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Visit: https://myaccount.google.com/apppasswords
4. Create new app password for "Mail"
5. Copy the 16-character password (no spaces)
6. Paste into `SMTP_PASS` in `.env.local`

### 2. Restart Your Server

```bash
npm run dev
```

## 📝 How It Works

### User Signup Flow:

1. User fills signup form → clicks "Create Account"
2. System sends 6-digit OTP to their email
3. User redirected to verification page
4. User enters OTP code
5. Account created after successful verification
6. User can now sign in

### What Changed:

- ❌ **Before:** Users created immediately, could login without verification
- ✅ **Now:** Users must verify email before account creation

## 🧪 Testing

1. **Sign Up**: Go to http://localhost:3000/signup
2. **Check Email**: Look for OTP code in inbox (check spam too!)
3. **Verify**: Enter code on verify page
4. **Sign In**: Login with your credentials

## 📁 Files Changed

### New Files:

- `lib/db/models/pending-verification.ts` - Temporary user storage
- `lib/auth/otp.ts` - OTP generation utilities
- `EMAIL_VERIFICATION_DOCS.md` - Complete documentation

### Updated Files:

- `app/api/auth/signup/route.ts` - OTP signup flow
- `app/api/auth/verify-email/route.ts` - OTP verification
- `app/api/auth/signin/route.ts` - Verification check
- `app/api/auth/resend-verification/route.ts` - Resend OTP
- `app/verify-email/verify-email-content.tsx` - OTP input UI
- `app/signup/signup-form.tsx` - Redirect logic
- `lib/auth/email.tsx` - OTP email template
- `.env.local` - SMTP configuration

## 🔒 Security Features

✅ Passwords hashed with bcrypt
✅ OTP expires in 10 minutes
✅ Max 5 verification attempts
✅ Generic error messages (no email enumeration)
✅ Auto-cleanup of expired verifications

## ⚠️ Important Notes

1. **Gmail Required**: You need a Gmail account to send emails
2. **App Password**: Use Gmail app password, NOT your regular password
3. **2FA Required**: Gmail requires 2-factor authentication enabled
4. **MongoDB**: Make sure MongoDB is running locally or use Atlas

## 🐛 Troubleshooting

### Emails Not Sending?

- Check SMTP credentials in `.env.local`
- Verify app password is correct (16 characters, no spaces)
- Make sure 2FA is enabled on your Gmail
- Check spam folder

### OTP Invalid?

- Codes expire in 10 minutes
- Check for typos
- Request new code if expired

### Can't Sign In?

- Make sure you verified your email
- Check "Please verify your email" error message
- Resend verification code if needed

## 📚 Full Documentation

See [EMAIL_VERIFICATION_DOCS.md](EMAIL_VERIFICATION_DOCS.md) for complete documentation including:

- API endpoint details
- Database schema
- Security implementation
- Advanced configuration

## 🎉 You're All Set!

Once you configure Gmail credentials, the email verification system will work automatically. Users will now need to verify their email before they can sign in.
