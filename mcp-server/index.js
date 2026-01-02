#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const server = new Server(
  {
    name: 'nexusxo-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_products',
        description: 'Search the product catalog by name, SKU, or description. Returns paginated results.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search term to find in product name, SKU, or description',
            },
            page: {
              type: 'integer',
              description: 'Page number (default: 1)',
              default: 1,
            },
            limit: {
              type: 'integer',
              description: 'Results per page (default: 20, max: 100)',
              default: 20,
            },
            category: {
              type: 'string',
              description: 'Filter by product category',
            },
            manufacturer_id: {
              type: 'string',
              description: 'Filter by manufacturer ID (UUID)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_product_details',
        description: 'Get detailed information about a specific product by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Product ID (UUID)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_product_by_sku',
        description: 'Find a product by its SKU (Stock Keeping Unit)',
        inputSchema: {
          type: 'object',
          properties: {
            sku: {
              type: 'string',
              description: 'Product SKU',
            },
          },
          required: ['sku'],
        },
      },
      {
        name: 'list_manufacturers',
        description: 'Get a list of all manufacturers. Can be filtered by industry.',
        inputSchema: {
          type: 'object',
          properties: {
            industry: {
              type: 'string',
              description: 'Filter by industry',
            },
          },
        },
      },
      {
        name: 'compare_products',
        description: 'Compare multiple products side-by-side. Provide an array of product IDs.',
        inputSchema: {
          type: 'object',
          properties: {
            product_ids: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of product IDs (UUIDs) to compare (max 4)',
              minItems: 2,
              maxItems: 4,
            },
          },
          required: ['product_ids'],
        },
      },
      {
        name: 'list_categories',
        description: 'Get a list of all unique product categories in the catalog',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'search_products': {
        const { query, page = 1, limit = 20, category, manufacturer_id } = args || {}
        const actualLimit = Math.min(limit, 100)

        let supabaseQuery = supabase
          .from('product_data')
          .select('id, sku, product_name, category, description, price, stock_quantity, image_urls, manufacturer_id, manufacturers(id, company_name)', { count: 'exact' })
          .or(`sku.ilike.%${query}%,product_name.ilike.%${query}%,description.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          .range((page - 1) * actualLimit, page * actualLimit - 1)

        if (category) {
          supabaseQuery = supabaseQuery.eq('category', category)
        }

        if (manufacturer_id) {
          supabaseQuery = supabaseQuery.eq('manufacturer_id', manufacturer_id)
        }

        const { data, error, count } = await supabaseQuery

        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: error.message }, null, 2),
              },
            ],
            isError: true,
          }
        }

        const results = (data || []).map((product) => ({
          id: product.id,
          sku: product.sku,
          name: product.product_name,
          description: product.description,
          price: product.price,
          category: product.category,
          stock_quantity: product.stock_quantity,
          manufacturer: product.manufacturers ? product.manufacturers.company_name : null,
        }))

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  results,
                  pagination: {
                    page,
                    limit: actualLimit,
                    total: count || 0,
                    pages: Math.ceil((count || 0) / actualLimit),
                  },
                },
                null,
                2
              ),
            },
          ],
        }
      }

      case 'get_product_details': {
        const { id } = args || {}
        if (!id) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: 'Product ID is required' }, null, 2),
              },
            ],
            isError: true,
          }
        }

        const { data, error } = await supabase
          .from('product_data')
          .select('*, manufacturers(id, company_name, industry, email)')
          .eq('id', id)
          .single()

        if (error || !data) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: 'Product not found' }, null, 2),
              },
            ],
            isError: true,
          }
        }

        const product = {
          id: data.id,
          sku: data.sku,
          name: data.product_name,
          description: data.description,
          price: data.price,
          category: data.category,
          stock_quantity: data.stock_quantity,
          image_urls: data.image_urls,
          attributes: data.attributes_json,
          manufacturer: data.manufacturers ? {
            id: data.manufacturers.id,
            company_name: data.manufacturers.company_name,
            industry: data.manufacturers.industry,
            email: data.manufacturers.email,
          } : null,
          created_at: data.created_at,
          updated_at: data.updated_at,
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ product }, null, 2),
            },
          ],
        }
      }

      case 'get_product_by_sku': {
        const { sku } = args || {}
        if (!sku) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: 'SKU is required' }, null, 2),
              },
            ],
            isError: true,
          }
        }

        const { data, error } = await supabase
          .from('product_data')
          .select('id, sku, product_name, category, description, price, stock_quantity, manufacturer_id, manufacturers(id, company_name)')
          .eq('sku', sku)
          .single()

        if (error || !data) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: 'Product not found' }, null, 2),
              },
            ],
            isError: true,
          }
        }

        const product = {
          id: data.id,
          sku: data.sku,
          name: data.product_name,
          description: data.description,
          price: data.price,
          category: data.category,
          stock_quantity: data.stock_quantity,
          manufacturer: data.manufacturers ? data.manufacturers.company_name : null,
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ product }, null, 2),
            },
          ],
        }
      }

      case 'list_manufacturers': {
        const { industry } = args || {}

        let supabaseQuery = supabase
          .from('manufacturers')
          .select('id, company_name, industry, email, created_at')
          .order('company_name', { ascending: true })

        if (industry) {
          supabaseQuery = supabaseQuery.eq('industry', industry)
        }

        const { data, error } = await supabaseQuery

        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: error.message }, null, 2),
              },
            ],
            isError: true,
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ manufacturers: data || [] }, null, 2),
            },
          ],
        }
      }

      case 'compare_products': {
        const { product_ids } = args || {}
        if (!product_ids || !Array.isArray(product_ids) || product_ids.length < 2 || product_ids.length > 4) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: 'Please provide 2-4 product IDs to compare' }, null, 2),
              },
            ],
            isError: true,
          }
        }

        const { data, error } = await supabase
          .from('product_data')
          .select('id, sku, product_name, category, description, price, stock_quantity, image_urls, attributes_json, manufacturer_id, manufacturers(id, company_name)')
          .in('id', product_ids)

        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: error.message }, null, 2),
              },
            ],
            isError: true,
          }
        }

        const comparison = (data || []).map((product) => ({
          id: product.id,
          sku: product.sku,
          name: product.product_name,
          description: product.description,
          price: product.price,
          category: product.category,
          stock_quantity: product.stock_quantity,
          attributes: product.attributes_json,
          manufacturer: product.manufacturers ? product.manufacturers.company_name : null,
        }))

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ comparison }, null, 2),
            },
          ],
        }
      }

      case 'list_categories': {
        const { data, error } = await supabase
          .from('product_data')
          .select('category')
          .not('category', 'is', null)

        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: error.message }, null, 2),
              },
            ],
            isError: true,
          }
        }

        const categories = [...new Set((data || []).map((item) => item.category).filter(Boolean))].sort()

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ categories }, null, 2),
            },
          ],
        }
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Unknown tool: ${name}` }, null, 2),
            },
          ],
          isError: true,
        }
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message || 'An unexpected error occurred' }, null, 2),
        },
      ],
      isError: true,
    }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('NexusXO MCP server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error in main():', error)
  process.exit(1)
})
