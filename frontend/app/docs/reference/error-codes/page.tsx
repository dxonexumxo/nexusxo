import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import ParameterTable from '@/components/docs/ParameterTable'

export default function ErrorCodesPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Error Codes Reference</h1>
      <p>
        This page documents all possible error responses from the NexusXO API. Use this reference
        to understand and handle errors in your integration.
      </p>

      <h2>Error Response Format</h2>
      <p>All error responses follow this standard format:</p>

      <CodeBlock
        language="json"
        code={`{
  "error": "Error Code",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context about the error"
  }
}`}
      />

      <h2>HTTP Status Codes</h2>

      <h3>400 Bad Request</h3>
      <p>Invalid request syntax or parameters.</p>
      <CodeBlock
        language="json"
        code={`{
  "error": "BAD_REQUEST",
  "message": "Invalid request parameters",
  "details": {
    "field": "price",
    "issue": "Price must be a positive number"
  }
}`}
      />

      <h3>401 Unauthorized</h3>
      <p>Authentication failed or missing API key.</p>
      <CodeBlock
        language="json"
        code={`{
  "error": "UNAUTHORIZED",
  "message": "Invalid or missing API token"
}`}
      />

      <h3>403 Forbidden</h3>
      <p>Valid authentication but insufficient permissions.</p>
      <CodeBlock
        language="json"
        code={`{
  "error": "FORBIDDEN",
  "message": "Token does not have required scope: write:products"
}`}
      />

      <h3>404 Not Found</h3>
      <p>Requested resource does not exist.</p>
      <CodeBlock
        language="json"
        code={`{
  "error": "NOT_FOUND",
  "message": "Product with ID 'xxx' not found"
}`}
      />

      <h3>409 Conflict</h3>
      <p>Resource conflict (e.g., duplicate SKU).</p>
      <CodeBlock
        language="json"
        code={`{
  "error": "CONFLICT",
  "message": "Product with SKU 'ABC-123' already exists"
}`}
      />

      <h3>422 Unprocessable Entity</h3>
      <p>Validation error - request is well-formed but contains invalid data.</p>
      <CodeBlock
        language="json"
        code={`{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "field": "price",
      "message": "Price must be a positive number"
    },
    {
      "field": "sku",
      "message": "SKU is required"
    }
  ]
}`}
      />

      <h3>429 Too Many Requests</h3>
      <p>Rate limit exceeded.</p>
      <CodeBlock
        language="json"
        code={`{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "You have exceeded the rate limit of 60 requests per minute",
  "retry_after": 30
}`}
      />

      <h3>500 Internal Server Error</h3>
      <p>Unexpected server error.</p>
      <CodeBlock
        language="json"
        code={`{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred. Please try again later."
}`}
      />

      <h2>Error Code Reference</h2>
      <ParameterTable
        parameters={[
          {
            name: 'BAD_REQUEST',
            type: 'string',
            required: false,
            description: 'Invalid request syntax or malformed JSON',
            example: '400',
          },
          {
            name: 'UNAUTHORIZED',
            type: 'string',
            required: false,
            description: 'Missing or invalid API token',
            example: '401',
          },
          {
            name: 'FORBIDDEN',
            type: 'string',
            required: false,
            description: 'Valid token but insufficient permissions',
            example: '403',
          },
          {
            name: 'NOT_FOUND',
            type: 'string',
            required: false,
            description: 'Requested resource does not exist',
            example: '404',
          },
          {
            name: 'CONFLICT',
            type: 'string',
            required: false,
            description: 'Resource conflict (duplicate, etc.)',
            example: '409',
          },
          {
            name: 'VALIDATION_ERROR',
            type: 'string',
            required: false,
            description: 'Request validation failed',
            example: '422',
          },
          {
            name: 'RATE_LIMIT_EXCEEDED',
            type: 'string',
            required: false,
            description: 'Too many requests in time window',
            example: '429',
          },
          {
            name: 'INTERNAL_ERROR',
            type: 'string',
            required: false,
            description: 'Unexpected server error',
            example: '500',
          },
        ]}
      />

      <h2>Handling Errors</h2>
      <p>Here's an example of proper error handling:</p>

      <CodeBlock
        language="javascript"
        code={`async function handleApiRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      switch (response.status) {
        case 401:
          // Re-authenticate or refresh token
          console.error('Authentication failed:', data.message);
          break;
        case 403:
          // Check token permissions
          console.error('Permission denied:', data.message);
          break;
        case 429:
          // Implement retry with backoff
          const retryAfter = data.retry_after || 60;
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return handleApiRequest(url, options); // Retry
        case 422:
          // Handle validation errors
          console.error('Validation errors:', data.details);
          break;
        default:
          console.error('API error:', data.message);
      }
      throw new Error(data.message);
    }
    
    return data;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}`}
      />

      <Callout type="info" title="Error Handling Best Practices">
        <ul>
          <li>Always check response status codes</li>
          <li>Implement retry logic for transient errors (429, 500)</li>
          <li>Log error details for debugging</li>
          <li>Provide user-friendly error messages</li>
          <li>Handle validation errors by showing specific field issues</li>
        </ul>
      </Callout>
    </div>
  )
}
