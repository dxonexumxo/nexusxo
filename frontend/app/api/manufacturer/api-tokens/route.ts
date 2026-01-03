import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Removed - use auth from request directly

async function getServiceSupabaseClient() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
  )
}

async function verifyManufacturer(userId: string) {
  const supabase = await getServiceSupabaseClient()
  const { data, error } = await supabase
    .from('manufacturers')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  return { isValid: !error && !!data, error }
}

export async function GET(request: NextRequest) {
  try {
    // Try to get access token from Authorization header first
    const authHeader = request.headers.get('Authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const tokenSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      })
      const { data: { user: userFromToken }, error: tokenError } = await tokenSupabase.auth.getUser()
      if (!tokenError && userFromToken) {
        user = userFromToken
      }
    }
    
    // If no user from token, try cookies
    if (!user) {
      const cookieStore = await cookies()
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      })
      const { data: { session } } = await supabase.auth.getSession()
      user = session?.user
      
      if (!user) {
        const { data: { user: userFromGetUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !userFromGetUser) {
          console.error('Auth error in GET /api/manufacturer/api-tokens:', authError || 'No session or user')
          return NextResponse.json({ error: 'Unauthorized', details: authError?.message || 'No session found' }, { status: 401 })
        }
        user = userFromGetUser
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const manufacturerCheck = await verifyManufacturer(user.id)
    if (!manufacturerCheck.isValid) {
      return NextResponse.json({ error: 'Forbidden - Not a manufacturer' }, { status: 403 })
    }

    const serviceSupabase = await getServiceSupabaseClient()
    const { data: tokens, error: tokensError } = await serviceSupabase
      .from('api_tokens')
      .select(`
        id,
        token_name,
        token_prefix,
        scopes,
        is_active,
        expires_at,
        last_used_at,
        created_at
      `)
      .eq('manufacturer_id', user.id)
      .order('created_at', { ascending: false })

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError)
      return NextResponse.json({ error: tokensError.message }, { status: 500 })
    }

    // Fetch rate limit data for each token
    const tokensWithRateLimits = await Promise.all(
      (tokens || []).map(async (token) => {
        const { data: rateLimit } = await serviceSupabase
          .from('api_rate_limits')
          .select('requests_per_minute, requests_per_hour, requests_per_day')
          .eq('token_id', token.id)
          .single()

        return {
          ...token,
          rate_limit: rateLimit || null
        }
      })
    )

    return NextResponse.json({ data: tokensWithRateLimits })
  } catch (error: any) {
    console.error('Unexpected error in GET /api/manufacturer/api-tokens:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try to get access token from Authorization header first
    const authHeader = request.headers.get('Authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const tokenSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      })
      const { data: { user: userFromToken }, error: tokenError } = await tokenSupabase.auth.getUser()
      if (!tokenError && userFromToken) {
        user = userFromToken
      }
    }
    
    // If no user from token, try cookies
    if (!user) {
      const cookieStore = await cookies()
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      })
      const { data: { session } } = await supabase.auth.getSession()
      user = session?.user
      
      if (!user) {
        const { data: { user: userFromGetUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !userFromGetUser) {
          console.error('Auth error in POST /api/manufacturer/api-tokens:', authError || 'No session or user')
          return NextResponse.json({ error: 'Unauthorized', details: authError?.message || 'No session found' }, { status: 401 })
        }
        user = userFromGetUser
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const manufacturerCheck = await verifyManufacturer(user.id)
    if (!manufacturerCheck.isValid) {
      return NextResponse.json({ error: 'Forbidden - Not a manufacturer' }, { status: 403 })
    }

    const body = await request.json()
    const { token_name, scopes, expires_at } = body

    // Validate input
    if (!token_name || typeof token_name !== 'string' || token_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Token name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Default scopes for manufacturers
    const tokenScopes = scopes && Array.isArray(scopes) && scopes.length > 0
      ? scopes
      : ['read:products', 'write:products']

    // Generate secure token
    const randomBytes = crypto.randomBytes(32)
    const token = `nx_${randomBytes.toString('hex')}` // 64 hex characters after "nx_"

    // Hash token for storage
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Create token prefix for display
    const tokenPrefix = token.substring(0, 12) + '...'

    // Validate expires_at if provided
    let expiresAtValue: string | null = null
    if (expires_at) {
      const expiryDate = new Date(expires_at)
      if (isNaN(expiryDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expires_at date format' },
          { status: 400 }
        )
      }
      if (expiryDate < new Date()) {
        return NextResponse.json(
          { error: 'expires_at cannot be in the past' },
          { status: 400 }
        )
      }
      expiresAtValue = expiryDate.toISOString()
    }

    const serviceSupabase = await getServiceSupabaseClient()
    const { data: tokenData, error: insertError } = await serviceSupabase
      .from('api_tokens')
      .insert({
        manufacturer_id: user.id,
        token_name: token_name.trim(),
        token_hash: tokenHash,
        token_prefix: tokenPrefix,
        scopes: tokenScopes,
        expires_at: expiresAtValue,
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating token:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Create default rate limits entry
    const { error: rateLimitError } = await serviceSupabase
      .from('api_rate_limits')
      .insert({
        token_id: tokenData.id,
        requests_per_minute: 60,
        requests_per_hour: 1000,
        requests_per_day: 10000,
        current_minute_count: 0,
        current_hour_count: 0,
        current_day_count: 0
      })

    if (rateLimitError) {
      console.error('Error creating rate limits:', rateLimitError)
      // Don't fail the request if rate limit creation fails
    }

    // Return token data INCLUDING the full plain token (only time it's returned)
    return NextResponse.json({
      id: tokenData.id,
      token, // Full token - only returned once
      token_name: tokenData.token_name,
      token_prefix: tokenData.token_prefix,
      scopes: tokenData.scopes,
      is_active: tokenData.is_active,
      expires_at: tokenData.expires_at,
      created_at: tokenData.created_at
    }, { status: 201 })
  } catch (error: any) {
    console.error('Unexpected error in POST /api/manufacturer/api-tokens:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Try to get access token from Authorization header first
    const authHeader = request.headers.get('Authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const tokenSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      })
      const { data: { user: userFromToken }, error: tokenError } = await tokenSupabase.auth.getUser()
      if (!tokenError && userFromToken) {
        user = userFromToken
      }
    }
    
    // If no user from token, try cookies
    if (!user) {
      const cookieStore = await cookies()
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      })
      const { data: { session } } = await supabase.auth.getSession()
      user = session?.user
      
      if (!user) {
        const { data: { user: userFromGetUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !userFromGetUser) {
          console.error('Auth error in DELETE /api/manufacturer/api-tokens:', authError || 'No session or user')
          return NextResponse.json({ error: 'Unauthorized', details: authError?.message || 'No session found' }, { status: 401 })
        }
        user = userFromGetUser
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const manufacturerCheck = await verifyManufacturer(user.id)
    if (!manufacturerCheck.isValid) {
      return NextResponse.json({ error: 'Forbidden - Not a manufacturer' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get('id')

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 })
    }

    const serviceSupabase = await getServiceSupabaseClient()

    // Verify token belongs to user
    const { data: tokenData } = await serviceSupabase
      .from('api_tokens')
      .select('id')
      .eq('id', tokenId)
      .eq('manufacturer_id', user.id)
      .single()

    if (!tokenData) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    // Delete rate limits first
    await serviceSupabase
      .from('api_rate_limits')
      .delete()
      .eq('token_id', tokenId)

    // Delete token
    const { error: deleteError } = await serviceSupabase
      .from('api_tokens')
      .delete()
      .eq('id', tokenId)
      .eq('manufacturer_id', user.id)

    if (deleteError) {
      console.error('Error deleting token:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/manufacturer/api-tokens:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Try to get access token from Authorization header first
    const authHeader = request.headers.get('Authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const tokenSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      })
      const { data: { user: userFromToken }, error: tokenError } = await tokenSupabase.auth.getUser()
      if (!tokenError && userFromToken) {
        user = userFromToken
      }
    }
    
    // If no user from token, try cookies
    if (!user) {
      const cookieStore = await cookies()
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      })
      const { data: { session } } = await supabase.auth.getSession()
      user = session?.user
      
      if (!user) {
        const { data: { user: userFromGetUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !userFromGetUser) {
          console.error('Auth error in PATCH /api/manufacturer/api-tokens:', authError || 'No session or user')
          return NextResponse.json({ error: 'Unauthorized', details: authError?.message || 'No session found' }, { status: 401 })
        }
        user = userFromGetUser
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const manufacturerCheck = await verifyManufacturer(user.id)
    if (!manufacturerCheck.isValid) {
      return NextResponse.json({ error: 'Forbidden - Not a manufacturer' }, { status: 403 })
    }

    const body = await request.json()
    const { id: tokenId, is_active } = body

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 })
    }

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active must be a boolean value' },
        { status: 400 }
      )
    }

    const serviceSupabase = await getServiceSupabaseClient()

    // Verify token belongs to user
    const { data: tokenData } = await serviceSupabase
      .from('api_tokens')
      .select('id')
      .eq('id', tokenId)
      .eq('manufacturer_id', user.id)
      .single()

    if (!tokenData) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    // Update token
    const { data: updatedToken, error: updateError } = await serviceSupabase
      .from('api_tokens')
      .update({ is_active })
      .eq('id', tokenId)
      .eq('manufacturer_id', user.id)
      .select('id, token_name, token_prefix, scopes, is_active, expires_at, last_used_at, created_at')
      .single()

    if (updateError) {
      console.error('Error updating token:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ data: updatedToken })
  } catch (error: any) {
    console.error('Unexpected error in PATCH /api/manufacturer/api-tokens:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
