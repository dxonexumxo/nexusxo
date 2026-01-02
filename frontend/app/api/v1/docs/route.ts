import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
  
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'NexusXO API',
      version: '1.0.0',
      description: 'B2B Product Data Exchange API - Access product catalogs, manufacturer data, and manage integrations programmatically.',
      contact: {
        name: 'NexusXO Support',
        email: 'api@nexusxo.com'
      }
    },
    servers: [
      {
        url: `${baseUrl}/api/v1`,
        description: 'Production API'
      }
    ],
    security: [{ BearerAuth: [] }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Token',
          description: 'Use your API token with Bearer scheme: `Authorization: Bearer nx_your_token_here`'
        }
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sku: { type: 'string', description: 'Stock Keeping Unit' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', format: 'float' },
            category: { type: 'string' },
            stock_quantity: { type: 'integer' },
            image_urls: { 
              type: 'array',
              items: { type: 'string', format: 'uri' }
            },
            attributes: { type: 'object' },
            manufacturer_id: { type: 'string', format: 'uuid' },
            manufacturer: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                company_name: { type: 'string' }
              }
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Manufacturer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            company_name: { type: 'string' },
            industry: { type: 'string' },
            email: { type: 'string', format: 'email' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            pages: { type: 'integer' }
          }
        }
      }
    },
    paths: {
      '/products': {
        get: {
          summary: 'List products',
          description: 'Retrieve paginated list of products with optional filtering. Retailers can only see products from manufacturers they have access to.',
          operationId: 'listProducts',
          tags: ['Products'],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1, minimum: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 50, minimum: 1, maximum: 100 }
            },
            {
              name: 'manufacturer_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' }
            },
            {
              name: 'category',
              in: 'query',
              schema: { type: 'string' }
            },
            {
              name: 'search',
              in: 'query',
              description: 'Search in SKU, product name, or description',
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Product' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      meta: {
                        type: 'object',
                        properties: {
                          response_time_ms: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            403: {
              description: 'Forbidden - Access denied',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/products/{id}': {
        get: {
          summary: 'Get product details',
          description: 'Retrieve detailed information about a specific product',
          operationId: 'getProduct',
          tags: ['Products'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            200: {
              description: 'Product found',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/Product' }
                    }
                  }
                }
              }
            },
            404: {
              description: 'Product not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            403: {
              description: 'Forbidden - Access denied',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/manufacturers': {
        get: {
          summary: 'List manufacturers',
          description: 'Retrieve list of manufacturers. Retailers can only see manufacturers they have access to.',
          operationId: 'listManufacturers',
          tags: ['Manufacturers'],
          parameters: [
            {
              name: 'industry',
              in: 'query',
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Manufacturer' }
                      }
                    }
                  }
                }
              }
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      }
    }
  }

  return NextResponse.json(openApiSpec)
}
