import ApiEndpoint from '@/components/docs/ApiEndpoint'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import ParameterTable from '@/components/docs/ParameterTable'

export default function ManufacturerInfoPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Get Manufacturer Information</h1>
      <p>
        Retrieve information about manufacturers you have access to. This includes company details,
        contact information, and product statistics.
      </p>

      <ApiEndpoint method="GET" path="/manufacturers" description="List all accessible manufacturers" />

      <h2>Query Parameters</h2>
      <ParameterTable
        parameters={[
          {
            name: 'industry',
            type: 'string',
            required: false,
            description: 'Filter by industry',
            example: 'Consumer Goods',
          },
        ]}
      />

      <h2>Response</h2>
      <CodeBlock
        language="json"
        code={`{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "company_name": "Example Manufacturer",
      "industry": "Consumer Goods",
      "email": "contact@example.com",
      "product_count": 150,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}`}
      />

      <h2>Get Single Manufacturer</h2>
      <ApiEndpoint method="GET" path="/manufacturers/{id}" description="Get detailed information about a specific manufacturer" />

      <h2>Path Parameters</h2>
      <ParameterTable
        parameters={[
          {
            name: 'id',
            type: 'string (UUID)',
            required: true,
            description: 'The unique identifier of the manufacturer',
          },
        ]}
      />

      <h2>Detailed Response</h2>
      <CodeBlock
        language="json"
        code={`{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "company_name": "Example Manufacturer",
    "industry": "Consumer Goods",
    "email": "contact@example.com",
    "product_count": 150,
    "categories": ["Electronics", "Accessories"],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-02T10:30:00Z"
  }
}`}
      />

      <h2>Code Examples</h2>
      <CodeBlock
        language="javascript"
        title="JavaScript"
        code={`// List all manufacturers
const response = await fetch('https://api.nexusxo.com/api/v1/manufacturers', {
  headers: {
    'Authorization': 'Bearer rt_prod_xxxxxxxxxxxx'
  }
});

const { data: manufacturers } = await response.json();
console.log(\`Access to \${manufacturers.length} manufacturers\`);

// Get specific manufacturer
const manufacturerResponse = await fetch(
  'https://api.nexusxo.com/api/v1/manufacturers/123e4567-e89b-12d3-a456-426614174000',
  {
    headers: {
      'Authorization': 'Bearer rt_prod_xxxxxxxxxxxx'
    }
  }
);

const { data: manufacturer } = await manufacturerResponse.json();
console.log(\`Manufacturer: \${manufacturer.company_name}, Products: \${manufacturer.product_count}\`);`}
      />

      <Callout type="info" title="Access Control">
        You can only see manufacturers you have been granted access to. If you need access to a
        manufacturer, request it through your dashboard.
      </Callout>

      <h2>Use Cases</h2>
      <ul>
        <li>Display manufacturer information on product pages</li>
        <li>Build manufacturer selection filters</li>
        <li>Get product counts per manufacturer</li>
        <li>Filter products by manufacturer details</li>
      </ul>
    </div>
  )
}
