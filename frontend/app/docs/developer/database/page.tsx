import Link from 'next/link'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import ParameterTable from '@/components/docs/ParameterTable'

export default function DatabasePage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Database Schema</h1>
      <p>
        Complete reference for the NexusXO database schema, including all tables, relationships,
        indexes, and Row Level Security policies.
      </p>

      <Callout type="info" title="Database Platform">
        NexusXO uses PostgreSQL via Supabase. All tables use UUID primary keys and include
        created_at/updated_at timestamps.
      </Callout>

      <h2>Core Tables</h2>

      <h3>manufacturers</h3>
      <p>Stores manufacturer account information.</p>

      <CodeBlock
        language="sql"
        code={`CREATE TABLE manufacturers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  logo_url TEXT,
  logo_file_name TEXT,
  logo_uploaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_manufacturers_company_name ON manufacturers(company_name);
CREATE INDEX idx_manufacturers_industry ON manufacturers(industry);
CREATE INDEX idx_manufacturers_logo_url ON manufacturers(logo_url) WHERE logo_url IS NOT NULL;`}
      />

      <ParameterTable
        parameters={[
          {
            name: 'id',
            type: 'UUID',
            required: true,
            description: 'Primary key, references auth.users(id)',
          },
          {
            name: 'company_name',
            type: 'TEXT',
            required: true,
            description: 'Manufacturer company name',
          },
          {
            name: 'logo_url',
            type: 'TEXT',
            required: false,
            description: 'URL to logo in Supabase Storage',
          },
          {
            name: 'industry',
            type: 'TEXT',
            required: false,
            description: 'Industry classification',
          },
        ]}
      />

      <h3>retailers</h3>
      <p>Stores retailer account information.</p>

      <CodeBlock
        language="sql"
        code={`CREATE TABLE retailers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_retailers_company_name ON retailers(company_name);`}
      />

      <h3>product_data</h3>
      <p>Stores product catalog information.</p>

      <CodeBlock
        language="sql"
        code={`CREATE TABLE product_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  image_urls TEXT[],
  attributes_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manufacturer_id, sku)
);

CREATE INDEX idx_product_data_manufacturer_id ON product_data(manufacturer_id);
CREATE INDEX idx_product_data_sku ON product_data(sku);
CREATE INDEX idx_product_data_category ON product_data(category);
CREATE INDEX idx_product_data_product_name ON product_data(product_name);
CREATE INDEX idx_product_data_attributes_json ON product_data USING GIN(attributes_json);`}
      />

      <ParameterTable
        parameters={[
          {
            name: 'id',
            type: 'UUID',
            required: true,
            description: 'Unique product identifier',
          },
          {
            name: 'manufacturer_id',
            type: 'UUID',
            required: true,
            description: 'Reference to manufacturer',
          },
          {
            name: 'sku',
            type: 'TEXT',
            required: true,
            description: 'Stock Keeping Unit (unique per manufacturer)',
          },
          {
            name: 'product_name',
            type: 'TEXT',
            required: true,
            description: 'Product name',
          },
          {
            name: 'price',
            type: 'DECIMAL(10, 2)',
            required: false,
            description: 'Product price',
          },
          {
            name: 'image_urls',
            type: 'TEXT[]',
            required: false,
            description: 'Array of image URLs',
          },
          {
            name: 'attributes_json',
            type: 'JSONB',
            required: false,
            description: 'Custom attributes as JSON',
          },
        ]}
      />

      <h3>retailer_data_access</h3>
      <p>Manages access control between retailers and manufacturers.</p>

      <CodeBlock
        language="sql"
        code={`CREATE TABLE retailer_data_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  manufacturer_id UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  access_requested_at TIMESTAMPTZ DEFAULT NOW(),
  access_granted BOOLEAN DEFAULT false,
  access_granted_at TIMESTAMPTZ,
  access_revoked_at TIMESTAMPTZ,
  UNIQUE(retailer_id, manufacturer_id)
);

CREATE INDEX idx_retailer_data_access_retailer_id ON retailer_data_access(retailer_id);
CREATE INDEX idx_retailer_data_access_manufacturer_id ON retailer_data_access(manufacturer_id);
CREATE INDEX idx_retailer_data_access_granted ON retailer_data_access(access_granted) 
  WHERE access_granted = true;`}
      />

      <h2>API Tables</h2>

      <h3>api_tokens</h3>
      <p>Stores API tokens for programmatic access.</p>

      <CodeBlock
        language="sql"
        code={`CREATE TABLE api_tokens (
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
CREATE INDEX idx_api_tokens_manufacturer_id ON api_tokens(manufacturer_id);`}
      />

      <Callout type="warning" title="Token Security">
        Tokens are stored as SHA-256 hashes. The plain token is only shown once during creation and
        cannot be retrieved later.
      </Callout>

      <h3>api_rate_limits</h3>
      <p>Tracks rate limiting for API tokens.</p>

      <CodeBlock
        language="sql"
        code={`CREATE TABLE api_rate_limits (
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

CREATE INDEX idx_api_rate_limits_token_id ON api_rate_limits(token_id);`}
      />

      <h3>api_usage_logs</h3>
      <p>Logs API usage for analytics and debugging.</p>

      <CodeBlock
        language="sql"
        code={`CREATE TABLE api_usage_logs (
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
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);`}
      />

      <h2>Webhook Tables</h2>

      <h3>webhooks</h3>
      <p>Stores webhook configurations.</p>

      <CodeBlock
        language="sql"
        code={`CREATE TABLE webhooks (
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
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);`}
      />

      <h3>webhook_deliveries</h3>
      <p>Logs webhook delivery attempts.</p>

      <CodeBlock
        language="sql"
        code={`CREATE TABLE webhook_deliveries (
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
CREATE INDEX idx_webhook_deliveries_success ON webhook_deliveries(success);`}
      />

      <h2>Row Level Security (RLS)</h2>
      <p>
        All tables have Row Level Security enabled to ensure data security. Policies enforce:
      </p>
      <ul>
        <li>Users can only access their own data</li>
        <li>Retailers can only see products from manufacturers they have access to</li>
        <li>Manufacturers can only manage their own products and settings</li>
        <li>API tokens are scoped to their owner</li>
      </ul>

      <Callout type="info" title="RLS Policies">
        See <Link href="/docs/developer/setup">Setup & Installation</Link> for detailed RLS policy
        examples, or check the <code>API_INTEGRATION_SETUP.md</code> file in the repository.
      </Callout>

      <h2>Storage Buckets</h2>

      <h3>manufacturer-logos</h3>
      <p>Public bucket for manufacturer logos.</p>
      <ul>
        <li>
          <strong>Public Access:</strong> Enabled (logos are publicly viewable)
        </li>
        <li>
          <strong>File Size Limit:</strong> 2 MB (recommended)
        </li>
        <li>
          <strong>Allowed Types:</strong> image/jpeg, image/png, image/webp, image/gif
        </li>
        <li>
          <strong>Folder Structure:</strong> <code>{`{manufacturer_id}/logo.{ext}`}</code>
        </li>
      </ul>

      <Callout type="info" title="Storage Setup">
        See <code>STORAGE_SETUP.md</code> in the repository for detailed storage setup instructions.
      </Callout>

      <h2>Relationships</h2>
      <p>Key relationships between tables:</p>
      <ul>
        <li>
          <code>manufacturers.id</code> → <code>auth.users.id</code> (one-to-one)
        </li>
        <li>
          <code>retailers.id</code> → <code>auth.users.id</code> (one-to-one)
        </li>
        <li>
          <code>product_data.manufacturer_id</code> → <code>manufacturers.id</code> (many-to-one)
        </li>
        <li>
          <code>retailer_data_access.retailer_id</code> → <code>retailers.id</code> (many-to-one)
        </li>
        <li>
          <code>retailer_data_access.manufacturer_id</code> → <code>manufacturers.id</code>{' '}
          (many-to-one)
        </li>
        <li>
          <code>api_tokens.retailer_id</code> → <code>retailers.id</code> (many-to-one, optional)
        </li>
        <li>
          <code>api_tokens.manufacturer_id</code> → <code>manufacturers.id</code> (many-to-one,
          optional)
        </li>
      </ul>

      <h2>Database Backups</h2>
      <p>
        Regular database backups are recommended. Use <code>pg_dump</code> to create backups:
      </p>

      <CodeBlock
        language="bash"
        code={`pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \\
  --no-owner \\
  --no-privileges \\
  > backup_$(date +%Y%m%d).sql`}
      />

      <Callout type="info" title="Backup Guide">
        See <code>SUPABASE_DUMP_GUIDE.md</code> in the repository for comprehensive backup
        instructions.
      </Callout>
    </div>
  )
}
