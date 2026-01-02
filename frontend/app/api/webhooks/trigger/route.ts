import { NextRequest, NextResponse } from 'next/server'
import { triggerWebhook } from '@/lib/webhook-trigger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, payload } = body

    if (!event || !payload) {
      return NextResponse.json(
        { error: 'Event and payload are required' },
        { status: 400 }
      )
    }

    const result = await triggerWebhook(event, payload)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to trigger webhooks' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      delivered: result.delivered,
      failed: result.failed,
      message: `Webhooks triggered: ${result.delivered} delivered, ${result.failed} failed`
    })
  } catch (error: any) {
    console.error('Error in webhook trigger endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
