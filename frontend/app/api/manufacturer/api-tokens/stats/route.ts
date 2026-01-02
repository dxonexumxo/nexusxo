import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

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
    .single()

  return { isValid: !error && !!data, error }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const manufacturerCheck = await verifyManufacturer(user.id)
    if (!manufacturerCheck.isValid) {
      return NextResponse.json({ error: 'Forbidden - Not a manufacturer' }, { status: 403 })
    }

    const serviceSupabase = await getServiceSupabaseClient()

    // Get all tokens for this manufacturer
    const { data: tokens } = await serviceSupabase
      .from('api_tokens')
      .select('id')
      .eq('manufacturer_id', user.id)

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const tokenIds = tokens.map(t => t.id)

    // Calculate stats from api_usage_logs
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Total requests
    const { count: totalRequests } = await serviceSupabase
      .from('api_usage_logs')
      .select('*', { count: 'exact', head: true })
      .in('token_id', tokenIds)

    // Requests last hour
    const { count: requestsLastHour } = await serviceSupabase
      .from('api_usage_logs')
      .select('*', { count: 'exact', head: true })
      .in('token_id', tokenIds)
      .gte('created_at', oneHourAgo.toISOString())

    // Requests last day
    const { count: requestsLastDay } = await serviceSupabase
      .from('api_usage_logs')
      .select('*', { count: 'exact', head: true })
      .in('token_id', tokenIds)
      .gte('created_at', oneDayAgo.toISOString())

    // Requests last week
    const { count: requestsLastWeek } = await serviceSupabase
      .from('api_usage_logs')
      .select('*', { count: 'exact', head: true })
      .in('token_id', tokenIds)
      .gte('created_at', oneWeekAgo.toISOString())

    // Average response time
    const { data: logsForAvg } = await serviceSupabase
      .from('api_usage_logs')
      .select('response_time_ms')
      .in('token_id', tokenIds)
      .not('response_time_ms', 'is', null)
      .limit(1000)

    const avgResponseTime = logsForAvg && logsForAvg.length > 0
      ? logsForAvg.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / logsForAvg.length
      : 0

    // Error count
    const { count: errorCount } = await serviceSupabase
      .from('api_usage_logs')
      .select('*', { count: 'exact', head: true })
      .in('token_id', tokenIds)
      .not('error_message', 'is', null)

    // Stats per token
    const statsPerToken = await Promise.all(
      tokens.map(async (token) => {
        const { count: tokenTotal } = await serviceSupabase
          .from('api_usage_logs')
          .select('*', { count: 'exact', head: true })
          .eq('token_id', token.id)

        const { count: tokenErrors } = await serviceSupabase
          .from('api_usage_logs')
          .select('*', { count: 'exact', head: true })
          .eq('token_id', token.id)
          .not('error_message', 'is', null)

        const { data: tokenLogs } = await serviceSupabase
          .from('api_usage_logs')
          .select('response_time_ms')
          .eq('token_id', token.id)
          .not('response_time_ms', 'is', null)
          .limit(100)

        const tokenAvgResponseTime = tokenLogs && tokenLogs.length > 0
          ? tokenLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / tokenLogs.length
          : 0

        return {
          token_id: token.id,
          total_requests: tokenTotal || 0,
          error_count: tokenErrors || 0,
          avg_response_time_ms: Math.round(tokenAvgResponseTime)
        }
      })
    )

    return NextResponse.json({
      data: {
        overall: {
          total_requests: totalRequests || 0,
          requests_last_hour: requestsLastHour || 0,
          requests_last_day: requestsLastDay || 0,
          requests_last_week: requestsLastWeek || 0,
          avg_response_time_ms: Math.round(avgResponseTime),
          error_count: errorCount || 0
        },
        by_token: statsPerToken
      }
    })
  } catch (error: any) {
    console.error('Unexpected error in GET /api/manufacturer/api-tokens/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
