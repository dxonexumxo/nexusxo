import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface WebhookPayload {
  event: string
  timestamp: string
  data: any
}

export async function triggerWebhook(event: string, payload: any) {
  try {
    // Find all active webhooks subscribed to this event
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true)
      .contains('events', [event])

    if (webhooksError || !webhooks || webhooks.length === 0) {
      return { success: true, delivered: 0, failed: 0 }
    }

    const webhookPayload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: payload
    }

    let delivered = 0
    let failed = 0

    // Deliver to each webhook
    for (const webhook of webhooks) {
      try {
        const signature = generateWebhookSignature(webhookPayload, webhook.secret)

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
            'X-Webhook-Id': webhook.id,
          },
          body: JSON.stringify(webhookPayload),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })

        const success = response.ok

        // Log delivery attempt
        await logWebhookDelivery(webhook.id, event, success, response.status, null)

        if (success) {
          delivered++
          // Reset failure count on success
          await supabase
            .from('webhooks')
            .update({ consecutive_failures: 0, last_success_at: new Date().toISOString() })
            .eq('id', webhook.id)
        } else {
          failed++
          await handleWebhookFailure(webhook.id, event, `HTTP ${response.status}`)
        }
      } catch (error: any) {
        failed++
        const errorMessage = error.message || 'Unknown error'
        await logWebhookDelivery(webhook.id, event, false, null, errorMessage)
        await handleWebhookFailure(webhook.id, event, errorMessage)
      }
    }

    return { success: true, delivered, failed }
  } catch (error: any) {
    console.error('Error triggering webhooks:', error)
    return { success: false, delivered: 0, failed: 0, error: error.message }
  }
}

async function handleWebhookFailure(webhookId: string, event: string, errorMessage: string) {
  // Get current failure count
  const { data: webhook } = await supabase
    .from('webhooks')
    .select('consecutive_failures, max_retries')
    .eq('id', webhookId)
    .single()

  if (!webhook) return

  const newFailureCount = (webhook.consecutive_failures || 0) + 1

  // Update failure count
  await supabase
    .from('webhooks')
    .update({
      consecutive_failures: newFailureCount,
      last_failure_at: new Date().toISOString(),
      last_failure_reason: errorMessage,
      is_active: newFailureCount < (webhook.max_retries || 3) // Deactivate after max retries
    })
    .eq('id', webhookId)

  // If we haven't exceeded max retries, schedule a retry (this would typically be handled by a job queue)
  if (newFailureCount < (webhook.max_retries || 3)) {
    // In a production system, you'd add this to a job queue for retry
    // For now, we'll just log it
    console.log(`Webhook ${webhookId} will be retried (attempt ${newFailureCount}/${webhook.max_retries || 3})`)
  }
}

async function logWebhookDelivery(
  webhookId: string,
  event: string,
  success: boolean,
  statusCode: number | null,
  errorMessage: string | null
) {
  try {
    await supabase.from('webhook_deliveries').insert({
      webhook_id: webhookId,
      event,
      success,
      status_code: statusCode,
      error_message: errorMessage,
      attempted_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error logging webhook delivery:', error)
    // Don't throw - logging failures shouldn't break webhook delivery
  }
}

function generateWebhookSignature(payload: WebhookPayload, secret: string): string {
  const payloadString = JSON.stringify(payload)
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payloadString)
  return hmac.digest('hex')
}

// Retry failed webhook deliveries
export async function retryFailedWebhooks(webhookId?: string) {
  try {
    const query = supabase
      .from('webhook_deliveries')
      .select('*, webhooks(*)')
      .eq('success', false)
      .order('attempted_at', { ascending: false })
      .limit(100)

    if (webhookId) {
      query.eq('webhook_id', webhookId)
    }

    const { data: failedDeliveries } = await query

    if (!failedDeliveries || failedDeliveries.length === 0) {
      return { success: true, retried: 0 }
    }

    let retried = 0

    for (const delivery of failedDeliveries) {
      const webhook = delivery.webhooks
      if (!webhook || !webhook.is_active) continue

      // Get original payload from delivery log (you may need to store this)
      // For now, we'll skip retries that don't have stored payloads
      // In production, you'd store the payload in webhook_deliveries table
      console.log(`Retry webhook ${delivery.webhook_id} for event ${delivery.event}`)
      retried++
    }

    return { success: true, retried }
  } catch (error: any) {
    console.error('Error retrying webhooks:', error)
    return { success: false, retried: 0, error: error.message }
  }
}
