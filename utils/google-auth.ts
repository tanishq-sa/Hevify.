import { auth } from '@/config/firebase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { Platform } from 'react-native';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '498861039696-srd1s1q9nqhv4nqk4d609h2oqng8d75e.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const signInWithGoogle = async () => {
  try {
    // For web, use authorization code flow; for mobile, use implicit flow (IdToken)
    let redirectUri: string;
    let responseType: AuthSession.ResponseType;
    
    if (Platform.OS === 'web') {
      // On web, use the current origin with authorization code flow
      redirectUri = AuthSession.makeRedirectUri({
        native: typeof window !== 'undefined' ? window.location.origin : '',
      });
      responseType = AuthSession.ResponseType.Code;
    } else {
      // On mobile, use Expo proxy URL with implicit flow (IdToken)
      redirectUri = 'https://auth.expo.io/@dazzzelr/heavily';
      responseType = AuthSession.ResponseType.IdToken;
    }

    console.log('Platform:', Platform.OS);
    console.log('Redirect URI:', redirectUri);
    console.log('Response Type:', responseType);
    console.log('⚠️ Make sure this URI is added to Google Cloud Console OAuth client authorized redirect URIs');

    // Request for Google OAuth
    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      responseType,
      redirectUri,
      usePKCE: Platform.OS === 'web', // Only use PKCE on web
    });

    const result = await request.promptAsync(discovery);

    if (result.type === 'success') {
      let idToken: string | null = null;

      if (responseType === AuthSession.ResponseType.IdToken) {
        // Mobile: Get ID token directly from the result
        if (result.authentication?.idToken) {
          idToken = result.authentication.idToken;
        } else if (result.params?.id_token) {
          idToken = result.params.id_token as string;
        }
      } else {
        // Web: Exchange authorization code for ID token
        if (result.params.code) {
          const tokenResponse = await fetch(discovery.tokenEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: GOOGLE_CLIENT_ID,
              code: result.params.code as string,
              grant_type: 'authorization_code',
              redirect_uri: redirectUri,
              code_verifier: request.codeVerifier || '',
            }).toString(),
          });

          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token exchange error:', errorText);
            throw new Error(`Token exchange failed: ${errorText}`);
          }

          const tokens = await tokenResponse.json();
          idToken = tokens.id_token;
        }
      }

      if (idToken) {
        // Create credential from Google ID token
        const credential = GoogleAuthProvider.credential(idToken);
        
        // Sign in with Firebase
        const userCredential = await signInWithCredential(auth, credential);
        return userCredential;
      } else {
        console.error('Result:', result);
        throw new Error('Failed to get ID token from Google');
      }
    }

    throw new Error('Google sign-in was cancelled');
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};
