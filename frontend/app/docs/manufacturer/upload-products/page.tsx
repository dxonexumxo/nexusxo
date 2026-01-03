import ApiEndpoint from '@/components/docs/ApiEndpoint'
import ApiExplorer from '@/components/docs/ApiExplorer'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import ParameterTable from '@/components/docs/ParameterTable'

export default function UploadProductsPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Upload Products</h1>
      <p>
        Upload one or multiple products to your catalog. Products can be created individually or in
        bulk batches.
      </p>

      <ApiEndpoint
        method="POST"
        path="/manufacturer/products/upload"
        description="Upload products to your catalog"
      />

      <h2>Request Headers</h2>
      <ParameterTable
        parameters={[
          {
            name: 'Authorization',
            type: 'string',
            required: true,
            description: 'Bearer token with write:products scope',
            example: 'Bearer mk_prod_xxxxxxxxxxxx',
          },
          {
            name: 'Content-Type',
            type: 'string',
            required: true,
            description: 'Must be application/json',
            example: 'application/json',
          },
        ]}
      />

      <h2>Request Body</h2>
      <h3>Single Product Upload</h3>
      <CodeBlock
        language="json"
        code={`{
  "product": {
    "sku": "ABC-123",
    "product_name": "Widget Pro",
    "description": "A high-quality widget for all your needs",
    "price": 29.99,
    "category": "Electronics",
    "brand": "Your Brand",
    "stock_quantity": 100,
    "image_urls": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "attributes": {
      "color": "Black",
      "size": "Medium",
      "material": "Plastic"
    }
  }
}`}
      />

      <h3>Bulk Product Upload</h3>
      <CodeBlock
        language="json"
        code={`{
  "products": [
    {
      "sku": "ABC-123",
      "product_name": "Widget Pro",
      "price": 29.99,
      "category": "Electronics"
    },
    {
      "sku": "ABC-124",
      "product_name": "Widget Plus",
      "price": 39.99,
      "category": "Electronics"
    }
  ]
}`}
      />

      <h2>Response</h2>
      <h3>Success (200 OK)</h3>
      <CodeBlock
        language="json"
        code={`{
  "success": true,
  "uploaded": 2,
  "failed": 0,
  "products": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "sku": "ABC-123",
      "status": "created",
      "product_name": "Widget Pro"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "sku": "ABC-124",
      "status": "created",
      "product_name": "Widget Plus"
    }
  ]
}`}
      />

      <h3>Partial Success (207 Multi-Status)</h3>
      <p>
        When some products fail validation, you'll receive a 207 status with details about which
        products succeeded and which failed:
      </p>
      <CodeBlock
        language="json"
        code={`{
  "success": true,
  "uploaded": 1,
  "failed": 1,
  "products": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "sku": "ABC-123",
      "status": "created"
    }
  ],
  "errors": [
    {
      "sku": "ABC-124",
      "error": "Validation failed",
      "details": {
        "price": "Price must be a positive number"
      }
    }
  ]
}`}
      />

      <h2>Code Examples</h2>
      <CodeBlock
        language="bash"
        title="cURL"
        code={`curl -X POST "https://api.nexusxo.com/api/v1/manufacturer/products/upload" \\
  -H "Authorization: Bearer mk_prod_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product": {
      "sku": "ABC-123",
      "product_name": "Widget Pro",
      "price": 29.99,
      "category": "Electronics"
    }
  }'`}
      />

      <CodeBlock
        language="javascript"
        title="JavaScript"
        code={`const response = await fetch('https://api.nexusxo.com/api/v1/manufacturer/products/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer mk_prod_xxxxxxxxxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    product: {
      sku: 'ABC-123',
      product_name: 'Widget Pro',
      price: 29.99,
      category: 'Electronics'
    }
  })
});

const data = await response.json();
console.log(data);`}
      />

      <CodeBlock
        language="python"
        title="Python"
        code={`import requests

response = requests.post(
    'https://api.nexusxo.com/api/v1/manufacturer/products/upload',
    headers={
        'Authorization': 'Bearer mk_prod_xxxxxxxxxxxx',
        'Content-Type': 'application/json'
    },
    json={
        'product': {
            'sku': 'ABC-123',
            'product_name': 'Widget Pro',
            'price': 29.99,
            'category': 'Electronics'
        }
    }
)

print(response.json())`}
      />

      <h2>Try It Out</h2>
      <ApiExplorer
        method="POST"
        path="/manufacturer/products/upload"
        defaultBody={`{
  "product": {
    "sku": "TEST-001",
    "product_name": "Test Product",
    "price": 19.99,
    "category": "Test"
  }
}`}
      />

      <h2>Rate Limits</h2>
      <ul>
        <li>100 requests per minute</li>
        <li>10,000 products per bulk upload request</li>
        <li>Maximum 50MB per request body</li>
      </ul>

      <Callout type="info" title="Bulk Upload Tips">
        <ul>
          <li>Use bulk upload for better performance when uploading many products</li>
          <li>Validate your JSON before sending large batches</li>
          <li>Check the response for partial failures</li>
          <li>Use unique SKUs to avoid duplicates</li>
        </ul>
      </Callout>

      <h2>Common Errors</h2>
      <ParameterTable
        parameters={[
          {
            name: '401',
            type: 'status',
            required: false,
            description: 'Invalid or missing API key',
          },
          {
            name: '403',
            type: 'status',
            required: false,
            description: 'Token does not have write:products scope',
          },
          {
            name: '422',
            type: 'status',
            required: false,
            description: 'Validation error - check request body schema',
          },
          {
            name: '429',
            type: 'status',
            required: false,
            description: 'Rate limit exceeded - wait before retrying',
          },
        ]}
      />
    </div>
  )
}
