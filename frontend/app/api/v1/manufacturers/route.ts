import { NextRequest, NextResponse } from 'next/server'
import { validateApiToken, logApiUsage } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  const authResult = await validateApiToken(request)
  if (!authResult.valid) {
    await logApiUsage(
      null,
      '/api/v1/manufacturers',
      'GET',
      401,
      Date.now() - startTime,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined,
      authResult.error
    )
    return NextResponse.json({ error: authResult.error }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const industry = searchParams.get('industry')

  // For retailers, only show manufacturers they have access to
  let accessibleManufacturerIds: string[] | null = null
  if (authResult.token!.retailer_id) {
    const { data: accessData } = await supabase
      .from('retailer_data_access')
      .select('manufacturer_id')
      .eq('retailer_id', authResult.token!.retailer_id)
      .eq('access_granted', true)
    
    accessibleManufacturerIds = accessData?.map(a => a.manufacturer_id) || []
    
    if (accessibleManufacturerIds.length === 0) {
      const responseTimeMs = Date.now() - startTime
      await logApiUsage(
        authResult.token!.id,
        '/api/v1/manufacturers',
        'GET',
        200,
        responseTimeMs
      )
      return NextResponse.json({ data: [] })
    }
  }

  let query = supabase
    .from('manufacturers')
    .select('id, company_name, industry, email, created_at')

  // Apply retailer access filter
  if (accessibleManufacturerIds) {
    query = query.in('id', accessibleManufacturerIds)
  }

  // For manufacturers, only show themselves
  if (authResult.token!.manufacturer_id && !authResult.token!.retailer_id) {
    query = query.eq('id', authResult.token!.manufacturer_id)
  }

  if (industry) {
    query = query.eq('industry', industry)
  }

  query = query.order('company_name', { ascending: true })

  const { data, error } = await query

  const responseTimeMs = Date.now() - startTime

  await logApiUsage(
    authResult.token!.id,
    '/api/v1/manufacturers',
    'GET',
    error ? 500 : 200,
    responseTimeMs,
    request.headers.get('x-forwarded-for') || undefined,
    request.headers.get('user-agent') || undefined,
    error?.message
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data || [] })
}
