import ApiEndpoint from '@/components/docs/ApiEndpoint'
import ApiExplorer from '@/components/docs/ApiExplorer'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import ParameterTable from '@/components/docs/ParameterTable'

export default function BatchOperationsPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Batch Operations</h1>
      <p>
        Perform bulk operations on multiple products at once. Batch operations are more efficient
        than individual requests and count as a single request toward your rate limit.
      </p>

      <h2>Batch Upload</h2>
      <ApiEndpoint
        method="POST"
        path="/manufacturer/products/batch"
        description="Create or update multiple products in a single request"
      />

      <h2>Request Body</h2>
      <CodeBlock
        language="json"
        code={`{
  "operations": [
    {
      "action": "create",
      "product": {
        "sku": "NEW-001",
        "product_name": "New Product",
        "price": 29.99
      }
    },
    {
      "action": "update",
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "product": {
        "price": 39.99,
        "stock_quantity": 200
      }
    },
    {
      "action": "upsert",
      "product": {
        "sku": "EXISTING-001",
        "product_name": "Updated Name",
        "price": 49.99
      }
    }
  ]
}`}
      />

      <h2>Action Types</h2>
      <ParameterTable
        parameters={[
          {
            name: 'create',
            type: 'string',
            required: true,
            description: 'Create a new product. Requires full product data.',
          },
          {
            name: 'update',
            type: 'string',
            required: true,
            description: 'Update an existing product by ID. Only include fields to update.',
          },
          {
            name: 'upsert',
            type: 'string',
            required: true,
            description: 'Create or update by SKU. Creates if SKU doesn\'t exist, updates if it does.',
          },
        ]}
      />

      <h2>Response</h2>
      <CodeBlock
        language="json"
        code={`{
  "success": true,
  "processed": 3,
  "created": 1,
  "updated": 2,
  "failed": 0,
  "results": [
    {
      "action": "create",
      "status": "success",
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "sku": "NEW-001"
    },
    {
      "action": "update",
      "status": "success",
      "id": "550e8400-e29b-41d4-a716-446655440000"
    },
    {
      "action": "upsert",
      "status": "success",
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "sku": "EXISTING-001"
    }
  ],
  "errors": []
}`}
      />

      <h2>Partial Success</h2>
      <p>
        If some operations fail, you'll receive a 207 Multi-Status response with details about
        successes and failures:
      </p>

      <CodeBlock
        language="json"
        code={`{
  "success": true,
  "processed": 3,
  "created": 1,
  "updated": 1,
  "failed": 1,
  "results": [
    {
      "action": "create",
      "status": "success",
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "sku": "NEW-001"
    },
    {
      "action": "update",
      "status": "success",
      "id": "550e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "errors": [
    {
      "action": "create",
      "status": "failed",
      "error": "Validation failed",
      "details": {
        "field": "price",
        "message": "Price must be a positive number"
      }
    }
  ]
}`}
      />

      <h2>Code Examples</h2>
      <CodeBlock
        language="javascript"
        title="JavaScript"
        code={`const response = await fetch('https://api.nexusxo.com/api/v1/manufacturer/products/batch', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer mk_prod_xxxxxxxxxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    operations: [
      {
        action: 'create',
        product: {
          sku: 'NEW-001',
          product_name: 'New Product',
          price: 29.99,
          category: 'Electronics'
        }
      },
      {
        action: 'upsert',
        product: {
          sku: 'EXISTING-001',
          product_name: 'Updated Product',
          price: 39.99
        }
      }
    ]
  })
});

const data = await response.json();
console.log(\`Processed: \${data.processed}, Created: \${data.created}, Updated: \${data.updated}\`);`}
      />

      <h2>Batch Delete</h2>
      <ApiEndpoint method="DELETE" path="/manufacturer/products/batch" description="Delete multiple products" />

      <CodeBlock
        language="json"
        code={`{
  "product_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ]
}`}
      />

      <h2>Limits</h2>
      <ParameterTable
        parameters={[
          {
            name: 'Maximum operations per batch',
            type: 'integer',
            required: false,
            description: 'Maximum number of operations in a single batch request',
            default: '1,000',
          },
          {
            name: 'Maximum request size',
            type: 'size',
            required: false,
            description: 'Maximum size of request body',
            default: '50 MB',
          },
        ]}
      />

      <Callout type="info" title="Best Practices">
        <ul>
          <li>Use batch operations for better performance when processing multiple products</li>
          <li>Batch operations count as a single request toward rate limits</li>
          <li>Validate your data before sending large batches</li>
          <li>Handle partial failures gracefully</li>
          <li>Use upsert for idempotent operations</li>
        </ul>
      </Callout>

      <h2>Try It Out</h2>
      <ApiExplorer
        method="POST"
        path="/manufacturer/products/batch"
        defaultBody={`{
  "operations": [
    {
      "action": "create",
      "product": {
        "sku": "BATCH-001",
        "product_name": "Batch Test Product",
        "price": 19.99,
        "category": "Test"
      }
    }
  ]
}`}
      />
    </div>
  )
}
