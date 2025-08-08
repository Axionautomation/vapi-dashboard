import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      return NextResponse.json({ 
        error: 'Login failed',
        details: error.message 
      }, { status: 401 })
    }

    if (!data.session) {
      return NextResponse.json({ 
        error: 'No session created',
        user: data.user 
      }, { status: 401 })
    }

    console.log('Login successful - User:', data.user?.email)
    console.log('Login successful - Session:', data.session ? 'Present' : 'None')

    return NextResponse.json({ 
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email
      },
      session: {
        access_token: data.session.access_token ? 'Present' : 'None',
        refresh_token: data.session.refresh_token ? 'Present' : 'None',
        expires_at: data.session.expires_at
      }
    })
  } catch (error) {
    console.error('Login test error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 