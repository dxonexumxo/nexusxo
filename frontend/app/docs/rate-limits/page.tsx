import Callout from '@/components/docs/Callout'
import ParameterTable from '@/components/docs/ParameterTable'

export default function RateLimitsPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Rate Limits & Best Practices</h1>
      <p>
        To ensure fair usage and system stability, the NexusXO API implements rate limits on all
        endpoints. Understanding these limits will help you build efficient integrations.
      </p>

      <h2>Default Rate Limits</h2>
      <p>All API tokens have the following default rate limits:</p>

      <ParameterTable
        parameters={[
          {
            name: 'Requests per minute',
            type: 'integer',
            required: false,
            description: 'Maximum number of requests allowed in a 60-second window',
            default: '60',
          },
          {
            name: 'Requests per hour',
            type: 'integer',
            required: false,
            description: 'Maximum number of requests allowed in a 60-minute window',
            default: '1,000',
          },
          {
            name: 'Requests per day',
            type: 'integer',
            required: false,
            description: 'Maximum number of requests allowed in a 24-hour window',
            default: '10,000',
          },
        ]}
      />

      <h2>Rate Limit Headers</h2>
      <p>
        Every API response includes headers that show your current rate limit status. Monitor
        these headers to avoid hitting limits:
      </p>

      <ParameterTable
        parameters={[
          {
            name: 'X-RateLimit-Limit',
            type: 'integer',
            required: false,
            description: 'The maximum number of requests allowed in the current window',
          },
          {
            name: 'X-RateLimit-Remaining',
            type: 'integer',
            required: false,
            description: 'The number of requests remaining in the current window',
          },
          {
            name: 'X-RateLimit-Reset',
            type: 'timestamp',
            required: false,
            description: 'Unix timestamp when the current rate limit window resets',
          },
        ]}
      />

      <h2>Rate Limit Exceeded</h2>
      <p>
        When you exceed a rate limit, you'll receive a <code>429 Too Many Requests</code> response:
      </p>

      <div className="my-6 p-4 bg-gray-900 text-gray-100 rounded-lg">
        <pre className="m-0">
          <code>{`HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
Retry-After: 30

{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit of 60 requests per minute",
  "retry_after": 30
}`}</code>
        </pre>
      </div>

      <h2>Best Practices</h2>

      <h3>1. Implement Exponential Backoff</h3>
      <p>
        When you receive a 429 response, wait before retrying. Use exponential backoff to
        gradually increase wait times:
      </p>

      <div className="my-6 p-4 bg-gray-900 text-gray-100 rounded-lg">
        <pre className="m-0">
          <code>{`async function makeRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
      const waitTime = retryAfter * Math.pow(2, i); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      continue;
    }
    
    return response;
  }
  
  throw new Error('Max retries exceeded');
}`}</code>
        </pre>
      </div>

      <h3>2. Use Bulk Operations</h3>
      <p>
        Instead of making many individual requests, use bulk endpoints when available. For
        example, upload multiple products in a single request rather than one request per product.
      </p>

      <Callout type="info" title="Bulk Operations">
        Bulk operations count as a single request toward your rate limit, even when processing
        hundreds of items. This is much more efficient than individual requests.
      </Callout>

      <h3>3. Cache Responses</h3>
      <p>
        Cache API responses when appropriate. Product data doesn't change frequently, so you can
        cache it locally and refresh periodically rather than fetching on every request.
      </p>

      <h3>4. Monitor Rate Limit Headers</h3>
      <p>
        Always check the <code>X-RateLimit-Remaining</code> header to know how many requests you
        have left. Implement logic to slow down or pause requests when approaching limits.
      </p>

      <h2>Request Size Limits</h2>
      <p>In addition to rate limits, there are limits on request body sizes:</p>

      <ParameterTable
        parameters={[
          {
            name: 'Maximum request body size',
            type: 'size',
            required: false,
            description: 'Maximum size for request body (JSON)',
            default: '50 MB',
          },
          {
            name: 'Maximum products per bulk upload',
            type: 'integer',
            required: false,
            description: 'Maximum number of products in a single bulk upload',
            default: '10,000',
          },
        ]}
      />

      <h2>Custom Rate Limits</h2>
      <p>
        Enterprise customers can request custom rate limits tailored to their needs. Contact our
        sales team to discuss higher limits for your use case.
      </p>

      <Callout type="warning" title="Rate Limit Violations">
        Repeatedly exceeding rate limits may result in temporary suspension of your API access.
        Always implement proper error handling and retry logic in your integrations.
      </Callout>

      <h2>Checking Your Current Usage</h2>
      <p>
        You can view your current API usage and rate limit status in your dashboard under Settings
        → API Tokens → Usage Statistics.
      </p>
    </div>
  )
}
