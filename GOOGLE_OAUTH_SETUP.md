# Google OAuth Setup Guide for HomeEasy

## Overview

Google OAuth login functionality has been implemented for your HomeEasy application! This guide will help you complete the final setup steps to enable Google authentication.

## 🎯 Current Status

✅ **Backend Implementation Complete**

- Google OAuth strategy configured in Passport.js
- Google ID token verification endpoint (`/api/auth/google/verify`)
- Random password generation for OAuth users
- Database schema updated with `googleId` and `emailVerified` fields

✅ **Frontend Implementation Complete**

- GoogleLoginButton component with Google Identity Services
- Auth context extended with Google login functionality
- API service updated with Google OAuth endpoint
- Login page integrated with Google authentication
- TypeScript definitions for Google Identity Services

✅ **Environment Variables Added**

- Backend `.env` updated with Google OAuth placeholders
- Frontend `.env` updated with Google client ID placeholder

✅ **Translations Added**

- English and Vietnamese translations for Google OAuth UI

## 🚀 Setup Instructions

### Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**

   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a New Project (or select existing)**

   - Click "Select a project" → "New Project"
   - Enter project name: `GiupViecVat-OAuth`
   - Click "Create"

3. **Enable Google+ API**

   - In the sidebar, go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click on it and press "Enable"

4. **Create OAuth 2.0 Credentials**

   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" user type
     - Fill in required fields:
       - App name: `GiupViecVat`
       - User support email: your email
       - Developer contact information: your email
     - Add scopes: `email`, `profile`, `openid`
     - Add test users (your email for testing)

5. **Configure OAuth Client ID**

   - Application type: "Web application"
   - Name: `GiupViecVat Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `http://localhost:5173` (Vite dev server)
     - Add your production domain when ready
   - Authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback`
     - Add your production API domain when ready

6. **Copy Credentials**
   - Copy the "Client ID" and "Client Secret"

### Step 2: Update Environment Variables

1. **Backend Environment (`.env`)**

   ```env
   # Replace with your actual Google OAuth credentials
   GOOGLE_CLIENT_ID=your-actual-google-client-id
   GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
   FRONTEND_URL=http://localhost:3000
   ```

2. **Frontend Environment (`.env`)**
   ```env
   # Replace with your actual Google Client ID (same as backend)
   VITE_GOOGLE_CLIENT_ID=your-actual-google-client-id
   ```

### Step 3: Test the Implementation

1. **Start both servers:**

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Test Google OAuth Flow:**
   - Navigate to `http://localhost:3000/login`
   - Click the "Continue with Google" button
   - Complete the Google authentication
   - Verify user is logged in successfully

### Step 4: Verification Checklist

✅ Google Cloud Console project created
✅ OAuth consent screen configured
✅ OAuth 2.0 client ID created
✅ Environment variables updated with real credentials
✅ Both servers running
✅ Google login button appears on login page
✅ Google authentication flow works
✅ User can log in with Google account
✅ User data is saved to database with Google ID

## 🔧 Troubleshooting

### Common Issues:

1. **"Invalid client ID" error**

   - Verify `VITE_GOOGLE_CLIENT_ID` matches the Client ID from Google Cloud Console
   - Check that JavaScript origins are correctly configured

2. **"Redirect URI mismatch" error**

   - Ensure `http://localhost:5000/api/auth/google/callback` is added to authorized redirect URIs
   - Check that `FRONTEND_URL` in backend `.env` is correct

3. **Google button not appearing**

   - Check browser console for JavaScript errors
   - Verify Google Identity Services script is loading
   - Ensure `VITE_GOOGLE_CLIENT_ID` environment variable is set

4. **"Access blocked" error**
   - Make sure your email is added as a test user in OAuth consent screen
   - Verify all required scopes are added

### Debug Steps:

1. Check browser console for errors
2. Verify environment variables are loaded:
   ```javascript
   console.log("Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
   ```
3. Check backend logs for authentication errors
4. Verify database connection and user creation

## 🌟 Features Included

- **Seamless Integration**: Google login works alongside traditional email/password authentication
- **Automatic User Creation**: New Google users are automatically created with random passwords
- **Email Verification**: Google accounts are marked as email-verified
- **Multi-language Support**: English and Vietnamese translations included
- **Type Safety**: Full TypeScript support for Google OAuth functionality
- **Error Handling**: Comprehensive error handling for OAuth failures

## 🚀 Production Deployment

When deploying to production:

1. **Update OAuth Configuration:**

   - Add production domains to authorized JavaScript origins
   - Add production API domain to authorized redirect URIs

2. **Environment Variables:**

   - Update `FRONTEND_URL` to production frontend URL
   - Keep same Google Client ID and Secret

3. **Security:**
   - Ensure all environment variables are secure
   - Use HTTPS for production domains
   - Keep Google Client Secret secure and never expose in frontend

## 📞 Support

If you encounter any issues during setup:

1. Check the troubleshooting section above
2. Verify all credentials are correctly configured
3. Test with a simple OAuth flow first
4. Check Google Cloud Console for any configuration issues

Your Google OAuth implementation is now ready! Users can seamlessly sign in with their Google accounts alongside traditional authentication methods.
