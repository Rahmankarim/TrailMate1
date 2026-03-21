# Signin Debug Instructions

## Steps to Debug:

1. **Open Browser DevTools** (F12)
2. **Go to Application tab** → Cookies → http://localhost:3000
3. **Clear ALL cookies** for localhost:3000
4. **Go to Console tab**
5. **Go to signin page**: http://localhost:3000/signin
6. **Enter credentials and click Sign In**

## What to Check:

### In Console:

Look for these logs:

- "Attempting signin..."
- "Signin result: {success: true, hasUser: true, role: 'company'}"
- "Redirecting to: /dashboard/company"

### In Application → Cookies:

After signin, check if these cookies exist:

- `access_token` (should exist)
- `refresh_token` (should exist)

### If cookies DON'T exist:

The problem is cookies aren't being set by the API

### If cookies DO exist but redirect fails:

The problem is with the redirect logic

## Quick Fix to Try:

Instead of using browser, try this:

1. Clear browser data completely
2. Close browser
3. Reopen and try again

OR

Try in Incognito/Private window
