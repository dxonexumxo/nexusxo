'use client'

import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'

export default function SampleFilesPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Sample Files</h1>
      <p>
        Download sample files and templates to help you format your data correctly when uploading
        products.
      </p>

      <h2>Product JSON Template</h2>
      <p>Use this template as a starting point for product data:</p>

      <CodeBlock
        language="json"
        code={`{
  "sku": "PROD-001",
  "product_name": "Example Product Name",
  "description": "Product description here",
  "price": 29.99,
  "category": "Electronics",
  "subcategory": "Gadgets",
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
  },
  "country_of_origin": "US",
  "upc": "123456789012"
}`}
      />

      <div className="my-6">
        <a
          href="#"
          className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          onClick={(e) => {
            e.preventDefault()
            const blob = new Blob([JSON.stringify({
              sku: 'PROD-001',
              product_name: 'Example Product Name',
              description: 'Product description here',
              price: 29.99,
              category: 'Electronics',
              subcategory: 'Gadgets',
              brand: 'Your Brand',
              stock_quantity: 100,
              image_urls: ['https://example.com/image1.jpg'],
              attributes: {
                color: 'Black',
                size: 'Medium',
                material: 'Plastic'
              }
            }, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'product-template.json'
            a.click()
            URL.revokeObjectURL(url)
          }}
        >
          Download JSON Template
        </a>
      </div>

      <h2>Bulk Upload Template</h2>
      <p>Template for bulk product uploads:</p>

      <CodeBlock
        language="json"
        code={`{
  "products": [
    {
      "sku": "PROD-001",
      "product_name": "Product 1",
      "price": 29.99,
      "category": "Electronics"
    },
    {
      "sku": "PROD-002",
      "product_name": "Product 2",
      "price": 39.99,
      "category": "Electronics"
    }
  ]
}`}
      />

      <h2>CSV Import Template</h2>
      <p>For importing products via CSV (when supported):</p>

      <CodeBlock
        language="csv"
        code={`sku,product_name,description,price,category,brand,stock_quantity
PROD-001,Example Product 1,Description 1,29.99,Electronics,Your Brand,100
PROD-002,Example Product 2,Description 2,39.99,Electronics,Your Brand,50`}
      />

      <h2>Sample Product Data</h2>
      <p>Complete example product with all fields:</p>

      <CodeBlock
        language="json"
        code={`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "sku": "WIDGET-PRO-001",
  "product_name": "Premium Widget Pro - Black",
  "description": "Our flagship widget featuring premium materials and advanced technology.",
  "price": 49.99,
  "category": "Electronics",
  "subcategory": "Gadgets",
  "brand": "WidgetCo",
  "stock_quantity": 250,
  "manufacturer_id": "123e4567-e89b-12d3-a456-426614174000",
  "manufacturer_name": "WidgetCo Manufacturing",
  "image_urls": [
    "https://cdn.example.com/products/widget-pro-front.jpg",
    "https://cdn.example.com/products/widget-pro-back.jpg"
  ],
  "attributes": {
    "color": "Black",
    "size": "Medium",
    "material": "Aluminum",
    "weight": "0.5kg",
    "dimensions": "10x5x3cm",
    "warranty": "2 years"
  },
  "country_of_origin": "US",
  "upc": "123456789012",
  "rating": 4.7,
  "launch_year": 2023,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}`}
      />

      <Callout type="info" title="Using Templates">
        <ul>
          <li>Copy the template structure</li>
          <li>Fill in your product data</li>
          <li>Validate JSON before uploading</li>
          <li>Only include fields you have data for</li>
          <li>Ensure SKUs are unique</li>
        </ul>
      </Callout>

      <h2>Validation Checklist</h2>
      <p>Before uploading, ensure:</p>
      <ul>
        <li>SKU is present and unique</li>
        <li>Product name is provided</li>
        <li>Price is a positive number</li>
        <li>Category is specified</li>
        <li>Image URLs are valid (if provided)</li>
        <li>JSON is properly formatted</li>
      </ul>
    </div>
  )
}
