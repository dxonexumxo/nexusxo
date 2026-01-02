import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { NextRequest } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ValidatedToken {
  id: string
  retailer_id?: string
  manufacturer_id?: string
  scopes: string[]
  token_name: string
}

export async function validateApiToken(request: NextRequest): Promise<{
  valid: boolean
  token?: ValidatedToken
  error?: string
}> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const { data, error } = await supabase
    .from('api_tokens')
    .select('*, api_rate_limits(*)')
    .eq('token_hash', tokenHash)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return { valid: false, error: 'Invalid or inactive API token' }
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'API token expired' }
  }

  // Check rate limits if they exist
  if (data.api_rate_limits && data.api_rate_limits.length > 0) {
    const rateLimit = data.api_rate_limits[0]
    const now = new Date()
    
    // Check minute limit
    if (rateLimit.minute_window_start) {
      const minuteStart = new Date(rateLimit.minute_window_start)
      if (now.getTime() - minuteStart.getTime() < 60000) {
        if ((rateLimit.current_minute_count || 0) >= (rateLimit.requests_per_minute || 60)) {
          return { valid: false, error: 'Rate limit exceeded (requests per minute)' }
        }
      }
    }

    // Check hour limit
    if (rateLimit.hour_window_start) {
      const hourStart = new Date(rateLimit.hour_window_start)
      if (now.getTime() - hourStart.getTime() < 3600000) {
        if ((rateLimit.current_hour_count || 0) >= (rateLimit.requests_per_hour || 1000)) {
          return { valid: false, error: 'Rate limit exceeded (requests per hour)' }
        }
      }
    }

    // Update counters
    await updateRateLimitCounters(data.id)
  }

  // Update last used timestamp
  await supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  return {
    valid: true,
    token: {
      id: data.id,
      retailer_id: data.retailer_id,
      manufacturer_id: data.manufacturer_id,
      scopes: data.scopes || [],
      token_name: data.token_name
    }
  }
}

async function updateRateLimitCounters(tokenId: string) {
  const { data: rateLimit } = await supabase
    .from('api_rate_limits')
    .select('*')
    .eq('token_id', tokenId)
    .single()

  if (!rateLimit) return

  const now = new Date()
  const updates: any = {}

  // Reset minute counter if window expired
  if (rateLimit.minute_window_start) {
    const minuteStart = new Date(rateLimit.minute_window_start)
    if (now.getTime() - minuteStart.getTime() >= 60000) {
      updates.current_minute_count = 1
      updates.minute_window_start = now.toISOString()
    } else {
      updates.current_minute_count = (rateLimit.current_minute_count || 0) + 1
    }
  } else {
    updates.current_minute_count = 1
    updates.minute_window_start = now.toISOString()
  }

  // Reset hour counter if window expired
  if (rateLimit.hour_window_start) {
    const hourStart = new Date(rateLimit.hour_window_start)
    if (now.getTime() - hourStart.getTime() >= 3600000) {
      updates.current_hour_count = 1
      updates.hour_window_start = now.toISOString()
    } else {
      updates.current_hour_count = (rateLimit.current_hour_count || 0) + 1
    }
  } else {
    updates.current_hour_count = 1
    updates.hour_window_start = now.toISOString()
  }

  // Reset day counter if window expired
  if (rateLimit.day_window_start) {
    const dayStart = new Date(rateLimit.day_window_start)
    if (now.getTime() - dayStart.getTime() >= 86400000) {
      updates.current_day_count = 1
      updates.day_window_start = now.toISOString()
    } else {
      updates.current_day_count = (rateLimit.current_day_count || 0) + 1
    }
  } else {
    updates.current_day_count = 1
    updates.day_window_start = now.toISOString()
  }

  await supabase
    .from('api_rate_limits')
    .update(updates)
    .eq('token_id', tokenId)
}

export async function logApiUsage(
  tokenId: string | null,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  ipAddress?: string,
  userAgent?: string,
  errorMessage?: string
) {
  try {
    await supabase.from('api_usage_logs').insert({
      token_id: tokenId,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      ip_address: ipAddress,
      user_agent: userAgent,
      error_message: errorMessage
    })
  } catch (error) {
    console.error('Error logging API usage:', error)
    // Don't throw - logging failures shouldn't break the API
  }
}
