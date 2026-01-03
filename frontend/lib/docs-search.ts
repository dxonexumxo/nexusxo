// Documentation search index
// This file contains the searchable content from all documentation pages

export interface DocPage {
  title: string
  href: string
  content: string
  section: string
}

export const documentationPages: DocPage[] = [
  {
    title: 'Introduction',
    href: '/docs',
    section: 'Getting Started',
    content: 'Welcome to NexusXO API documentation. Build powerful integrations with our data exchange platform for manufacturers and retailers.',
  },
  {
    title: 'Authentication',
    href: '/docs/authentication',
    section: 'Getting Started',
    content: 'All API requests require authentication using an API token. Learn how to get your API key, use it in requests, and follow security best practices. API key types, token scopes, expiration, and error responses.',
  },
  {
    title: 'Quick Start',
    href: '/docs/quick-start',
    section: 'Getting Started',
    content: 'Get up and running with the NexusXO API in minutes. Step-by-step guide to make your first API call. Examples in cURL, JavaScript, and Python. Prerequisites, getting your API key, understanding responses.',
  },
  {
    title: 'Rate Limits',
    href: '/docs/rate-limits',
    section: 'Getting Started',
    content: 'Rate limits ensure fair usage and system stability. Default limits, rate limit headers, handling rate limit exceeded errors. Best practices including exponential backoff, bulk operations, caching, and monitoring.',
  },
  {
    title: 'Upload Products',
    href: '/docs/manufacturer/upload-products',
    section: 'Manufacturer API',
    content: 'Upload one or multiple products to your catalog. Single product upload, bulk upload, request body format, response examples. Rate limits, common errors, validation errors.',
  },
  {
    title: 'Update Products',
    href: '/docs/manufacturer/update-products',
    section: 'Manufacturer API',
    content: 'Update existing products in your catalog. Update by ID or SKU, partial updates, request body format. Response examples, code examples, common errors.',
  },
  {
    title: 'Delete Products',
    href: '/docs/manufacturer/delete-products',
    section: 'Manufacturer API',
    content: 'Delete products from your catalog. Delete by ID or SKU. Permanent deletion warning. Response format, bulk deletion, common errors, safe deletion patterns.',
  },
  {
    title: 'Batch Operations',
    href: '/docs/manufacturer/batch-operations',
    section: 'Manufacturer API',
    content: 'Perform bulk operations on multiple products. Batch upload, create, update, upsert actions. Batch delete. Limits, best practices, partial success handling.',
  },
  {
    title: 'Download Products',
    href: '/docs/retailer/download-products',
    section: 'Retailer API',
    content: 'Download product data in bulk. Query parameters, pagination, bulk download endpoint. Export formats JSON CSV ZIP. Code examples, rate limits, access control.',
  },
  {
    title: 'Filter & Query',
    href: '/docs/retailer/filter-query',
    section: 'Retailer API',
    content: 'Search and filter products using various criteria. Text search, filtering by category, manufacturer, price range. Query parameters, search examples, advanced querying, performance considerations.',
  },
  {
    title: 'Get Manufacturer Info',
    href: '/docs/retailer/manufacturer-info',
    section: 'Retailer API',
    content: 'Retrieve information about manufacturers. List all accessible manufacturers, get single manufacturer details. Query parameters, response format, code examples, access control, use cases.',
  },
  {
    title: 'Error Codes',
    href: '/docs/reference/error-codes',
    section: 'Reference',
    content: 'Complete reference for all API error responses. HTTP status codes 400 401 403 404 409 422 429 500. Error response format, error code reference, handling errors, best practices.',
  },
  {
    title: 'Data Schema',
    href: '/docs/reference/data-schema',
    section: 'Reference',
    content: 'Complete reference for product data structure. Field types, validation rules, product object, manufacturer object. Example complete products, data types UUID ISO 8601.',
  },
  {
    title: 'Changelog',
    href: '/docs/reference/changelog',
    section: 'Reference',
    content: 'History of API changes, new features, and deprecations. Version history, upcoming changes, deprecation policy, breaking changes, migration guides.',
  },
  {
    title: 'Code Examples',
    href: '/docs/sdks/code-examples',
    section: 'SDKs & Tools',
    content: 'Code examples in multiple programming languages. JavaScript TypeScript fetch axios, Python requests, PHP cURL, C# HttpClient, Ruby Net::HTTP. Complete examples for common operations.',
  },
  {
    title: 'Postman Collection',
    href: '/docs/sdks/postman',
    section: 'SDKs & Tools',
    content: 'Import our Postman collection to test API endpoints. Download collection, import into Postman, environment variables, collection structure, OpenAPI specification.',
  },
  {
    title: 'Sample Files',
    href: '/docs/sdks/sample-files',
    section: 'SDKs & Tools',
    content: 'Download sample files and templates. Product JSON template, bulk upload template, CSV import template, sample product data, validation checklist.',
  },
]
