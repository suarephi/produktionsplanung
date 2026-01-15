import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=${tokens.error}`);
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoResponse.json();

    // Store tokens in Supabase (if user is authenticated)
    // For now, we'll store in localStorage via redirect
    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: Date.now() + tokens.expires_in * 1000,
      email: userInfo.email,
    };

    // Redirect back to app with tokens in hash (more secure than query params)
    const encodedTokens = Buffer.from(JSON.stringify(tokenData)).toString('base64');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?google_auth=success#tokens=${encodedTokens}`
    );
  } catch (err) {
    console.error('Google OAuth error:', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=oauth_failed`);
  }
}
