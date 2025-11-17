# Google OAuth Setup Guide

## Step 1: Get Your Web Client ID from Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `hevyclone-20505`
3. Go to **Authentication** → **Sign-in method** → **Google**
4. Click on the **Web SDK configuration** section
5. Copy the **Web client ID** (format: `498861039696-xxxxx.apps.googleusercontent.com`)

## Step 2: Configure Redirect URI in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `hevyclone-20505`
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (the one with the Web client ID you copied)
5. Click **Edit**
6. Under **Authorized redirect URIs**, add:
   - `https://auth.expo.io/@dazzzelr/heavily` (works for Expo Go, development, and production builds)
   
   **Note:** Only add the Expo proxy URL above. Custom schemes like `heavily://` are not valid redirect URIs for Google OAuth.

## Step 3: Update the Client ID in Code

The client ID is already set in `utils/google-auth.ts`:
```typescript
const GOOGLE_CLIENT_ID = '498861039696-srd1s1q9nqhv4nqk4d609h2oqng8d75e.apps.googleusercontent.com';
```

## Step 4: Test the Redirect URI

When you run the app, check the console logs. You should see:
```
Redirect URI: https://auth.expo.io/@dazzzelr/heavily
```

Make sure this exact URI is added to your Google Cloud Console OAuth client configuration.

## Troubleshooting

### Error: "400 invalid request access blocked"
- Make sure the redirect URI in Google Cloud Console matches exactly what's logged in the console
- The redirect URI format should be: `https://auth.expo.io/@YOUR_USERNAME/YOUR_SLUG`

### Error: "redirect_uri_mismatch"
- Double-check that the redirect URI in Google Cloud Console matches the one being used
- For Expo, it should be: `https://auth.expo.io/@dazzzelr/heavily`

