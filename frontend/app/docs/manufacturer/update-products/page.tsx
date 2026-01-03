import ApiEndpoint from '@/components/docs/ApiEndpoint'
import ApiExplorer from '@/components/docs/ApiExplorer'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import ParameterTable from '@/components/docs/ParameterTable'

export default function UpdateProductsPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Update Products</h1>
      <p>
        Update existing products in your catalog. You can update individual products by ID or by
        SKU.
      </p>

      <ApiEndpoint
        method="PUT"
        path="/manufacturer/products/{id}"
        description="Update a product by ID"
      />

      <h2>Path Parameters</h2>
      <ParameterTable
        parameters={[
          {
            name: 'id',
            type: 'string (UUID)',
            required: true,
            description: 'The unique identifier of the product to update',
          },
        ]}
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
      <p>Include only the fields you want to update. Omitted fields will remain unchanged.</p>

      <CodeBlock
        language="json"
        code={`{
  "product_name": "Updated Product Name",
  "price": 39.99,
  "stock_quantity": 150,
  "description": "Updated description",
  "attributes": {
    "color": "Blue",
    "size": "Large"
  }
}`}
      />

      <h2>Response</h2>
      <h3>Success (200 OK)</h3>
      <CodeBlock
        language="json"
        code={`{
  "success": true,
  "product": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "sku": "ABC-123",
    "product_name": "Updated Product Name",
    "price": 39.99,
    "stock_quantity": 150,
    "updated_at": "2024-01-02T10:30:00Z"
  }
}`}
      />

      <h2>Alternative: Update by SKU</h2>
      <ApiEndpoint method="PUT" path="/manufacturer/products/sku/{sku}" description="Update a product by SKU" />

      <Callout type="info" title="Update by SKU">
        You can also update products using their SKU instead of ID. This is useful when you know the
        SKU but not the internal ID. The SKU must be unique within your catalog.
      </Callout>

      <h2>Code Examples</h2>
      <CodeBlock
        language="bash"
        title="cURL"
        code={`curl -X PUT "https://api.nexusxo.com/api/v1/manufacturer/products/550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer mk_prod_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "price": 39.99,
    "stock_quantity": 150
  }'`}
      />

      <CodeBlock
        language="javascript"
        title="JavaScript"
        code={`const response = await fetch(
  'https://api.nexusxo.com/api/v1/manufacturer/products/550e8400-e29b-41d4-a716-446655440000',
  {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer mk_prod_xxxxxxxxxxxx',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      price: 39.99,
      stock_quantity: 150
    })
  }
);

const data = await response.json();
console.log(data);`}
      />

      <CodeBlock
        language="python"
        title="Python"
        code={`import requests

response = requests.put(
    'https://api.nexusxo.com/api/v1/manufacturer/products/550e8400-e29b-41d4-a716-446655440000',
    headers={
        'Authorization': 'Bearer mk_prod_xxxxxxxxxxxx',
        'Content-Type': 'application/json'
    },
    json={
        'price': 39.99,
        'stock_quantity': 150
    }
)

print(response.json())`}
      />

      <h2>Try It Out</h2>
      <ApiExplorer
        method="PUT"
        path="/manufacturer/products/YOUR_PRODUCT_ID"
        defaultBody={`{
  "price": 29.99,
  "stock_quantity": 100
}`}
      />

      <h2>Partial Updates</h2>
      <p>
        You only need to include the fields you want to update. Fields not included in the request
        will remain unchanged. This allows you to update just the price, or just the stock
        quantity, without affecting other fields.
      </p>

      <Callout type="warning" title="Important Notes">
        <ul>
          <li>You cannot change the SKU of an existing product</li>
          <li>You cannot change the manufacturer_id of a product</li>
          <li>Empty arrays or objects will replace existing values</li>
          <li>Set fields to null to clear them (where allowed)</li>
        </ul>
      </Callout>

      <h2>Common Errors</h2>
      <ParameterTable
        parameters={[
          {
            name: '404',
            type: 'status',
            required: false,
            description: 'Product not found',
          },
          {
            name: '422',
            type: 'status',
            required: false,
            description: 'Validation error - check request body',
          },
          {
            name: '403',
            type: 'status',
            required: false,
            description: 'Token does not have write:products scope',
          },
        ]}
      />
    </div>
  )
}
