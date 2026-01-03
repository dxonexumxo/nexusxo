import ApiEndpoint from '@/components/docs/ApiEndpoint'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import Link from 'next/link'

export default function QuickStartPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Quick Start Guide</h1>
      <p>
        Get up and running with the NexusXO API in minutes. This guide will walk you through your
        first API call.
      </p>

      <h2>Prerequisites</h2>
      <ul>
        <li>A NexusXO account (manufacturer or retailer)</li>
        <li>An API token (see <Link href="/docs/authentication">Authentication</Link>)</li>
        <li>Basic knowledge of HTTP requests</li>
      </ul>

      <h2>Step 1: Get Your API Key</h2>
      <p>
        First, you need to create an API token. Follow the instructions in the{' '}
        <Link href="/docs/authentication">Authentication guide</Link> to get your token.
      </p>

      <Callout type="warning" title="Important">
        Copy your API key immediately after creation. It's only shown once and cannot be retrieved
        later.
      </Callout>

      <h2>Step 2: Make Your First Request</h2>
      <p>
        Let's start with a simple request to list products. This endpoint works for both
        manufacturers and retailers.
      </p>

      <ApiEndpoint method="GET" path="/products" description="List all accessible products" />

      <h3>Using cURL</h3>
      <CodeBlock
        language="bash"
        code={`curl -X GET "https://api.nexusxo.com/api/v1/products" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
      />

      <h3>Using JavaScript</h3>
      <CodeBlock
        language="javascript"
        code={`const response = await fetch('https://api.nexusxo.com/api/v1/products', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`}
      />

      <h3>Using Python</h3>
      <CodeBlock
        language="python"
        code={`import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.nexusxo.com/api/v1/products', headers=headers)
data = response.json()
print(data)`}
      />

      <h2>Step 3: Understanding the Response</h2>
      <p>If successful, you'll receive a response like this:</p>

      <CodeBlock
        language="json"
        code={`{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "sku": "PROD-001",
      "product_name": "Example Product",
      "description": "This is an example product",
      "price": 29.99,
      "category": "Electronics",
      "stock_quantity": 100,
      "manufacturer_id": "123e4567-e89b-12d3-a456-426614174000",
      "manufacturer_name": "Example Manufacturer",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1
  }
}`}
      />

      <h2>Step 4: Next Steps</h2>
      <p>Now that you've made your first API call, here's what to explore next:</p>

      <h3>For Manufacturers</h3>
      <ul>
        <li>
          <Link href="/docs/manufacturer/upload-products">Upload Products</Link> - Add products to
          your catalog
        </li>
        <li>
          <Link href="/docs/manufacturer/update-products">Update Products</Link> - Modify existing
          products
        </li>
        <li>
          <Link href="/docs/manufacturer/batch-operations">Batch Operations</Link> - Upload
          multiple products at once
        </li>
      </ul>

      <h3>For Retailers</h3>
      <ul>
        <li>
          <Link href="/docs/retailer/download-products">Download Products</Link> - Get product
          data in bulk
        </li>
        <li>
          <Link href="/docs/retailer/filter-query">Filter & Query</Link> - Search and filter
          products
        </li>
        <li>
          <Link href="/docs/retailer/manufacturer-info">Get Manufacturer Info</Link> - Access
          manufacturer details
        </li>
      </ul>

      <h2>Common Issues</h2>

      <h3>401 Unauthorized</h3>
      <p>
        This means your API key is missing or invalid. Check that you're including the{' '}
        <code>Authorization</code> header with the correct format:
      </p>
      <CodeBlock language="http" code={`Authorization: Bearer YOUR_API_KEY`} />

      <h3>403 Forbidden</h3>
      <p>
        Your API key doesn't have the required permissions. Make sure your token has the necessary
        scopes for the operation you're trying to perform.
      </p>

      <h3>429 Too Many Requests</h3>
      <p>
        You've exceeded the rate limit. Wait a moment before retrying, or check the{' '}
        <Link href="/docs/rate-limits">Rate Limits</Link> page for details.
      </p>

      <Callout type="info" title="Need Help?">
        If you're stuck, check out the <Link href="/docs/reference/error-codes">Error Codes</Link>{' '}
        reference or contact our support team.
      </Callout>
    </div>
  )
}
