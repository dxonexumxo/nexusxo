import ApiEndpoint from '@/components/docs/ApiEndpoint'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import ParameterTable from '@/components/docs/ParameterTable'

export default function FilterQueryPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Filter & Query Products</h1>
      <p>
        Search and filter products using various criteria. The query system supports text search,
        filtering by category, manufacturer, price range, and more.
      </p>

      <ApiEndpoint method="GET" path="/products" description="Query products with filters and search" />

      <h2>Query Parameters</h2>
      <ParameterTable
        parameters={[
          {
            name: 'search',
            type: 'string',
            required: false,
            description: 'Full-text search in product name, SKU, and description',
            example: 'widget',
          },
          {
            name: 'manufacturer_id',
            type: 'string (UUID)',
            required: false,
            description: 'Filter by specific manufacturer',
          },
          {
            name: 'category',
            type: 'string',
            required: false,
            description: 'Filter by product category',
            example: 'Electronics',
          },
          {
            name: 'min_price',
            type: 'number',
            required: false,
            description: 'Minimum price filter',
            example: '10.00',
          },
          {
            name: 'max_price',
            type: 'number',
            required: false,
            description: 'Maximum price filter',
            example: '100.00',
          },
          {
            name: 'in_stock',
            type: 'boolean',
            required: false,
            description: 'Filter by stock availability',
            example: 'true',
          },
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
            description: 'Results per page',
            default: '50',
          },
        ]}
      />

      <h2>Search Examples</h2>

      <h3>Text Search</h3>
      <CodeBlock
        language="bash"
        code={`curl "https://api.nexusxo.com/api/v1/products?search=widget" \\
  -H "Authorization: Bearer rt_prod_xxxxxxxxxxxx"`}
      />

      <h3>Filter by Category</h3>
      <CodeBlock
        language="bash"
        code={`curl "https://api.nexusxo.com/api/v1/products?category=Electronics" \\
  -H "Authorization: Bearer rt_prod_xxxxxxxxxxxx"`}
      />

      <h3>Price Range</h3>
      <CodeBlock
        language="bash"
        code={`curl "https://api.nexusxo.com/api/v1/products?min_price=10&max_price=100" \\
  -H "Authorization: Bearer rt_prod_xxxxxxxxxxxx"`}
      />

      <h3>Combined Filters</h3>
      <CodeBlock
        language="bash"
        code={`curl "https://api.nexusxo.com/api/v1/products?search=widget&category=Electronics&min_price=20&in_stock=true" \\
  -H "Authorization: Bearer rt_prod_xxxxxxxxxxxx"`}
      />

      <h2>Code Examples</h2>
      <CodeBlock
        language="javascript"
        title="JavaScript"
        code={`const searchProducts = async (query) => {
  const params = new URLSearchParams({
    search: query,
    category: 'Electronics',
    min_price: '20',
    in_stock: 'true',
    limit: '50'
  });

  const response = await fetch(
    \`https://api.nexusxo.com/api/v1/products?\${params}\`,
    {
      headers: {
        'Authorization': 'Bearer rt_prod_xxxxxxxxxxxx'
      }
    }
  );

  const data = await response.json();
  return data.data;
};

const products = await searchProducts('widget');
console.log(\`Found \${products.length} products\`);`}
      />

      <h2>Response Format</h2>
      <CodeBlock
        language="json"
        code={`{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "sku": "PROD-001",
      "product_name": "Widget Pro",
      "price": 29.99,
      "category": "Electronics",
      "stock_quantity": 100
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "pages": 1
  },
  "meta": {
    "response_time_ms": 45,
    "filters_applied": {
      "search": "widget",
      "category": "Electronics"
    }
  }
}`}
      />

      <h2>Advanced Querying</h2>
      <p>
        You can combine multiple filters to create complex queries. All filters are combined with
        AND logic (products must match all specified criteria).
      </p>

      <Callout type="info" title="Search Tips">
        <ul>
          <li>Search is case-insensitive</li>
          <li>Search matches partial words (e.g., "wid" matches "widget")</li>
          <li>Use specific categories for better performance</li>
          <li>Combine filters to narrow results</li>
          <li>Use pagination for large result sets</li>
        </ul>
      </Callout>

      <h2>Performance Considerations</h2>
      <ul>
        <li>Text search is slower than filtering by specific fields</li>
        <li>Combine specific filters with search for better performance</li>
        <li>Use pagination for large result sets</li>
        <li>Limit results per page (max 100) for faster responses</li>
      </ul>
    </div>
  )
}
