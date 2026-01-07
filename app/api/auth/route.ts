import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const VALID_PASSWORDS = [
  process.env.AUTH_PASSWORD_ADMIN,
  process.env.AUTH_PASSWORD_CLIENT,
].filter(Boolean)

const COOKIE_NAME = 'snd_auth'
const COOKIE_MAX_AGE = 60 * 60 * 24

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password required' },
        { status: 400 }
      )
    }

    if (!VALID_PASSWORDS.includes(password)) {
      console.log('[Auth] Failed login attempt from:', request.headers.get('x-forwarded-for') || 'unknown')
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    const role = password === process.env.AUTH_PASSWORD_ADMIN ? 'admin' : 'client'
    console.log('[Auth] Successful login:', role)

    const token = Buffer.from(`${role}:${Date.now()}`).toString('base64')

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return NextResponse.json({ success: true, role })
  } catch (error) {
    console.error('[Auth] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  return NextResponse.json({ success: true })
}
