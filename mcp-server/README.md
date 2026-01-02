# NexusXO MCP Server

Model Context Protocol (MCP) server for accessing NexusXO product data through AI assistants like Claude Desktop, ChatGPT, and Cursor.

## Installation

```bash
npm install
```

## Configuration

Set environment variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OR use public variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Usage

### Standalone

```bash
npm start
```

### With Claude Desktop

1. Edit Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add MCP server configuration:

```json
{
  "mcpServers": {
    "nexusxo": {
      "command": "node",
      "args": ["/absolute/path/to/nexusxo/mcp-server/index.js"],
      "env": {
        "SUPABASE_URL": "your_supabase_url",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key"
      }
    }
  }
}
```

3. Restart Claude Desktop

## Available Tools

### search_products
Search the product catalog by name, SKU, or description.

**Parameters:**
- `query` (required): Search term
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)
- `category` (optional): Filter by category
- `manufacturer_id` (optional): Filter by manufacturer ID

### get_product_details
Get detailed information about a specific product by ID.

**Parameters:**
- `id` (required): Product ID (UUID)

### get_product_by_sku
Find a product by its SKU.

**Parameters:**
- `sku` (required): Product SKU

### list_manufacturers
Get a list of all manufacturers.

**Parameters:**
- `industry` (optional): Filter by industry

### compare_products
Compare multiple products side-by-side.

**Parameters:**
- `product_ids` (required): Array of 2-4 product IDs (UUIDs)

### list_categories
Get a list of all unique product categories.

**Parameters:** None

## Example Queries

Once configured, you can ask Claude:

- "Search for laptops in the NexusXO catalog"
- "Get details for product ID abc-123"
- "Find product with SKU ABC123"
- "Compare these three products: [product IDs]"
- "What product categories are available?"
- "List all manufacturers in the electronics industry"

## Troubleshooting

- Ensure environment variables are set correctly
- Check that Supabase credentials have appropriate permissions
- Verify the file path in Claude Desktop config is absolute
- Check console logs for error messages
