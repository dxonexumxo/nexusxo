# NexusXO API Integration System - Setup Guide

This document describes the complete API integration system for NexusXO, including REST API endpoints, API token management, MCP server, and webhook system.

## Database Schema Requirements

The following tables need to be created in your Supabase database:

### 1. `api_tokens`
```sql
CREATE TABLE api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
  manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE CASCADE,
  token_name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_tokens_token_hash ON api_tokens(token_hash);
CREATE INDEX idx_api_tokens_retailer_id ON api_tokens(retailer_id);
CREATE INDEX idx_api_tokens_manufacturer_id ON api_tokens(manufacturer_id);
```

### 2. `api_rate_limits`
```sql
CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES api_tokens(id) ON DELETE CASCADE UNIQUE,
  requests_per_minute INTEGER DEFAULT 60,
  requests_per_hour INTEGER DEFAULT 1000,
  requests_per_day INTEGER DEFAULT 10000,
  current_minute_count INTEGER DEFAULT 0,
  current_hour_count INTEGER DEFAULT 0,
  current_day_count INTEGER DEFAULT 0,
  minute_window_start TIMESTAMPTZ DEFAULT NOW(),
  hour_window_start TIMESTAMPTZ DEFAULT NOW(),
  day_window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_rate_limits_token_id ON api_rate_limits(token_id);
```

### 3. `api_usage_logs`
```sql
CREATE TABLE api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES api_tokens(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_usage_logs_token_id ON api_usage_logs(token_id);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);
```

### 4. `webhooks`
```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
  manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  consecutive_failures INTEGER DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_retailer_id ON webhooks(retailer_id);
CREATE INDEX idx_webhooks_manufacturer_id ON webhooks(manufacturer_id);
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);
```

### 5. `webhook_deliveries`
```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  status_code INTEGER,
  error_message TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_attempted_at ON webhook_deliveries(attempted_at);
CREATE INDEX idx_webhook_deliveries_success ON webhook_deliveries(success);
```

## Row Level Security (RLS) Policies

Add RLS policies to ensure data security:

```sql
-- api_tokens
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tokens"
  ON api_tokens FOR SELECT
  USING (retailer_id = auth.uid() OR manufacturer_id = auth.uid());

CREATE POLICY "Users can create their own tokens"
  ON api_tokens FOR INSERT
  WITH CHECK (retailer_id = auth.uid() OR manufacturer_id = auth.uid());

CREATE POLICY "Users can update their own tokens"
  ON api_tokens FOR UPDATE
  USING (retailer_id = auth.uid() OR manufacturer_id = auth.uid());

CREATE POLICY "Users can delete their own tokens"
  ON api_tokens FOR DELETE
  USING (retailer_id = auth.uid() OR manufacturer_id = auth.uid());

-- api_rate_limits
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
  ON api_rate_limits FOR ALL
  USING (true);

-- api_usage_logs
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage usage logs"
  ON api_usage_logs FOR ALL
  USING (true);

-- webhooks
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhooks"
  ON webhooks FOR SELECT
  USING (retailer_id = auth.uid() OR manufacturer_id = auth.uid());

CREATE POLICY "Users can create their own webhooks"
  ON webhooks FOR INSERT
  WITH CHECK (retailer_id = auth.uid() OR manufacturer_id = auth.uid());

CREATE POLICY "Users can update their own webhooks"
  ON webhooks FOR UPDATE
  USING (retailer_id = auth.uid() OR manufacturer_id = auth.uid());

CREATE POLICY "Users can delete their own webhooks"
  ON webhooks FOR DELETE
  USING (retailer_id = auth.uid() OR manufacturer_id = auth.uid());

-- webhook_deliveries
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deliveries for their webhooks"
  ON webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhooks
      WHERE webhooks.id = webhook_deliveries.webhook_id
      AND (webhooks.retailer_id = auth.uid() OR webhooks.manufacturer_id = auth.uid())
    )
  );
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Supabase (already should exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Base URL (for OpenAPI docs)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## MCP Server Setup

1. Navigate to the `mcp-server` directory:
```bash
cd mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Set environment variables (create `.env` file):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OR
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

4. Test the MCP server:
```bash
npm start
```

## Adding MCP Server to Claude Desktop

Edit Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add:
```json
{
  "mcpServers": {
    "nexusxo": {
      "command": "node",
      "args": ["/path/to/nexusxo/mcp-server/index.js"],
      "env": {
        "SUPABASE_URL": "your_supabase_url",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key"
      }
    }
  }
}
```

## API Usage Examples

### Create API Token (via UI)
1. Go to `/retailer/api-tokens`
2. Click "Create Token"
3. Enter name, select scopes, set expiry
4. Copy the token immediately (shown only once)

### Use API Token
```bash
# List products
curl -H "Authorization: Bearer nx_your_token_here" \
  https://your-domain.com/api/v1/products

# Get product details
curl -H "Authorization: Bearer nx_your_token_here" \
  https://your-domain.com/api/v1/products/{product-id}

# Search products
curl -H "Authorization: Bearer nx_your_token_here" \
  "https://your-domain.com/api/v1/products?search=laptop&page=1&limit=20"

# List manufacturers
curl -H "Authorization: Bearer nx_your_token_here" \
  https://your-domain.com/api/v1/manufacturers

# Get API documentation
curl https://your-domain.com/api/v1/docs
```

## Webhook Setup

Webhooks can be configured via the UI (to be implemented) or directly in the database. Events include:
- `product.created`
- `product.updated`
- `product.deleted`

Webhook payloads are signed with HMAC-SHA256 using the webhook secret.

## Testing Checklist

- [ ] Create API token via UI
- [ ] Copy token and test API calls
- [ ] Verify rate limiting works
- [ ] Check usage logs are created
- [ ] Test token revocation
- [ ] Verify expired tokens are rejected
- [ ] Test MCP server with Claude Desktop
- [ ] Verify webhooks deliver successfully
- [ ] Test error handling for invalid tokens
- [ ] Confirm RLS policies work correctly

## Next Steps

1. Create database tables using the SQL scripts above
2. Set up RLS policies
3. Configure environment variables
4. Test API endpoints
5. Set up MCP server for AI integration
6. Implement webhook management UI (optional)
7. Add webhook triggers to product create/update/delete operations
