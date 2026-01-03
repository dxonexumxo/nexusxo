# NexusXO Developer Documentation

Complete technical documentation for the NexusXO data exchange platform.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Documentation](#api-documentation)
7. [Setup & Installation](#setup--installation)
8. [Development Workflow](#development-workflow)
9. [Key Features](#key-features)
10. [Deployment](#deployment)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)

---

## System Overview

NexusXO is a B2B data exchange platform that enables:
- **Manufacturers** to upload, manage, and distribute product catalogs
- **Retailers** to browse, download, and integrate product data from multiple manufacturers
- **API Access** for programmatic integration with both manufacturer and retailer workflows

### Core Concepts

- **Manufacturers**: Companies that produce and supply products
- **Retailers**: Companies that sell products to end customers
- **Access Control**: Retailers must request and receive approval to access manufacturer data
- **Product Data**: Structured product information including SKUs, descriptions, pricing, images, and custom attributes
- **API Tokens**: Secure tokens for programmatic access to the platform

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                        │
│  (React 19, TypeScript, TailwindCSS, MDX Documentation)     │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ HTTP/REST API
                    │
┌───────────────────▼─────────────────────────────────────────┐
│              Next.js API Routes (App Router)                │
│  • Authentication (Supabase Auth)                           │
│  • Business Logic (Manufacturers, Retailers, Products)      │
│  • API Token Management                                     │
│  • Data Export/Download                                     │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ Supabase Client
                    │
┌───────────────────▼─────────────────────────────────────────┐
│                   Supabase Backend                          │
│  • PostgreSQL Database (Row Level Security)                 │
│  • Authentication Service                                   │
│  • Storage (Manufacturer Logos, Product Images)             │
│  • Real-time Subscriptions (if used)                        │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
nexusxo/
├── frontend/                    # Next.js application
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/             # Authentication routes (public)
│   │   │   ├── manufacturer/   # Manufacturer login/signup
│   │   │   └── retailer/       # Retailer login/signup
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── manufacturer/   # Manufacturer dashboard pages
│   │   │   │   ├── page.tsx    # Dashboard home
│   │   │   │   ├── products/   # Product management
│   │   │   │   ├── upload/     # Product upload
│   │   │   │   ├── analytics/  # Analytics & reports
│   │   │   │   ├── access-requests/ # Retailer access requests
│   │   │   │   ├── api-tokens/ # API token management
│   │   │   │   ├── settings/   # Profile settings
│   │   │   │   └── help/       # Help & documentation
│   │   │   └── retailer/       # Retailer dashboard pages
│   │   │       ├── page.tsx    # Dashboard home
│   │   │       ├── products/   # Product browsing
│   │   │       ├── manufacturers/ # Manufacturer directory
│   │   │       ├── downloads/  # Data download wizard
│   │   │       ├── compare/    # Product comparison
│   │   │       ├── favorites/  # Favorite products
│   │   │       ├── browse/     # Product browsing
│   │   │       ├── api-tokens/ # API token management
│   │   │       ├── settings/   # Profile settings
│   │   │       └── help/       # Help & documentation
│   │   ├── api/                # API routes
│   │   │   ├── v1/             # Public REST API v1
│   │   │   │   ├── products/   # Product endpoints
│   │   │   │   └── manufacturers/ # Manufacturer endpoints
│   │   │   ├── manufacturer/   # Manufacturer-specific APIs
│   │   │   │   ├── api-tokens/ # Token management
│   │   │   │   └── logo/       # Logo upload
│   │   │   ├── retailer/       # Retailer-specific APIs
│   │   │   │   ├── api-tokens/ # Token management
│   │   │   │   └── profile/    # Profile management
│   │   │   ├── downloads/      # Data download APIs
│   │   │   └── webhooks/       # Webhook endpoints
│   │   └── docs/               # API documentation site
│   ├── components/             # Reusable React components
│   │   ├── navigation/         # Navigation components
│   │   ├── docs/               # Documentation components
│   │   └── ...                 # Other components
│   ├── lib/                    # Utility libraries
│   │   ├── api-auth.ts         # API authentication
│   │   ├── docs-search.ts      # Documentation search
│   │   └── webhook-trigger.ts  # Webhook triggering
│   ├── utils/                  # Utility functions
│   │   ├── supabase.ts         # Supabase client
│   │   └── ...                 # Other utilities
│   └── public/                 # Static assets
├── database/                   # Database scripts
│   └── seed_price_history*.sql # Seed data scripts
└── docs/                       # Additional documentation
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.2.3
- **Styling**: TailwindCSS 4
- **Icons**: Heroicons 2.2.0
- **Documentation**: MDX (MDX JS 3.1.1)
- **Search**: FlexSearch 0.8.212
- **Charts**: Recharts 3.6.0
- **File Processing**: PapaParse (CSV), JSZip, json2csv

### Backend
- **Platform**: Supabase (PostgreSQL, Auth, Storage)
- **API**: Next.js API Routes (Server Actions)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for logos and images)

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Version Control**: Git

---

## Database Schema

### Core Tables

#### `manufacturers`
Stores manufacturer account information.

```sql
CREATE TABLE manufacturers (
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
CREATE INDEX idx_manufacturers_logo_url ON manufacturers(logo_url) WHERE logo_url IS NOT NULL;
```

**Key Fields:**
- `id`: UUID matching auth.users(id)
- `company_name`: Manufacturer's company name
- `logo_url`: URL to logo in Supabase Storage
- `industry`: Industry classification

#### `retailers`
Stores retailer account information.

```sql
CREATE TABLE retailers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_retailers_company_name ON retailers(company_name);
```

**Key Fields:**
- `id`: UUID matching auth.users(id)
- `company_name`: Retailer's company name

#### `product_data`
Stores product catalog information.

```sql
CREATE TABLE product_data (
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
CREATE INDEX idx_product_data_attributes_json ON product_data USING GIN(attributes_json);
```

**Key Fields:**
- `id`: Unique product identifier
- `manufacturer_id`: Reference to manufacturer
- `sku`: Stock Keeping Unit (unique per manufacturer)
- `product_name`: Product name
- `price`: Product price
- `image_urls`: Array of image URLs
- `attributes_json`: JSONB field for custom attributes

#### `retailer_data_access`
Manages access control between retailers and manufacturers.

```sql
CREATE TABLE retailer_data_access (
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
CREATE INDEX idx_retailer_data_access_granted ON retailer_data_access(access_granted) WHERE access_granted = true;
```

**Key Fields:**
- `retailer_id`: Retailer requesting access
- `manufacturer_id`: Manufacturer being accessed
- `access_granted`: Boolean indicating if access is granted

### API Tables

#### `api_tokens`
Stores API tokens for programmatic access.

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

**Key Fields:**
- `token_hash`: SHA-256 hash of the actual token
- `token_prefix`: Display prefix (e.g., "nx_abc123...")
- `scopes`: Array of permission scopes
- `is_active`: Whether token is currently active

#### `api_rate_limits`
Tracks rate limiting for API tokens.

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

#### `api_usage_logs`
Logs API usage for analytics and debugging.

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

### Webhook Tables

#### `webhooks`
Stores webhook configurations.

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

#### `webhook_deliveries`
Logs webhook delivery attempts.

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

### Row Level Security (RLS)

All tables have RLS enabled to ensure data security. Policies enforce:
- Users can only access their own data
- Retailers can only see products from manufacturers they have access to
- Manufacturers can only manage their own products and settings
- API tokens are scoped to their owner

See `API_INTEGRATION_SETUP.md` for detailed RLS policy examples.

### Storage Buckets

#### `manufacturer-logos`
Public bucket for manufacturer logos.

- **Public Access**: Enabled (logos are publicly viewable)
- **File Size Limit**: 2 MB (recommended)
- **Allowed Types**: image/jpeg, image/png, image/webp, image/gif
- **Folder Structure**: `{manufacturer_id}/logo.{ext}`

See `STORAGE_SETUP.md` for detailed storage setup instructions.

---

## Authentication & Authorization

### User Authentication

NexusXO uses **Supabase Auth** for user authentication:

1. **User Registration**: Users sign up via `/manufacturer/signup` or `/retailer/signup`
2. **User Login**: Users authenticate via `/manufacturer/login` or `/retailer/login`
3. **Session Management**: Sessions are managed via HTTP-only cookies
4. **Role Determination**: User role is determined by checking `manufacturers` and `retailers` tables

### API Authentication

API endpoints use **Bearer Token** authentication:

1. **Token Creation**: Users create tokens via dashboard (`/manufacturer/api-tokens` or `/retailer/api-tokens`)
2. **Token Format**: `nx_{64_hex_characters}` (e.g., `nx_abc123def456...`)
3. **Token Storage**: Tokens are hashed (SHA-256) before storage
4. **Token Usage**: Include in `Authorization: Bearer {token}` header

### Authorization Flow

```typescript
// Example: API route authentication
const authResult = await validateApiToken(request)
if (!authResult.valid) {
  return NextResponse.json({ error: authResult.error }, { status: 401 })
}

// Check access based on token type
if (authResult.token!.retailer_id) {
  // Retailer token - check retailer_data_access
} else if (authResult.token!.manufacturer_id) {
  // Manufacturer token - only access own products
}
```

### Access Control

- **Manufacturers**: Can only access/modify their own products and settings
- **Retailers**: Can only access products from manufacturers they have been granted access to
- **API Tokens**: Inherit permissions from their owner (retailer or manufacturer)

---

## API Documentation

### Base URL

```
https://your-domain.com/api/v1
```

### Authentication

All API requests require a Bearer token in the Authorization header:

```http
Authorization: Bearer nx_your_token_here
```

### Endpoints

#### Products

##### List Products
```http
GET /api/v1/products
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `manufacturer_id` (optional): Filter by manufacturer
- `category` (optional): Filter by category
- `search` (optional): Search in SKU, name, description

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "sku": "ABC-123",
      "name": "Product Name",
      "description": "Product description",
      "price": 29.99,
      "category": "Electronics",
      "stock_quantity": 100,
      "image_urls": ["https://..."],
      "attributes": {},
      "manufacturer_id": "uuid",
      "manufacturer": {
        "id": "uuid",
        "company_name": "Manufacturer Name"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  },
  "meta": {
    "response_time_ms": 45
  }
}
```

##### Get Product
```http
GET /api/v1/products/{id}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "sku": "ABC-123",
    "name": "Product Name",
    ...
  }
}
```

#### Manufacturers

##### List Manufacturers
```http
GET /api/v1/manufacturers
```

**Query Parameters:**
- `industry` (optional): Filter by industry

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "company_name": "Manufacturer Name",
      "industry": "Electronics",
      "email": "contact@manufacturer.com",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Rate Limiting

Default rate limits per token:
- **60 requests per minute**
- **1,000 requests per hour**
- **10,000 requests per day**

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1633024800
```

### Error Responses

All errors follow this format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE" // Optional
}
```

**Common Status Codes:**
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (no access to resource)
- `404`: Not Found
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

For complete API documentation, visit `/docs` on your deployment.

---

## Setup & Installation

### Prerequisites

- **Node.js**: 20.x or higher
- **npm**: 9.x or higher (or yarn/pnpm)
- **Git**: For version control
- **Supabase Account**: For database and authentication
- **PostgreSQL Client Tools** (optional): For database management

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd NexusXO
```

### Step 2: Install Dependencies

```bash
cd frontend
npm install
```

### Step 3: Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project credentials:
   - Project URL: `https://[project-ref].supabase.co`
   - Anon Key: Found in Settings → API
   - Service Role Key: Found in Settings → API (keep secret!)

### Step 4: Configure Environment Variables

Create `frontend/.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application URL (for API docs and webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Set Up Database

1. Run SQL scripts to create tables (see `API_INTEGRATION_SETUP.md` for schema)
2. Set up Row Level Security policies
3. Create storage buckets (see `STORAGE_SETUP.md`)

### Step 6: Run Development Server

```bash
cd frontend
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Step 7: Create First User

1. Navigate to `/manufacturer/signup` or `/retailer/signup`
2. Create an account
3. The user will be automatically added to the `manufacturers` or `retailers` table

---

## Development Workflow

### Project Structure

- **Feature Development**: Create feature branches from `main`
- **Code Style**: Follow ESLint rules, use TypeScript strict mode
- **Commits**: Use conventional commit messages

### Running Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Adding New Features

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Implement changes
3. Test locally
4. Commit changes: `git commit -m "feat: add new feature"`
5. Push and create pull request
6. Merge to `main` after review

### Database Migrations

When adding new tables or columns:

1. Create SQL migration file in `database/` directory
2. Document changes in this documentation
3. Test migration on development database
4. Apply to production database

---

## Key Features

### Manufacturer Features

- **Product Management**: Upload, update, delete products
- **Product Upload**: CSV/JSON bulk upload
- **Access Requests**: Approve/deny retailer access requests
- **Analytics**: View product views, downloads, access statistics
- **API Tokens**: Create and manage API tokens
- **Logo Upload**: Upload and manage company logo
- **Settings**: Manage profile and preferences

### Retailer Features

- **Product Browsing**: Browse products from multiple manufacturers
- **Product Search**: Search and filter products
- **Product Comparison**: Compare products side-by-side
- **Favorites**: Save favorite products
- **Data Download**: Download product data in CSV/JSON/Excel formats
- **Manufacturer Directory**: Browse and request access from manufacturers
- **API Tokens**: Create and manage API tokens
- **Settings**: Manage profile and preferences

### API Features

- **REST API**: Full REST API for programmatic access
- **Rate Limiting**: Configurable rate limits per token
- **Usage Logging**: Comprehensive API usage logging
- **Webhooks**: Event-driven webhooks (planned)
- **Documentation**: Interactive API documentation site

---

## Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**: Connect your Git repository to Vercel
2. **Configure Project**:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. **Environment Variables**: Add all variables from `.env.local`
4. **Deploy**: Vercel will deploy automatically on push to `main`

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Database Backups

Regular database backups are recommended. See `SUPABASE_DUMP_GUIDE.md` for instructions.

### Custom Domain

1. Add custom domain in Vercel project settings
2. Configure DNS records as instructed
3. SSL certificate is automatically provisioned

---

## Testing

### Manual Testing Checklist

#### Authentication
- [ ] Manufacturer signup/login
- [ ] Retailer signup/login
- [ ] Session persistence
- [ ] Logout functionality

#### Manufacturer Features
- [ ] Product upload (single/bulk)
- [ ] Product editing
- [ ] Product deletion
- [ ] Access request approval/denial
- [ ] API token creation/revocation
- [ ] Logo upload/removal

#### Retailer Features
- [ ] Product browsing
- [ ] Product search/filtering
- [ ] Access request submission
- [ ] Data download (CSV/JSON/Excel)
- [ ] Product comparison
- [ ] Favorites management
- [ ] API token creation/revocation

#### API
- [ ] Token authentication
- [ ] Product listing endpoint
- [ ] Product detail endpoint
- [ ] Manufacturer listing endpoint
- [ ] Rate limiting
- [ ] Error handling

### API Testing

Use tools like:
- **Postman**: Import collection from `/docs/sdks/postman`
- **curl**: Command-line testing
- **API Documentation Site**: Interactive explorer at `/docs`

---

## Troubleshooting

### Common Issues

#### "Missing Supabase environment variables"
**Solution**: Ensure `.env.local` exists with correct variables.

#### "406 Not Acceptable" errors
**Solution**: Check database queries use `.maybeSingle()` instead of `.single()` when records may not exist.

#### "401 Unauthorized" on API calls
**Solution**: 
- Verify token is correctly formatted
- Check token is active and not expired
- Ensure token is included in Authorization header

#### Logo upload fails
**Solution**: 
- Verify storage bucket exists and is public
- Check RLS policies on storage bucket
- Verify file size is under 2MB
- Check file type is allowed (JPEG, PNG, WebP, GIF)

#### Database connection issues
**Solution**:
- Verify Supabase project is active
- Check network connectivity
- Verify credentials are correct
- Check Supabase project status page

### Getting Help

1. **Check Documentation**: Review this documentation and related guides
2. **Check Logs**: Review browser console and server logs
3. **Check Database**: Verify data exists and RLS policies are correct
4. **Contact Support**: Reach out to the development team

---

## Additional Resources

- **API Documentation**: `/docs` (when running locally or deployed)
- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Database Backup Guide**: `SUPABASE_DUMP_GUIDE.md`
- **Storage Setup Guide**: `STORAGE_SETUP.md`
- **API Integration Setup**: `API_INTEGRATION_SETUP.md`

---

## Changelog

See `/docs/reference/changelog` for API version history and changes.

---

**Last Updated**: 2024-01-01
**Version**: 1.0.0
