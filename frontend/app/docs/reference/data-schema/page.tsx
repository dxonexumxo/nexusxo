import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import ParameterTable from '@/components/docs/ParameterTable'

export default function DataSchemaPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Data Schema</h1>
      <p>
        Complete reference for product data structure, field types, validation rules, and example
        objects.
      </p>

      <h2>Product Object</h2>
      <p>The product object represents a single product in the catalog.</p>

      <CodeBlock
        language="json"
        code={`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "sku": "PROD-001",
  "product_name": "Widget Pro",
  "description": "A high-quality widget for all your needs",
  "price": 29.99,
  "category": "Electronics",
  "subcategory": "Gadgets",
  "brand": "Your Brand",
  "stock_quantity": 100,
  "manufacturer_id": "123e4567-e89b-12d3-a456-426614174000",
  "manufacturer_name": "Example Manufacturer",
  "image_url": "https://example.com/image.jpg",
  "image_urls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "attributes": {
    "color": "Black",
    "size": "Medium",
    "material": "Plastic",
    "weight": "0.5kg"
  },
  "country_of_origin": "US",
  "upc": "123456789012",
  "rating": 4.5,
  "launch_year": 2023,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}`}
      />

      <h2>Field Reference</h2>
      <ParameterTable
        parameters={[
          {
            name: 'id',
            type: 'string (UUID)',
            required: false,
            description: 'Unique product identifier (auto-generated)',
          },
          {
            name: 'sku',
            type: 'string',
            required: true,
            description: 'Stock Keeping Unit - must be unique per manufacturer',
            example: 'PROD-001',
          },
          {
            name: 'product_name',
            type: 'string',
            required: true,
            description: 'Product name or title',
            example: 'Widget Pro',
          },
          {
            name: 'description',
            type: 'string',
            required: false,
            description: 'Product description (supports markdown)',
          },
          {
            name: 'price',
            type: 'number',
            required: true,
            description: 'Product price (must be positive)',
            example: '29.99',
          },
          {
            name: 'category',
            type: 'string',
            required: true,
            description: 'Main product category',
            example: 'Electronics',
          },
          {
            name: 'subcategory',
            type: 'string',
            required: false,
            description: 'Product subcategory',
            example: 'Gadgets',
          },
          {
            name: 'brand',
            type: 'string',
            required: false,
            description: 'Product brand name',
          },
          {
            name: 'stock_quantity',
            type: 'integer',
            required: false,
            description: 'Available stock quantity',
            example: '100',
          },
          {
            name: 'image_url',
            type: 'string (URL)',
            required: false,
            description: 'Primary product image URL (deprecated - use image_urls)',
          },
          {
            name: 'image_urls',
            type: 'array of strings',
            required: false,
            description: 'Array of product image URLs',
          },
          {
            name: 'attributes',
            type: 'object',
            required: false,
            description: 'Additional product attributes (key-value pairs)',
          },
          {
            name: 'manufacturer_id',
            type: 'string (UUID)',
            required: false,
            description: 'Manufacturer identifier (auto-set)',
          },
          {
            name: 'created_at',
            type: 'string (ISO 8601)',
            required: false,
            description: 'Creation timestamp (read-only)',
          },
          {
            name: 'updated_at',
            type: 'string (ISO 8601)',
            required: false,
            description: 'Last update timestamp (read-only)',
          },
        ]}
      />

      <h2>Validation Rules</h2>
      <ParameterTable
        parameters={[
          {
            name: 'sku',
            type: 'rule',
            required: false,
            description: 'Required, unique per manufacturer, max 255 characters',
          },
          {
            name: 'product_name',
            type: 'rule',
            required: false,
            description: 'Required, max 500 characters',
          },
          {
            name: 'price',
            type: 'rule',
            required: false,
            description: 'Required, must be positive number, max 2 decimal places',
          },
          {
            name: 'category',
            type: 'rule',
            required: false,
            description: 'Required, max 100 characters',
          },
          {
            name: 'stock_quantity',
            type: 'rule',
            required: false,
            description: 'Optional, must be non-negative integer',
          },
          {
            name: 'image_urls',
            type: 'rule',
            required: false,
            description: 'Optional, array of valid URLs, max 20 images',
          },
        ]}
      />

      <h2>Manufacturer Object</h2>
      <CodeBlock
        language="json"
        code={`{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "company_name": "Example Manufacturer",
  "industry": "Consumer Goods",
  "email": "contact@example.com",
  "product_count": 150,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T10:30:00Z"
}`}
      />

      <Callout type="info" title="Data Types">
        <ul>
          <li>
            <strong>UUID:</strong> Standard UUID v4 format (e.g.,
            "550e8400-e29b-41d4-a716-446655440000")
          </li>
          <li>
            <strong>ISO 8601:</strong> Timestamps in ISO 8601 format with timezone (e.g.,
            "2024-01-01T00:00:00Z")
          </li>
          <li>
            <strong>URL:</strong> Valid HTTP/HTTPS URLs for images and resources
          </li>
          <li>
            <strong>JSON Object:</strong> Free-form key-value pairs for attributes
          </li>
        </ul>
      </Callout>

      <h2>Example Complete Product</h2>
      <CodeBlock
        language="json"
        code={`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "sku": "WIDGET-PRO-001",
  "product_name": "Premium Widget Pro - Black",
  "description": "Our flagship widget featuring premium materials and advanced technology. Perfect for professionals who demand quality.",
  "price": 49.99,
  "category": "Electronics",
  "subcategory": "Gadgets",
  "brand": "WidgetCo",
  "stock_quantity": 250,
  "manufacturer_id": "123e4567-e89b-12d3-a456-426614174000",
  "manufacturer_name": "WidgetCo Manufacturing",
  "image_urls": [
    "https://cdn.example.com/products/widget-pro-front.jpg",
    "https://cdn.example.com/products/widget-pro-back.jpg",
    "https://cdn.example.com/products/widget-pro-detail.jpg"
  ],
  "attributes": {
    "color": "Black",
    "size": "Medium",
    "material": "Aluminum",
    "weight": "0.5kg",
    "dimensions": "10x5x3cm",
    "warranty": "2 years",
    "certifications": ["CE", "FCC"]
  },
  "country_of_origin": "US",
  "upc": "123456789012",
  "rating": 4.7,
  "launch_year": 2023,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}`}
      />
    </div>
  )
}
