import ApiEndpoint from '@/components/docs/ApiEndpoint'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import ParameterTable from '@/components/docs/ParameterTable'

export default function DownloadProductsPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Download Products</h1>
      <p>
        Download product data in bulk. Retailers can download products from manufacturers they have
        access to. Downloads are available in multiple formats.
      </p>

      <ApiEndpoint method="GET" path="/products" description="Download products with filtering and pagination" />

      <h2>Query Parameters</h2>
      <ParameterTable
        parameters={[
          {
            name: 'page',
            type: 'integer',
            required: false,
            description: 'Page number for pagination',
            default: '1',
          },
          {
            name: 'limit',
            type: 'integer',
            required: false,
            description: 'Number of products per page',
            default: '50',
            example: 'max: 100',
          },
          {
            name: 'manufacturer_id',
            type: 'string (UUID)',
            required: false,
            description: 'Filter by manufacturer',
          },
          {
            name: 'category',
            type: 'string',
            required: false,
            description: 'Filter by category',
          },
          {
            name: 'search',
            type: 'string',
            required: false,
            description: 'Search in product name, SKU, or description',
          },
        ]}
      />

      <h2>Response</h2>
      <CodeBlock
        language="json"
        code={`{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "sku": "PROD-001",
      "product_name": "Example Product",
      "description": "Product description",
      "price": 29.99,
      "category": "Electronics",
      "stock_quantity": 100,
      "manufacturer_id": "123e4567-e89b-12d3-a456-426614174000",
      "manufacturer_name": "Example Manufacturer",
      "image_urls": ["https://example.com/image.jpg"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}`}
      />

      <h2>Bulk Download</h2>
      <ApiEndpoint method="POST" path="/downloads/generate" description="Generate a downloadable file (CSV/JSON/ZIP)" />

      <p>
        For large downloads, use the download generation endpoint to create a file with all
        selected products, including images and documents.
      </p>

      <CodeBlock
        language="json"
        code={`{
  "selection_mode": "manufacturer",
  "manufacturer_id": "123e4567-e89b-12d3-a456-426614174000",
  "attributes": ["id", "sku", "product_name", "price", "category"],
  "include_images": true,
  "include_documents": false,
  "format": "csv"
}`}
      />

      <h2>Code Examples</h2>
      <CodeBlock
        language="javascript"
        title="JavaScript - Paginated Download"
        code={`async function downloadAllProducts() {
  let page = 1;
  let allProducts = [];
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      \`https://api.nexusxo.com/api/v1/products?page=\${page}&limit=100\`,
      {
        headers: {
          'Authorization': 'Bearer rt_prod_xxxxxxxxxxxx'
        }
      }
    );

    const data = await response.json();
    allProducts = allProducts.concat(data.data);
    
    hasMore = page < data.pagination.pages;
    page++;
  }

  console.log(\`Downloaded \${allProducts.length} products\`);
  return allProducts;
}`}
      />

      <CodeBlock
        language="python"
        title="Python - Bulk Download"
        code={`import requests

def download_all_products():
    all_products = []
    page = 1
    
    while True:
        response = requests.get(
            f'https://api.nexusxo.com/api/v1/products',
            headers={'Authorization': 'Bearer rt_prod_xxxxxxxxxxxx'},
            params={'page': page, 'limit': 100}
        )
        
        data = response.json()
        all_products.extend(data['data'])
        
        if page >= data['pagination']['pages']:
            break
        page += 1
    
    return all_products

products = download_all_products()
print(f'Downloaded {len(products)} products')`}
      />

      <h2>Export Formats</h2>
      <ParameterTable
        parameters={[
          {
            name: 'JSON',
            type: 'format',
            required: false,
            description: 'Structured JSON format, good for programmatic use',
          },
          {
            name: 'CSV',
            type: 'format',
            required: false,
            description: 'Comma-separated values, good for Excel/spreadsheet tools',
          },
          {
            name: 'ZIP',
            type: 'format',
            required: false,
            description: 'ZIP archive containing data file plus images/documents',
          },
        ]}
      />

      <Callout type="info" title="Access Control">
        Retailers can only download products from manufacturers they have been granted access to.
        If you don't see products from a manufacturer, you may need to request access first.
      </Callout>

      <h2>Rate Limits</h2>
      <ul>
        <li>100 requests per minute</li>
        <li>Use bulk download endpoints for large datasets</li>
        <li>Consider pagination for better performance</li>
      </ul>
    </div>
  )
}
