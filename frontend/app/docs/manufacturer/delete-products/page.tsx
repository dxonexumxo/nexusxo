import ApiEndpoint from '@/components/docs/ApiEndpoint'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import ParameterTable from '@/components/docs/ParameterTable'

export default function DeleteProductsPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Delete Products</h1>
      <p>
        Delete products from your catalog. Products can be deleted individually by ID or by SKU.
        Deleted products are permanently removed and cannot be recovered.
      </p>

      <Callout type="warning" title="Permanent Deletion">
        Deleting a product permanently removes it from your catalog. This action cannot be undone.
        Retailers who previously had access to the product will no longer see it.
      </Callout>

      <ApiEndpoint method="DELETE" path="/manufacturer/products/{id}" description="Delete a product by ID" />

      <h2>Path Parameters</h2>
      <ParameterTable
        parameters={[
          {
            name: 'id',
            type: 'string (UUID)',
            required: true,
            description: 'The unique identifier of the product to delete',
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
        ]}
      />

      <h2>Response</h2>
      <h3>Success (200 OK)</h3>
      <CodeBlock
        language="json"
        code={`{
  "success": true,
  "message": "Product deleted successfully",
  "deleted_id": "550e8400-e29b-41d4-a716-446655440000"
}`}
      />

      <h2>Alternative: Delete by SKU</h2>
      <ApiEndpoint method="DELETE" path="/manufacturer/products/sku/{sku}" description="Delete a product by SKU" />

      <h2>Code Examples</h2>
      <CodeBlock
        language="bash"
        title="cURL"
        code={`curl -X DELETE "https://api.nexusxo.com/api/v1/manufacturer/products/550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer mk_prod_xxxxxxxxxxxx"`}
      />

      <CodeBlock
        language="javascript"
        title="JavaScript"
        code={`const response = await fetch(
  'https://api.nexusxo.com/api/v1/manufacturer/products/550e8400-e29b-41d4-a716-446655440000',
  {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer mk_prod_xxxxxxxxxxxx'
    }
  }
);

const data = await response.json();
console.log(data);`}
      />

      <CodeBlock
        language="python"
        title="Python"
        code={`import requests

response = requests.delete(
    'https://api.nexusxo.com/api/v1/manufacturer/products/550e8400-e29b-41d4-a716-446655440000',
    headers={
        'Authorization': 'Bearer mk_prod_xxxxxxxxxxxx'
    }
)

print(response.json())`}
      />

      <h2>Bulk Deletion</h2>
      <p>
        To delete multiple products at once, use the batch operations endpoint. See the{' '}
        <a href="/docs/manufacturer/batch-operations">Batch Operations</a> documentation for more
        details.
      </p>

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
            name: '403',
            type: 'status',
            required: false,
            description: 'Token does not have write:products scope',
          },
          {
            name: '409',
            type: 'status',
            required: false,
            description: 'Product cannot be deleted (e.g., in use by active orders)',
          },
        ]}
      />

      <Callout type="info" title="Safe Deletion Pattern">
        Before deleting products in production, consider:
        <ul>
          <li>Backing up product data</li>
          <li>Checking if products are referenced elsewhere</li>
          <li>Using a soft delete pattern if needed (marking as inactive instead)</li>
          <li>Notifying retailers about product removals</li>
        </ul>
      </Callout>
    </div>
  )
}
