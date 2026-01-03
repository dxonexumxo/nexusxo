import Link from 'next/link'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'

export default function ArchitecturePage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Architecture</h1>
      <p>
        This document provides an overview of the NexusXO platform architecture, including the
        technology stack, system design, and key components.
      </p>

      <h2>High-Level Architecture</h2>
      <p>
        NexusXO is built as a modern full-stack web application using Next.js for both frontend and
        backend, with Supabase providing the database, authentication, and storage services.
      </p>

      <CodeBlock
        language="text"
        code={`┌─────────────────────────────────────────────────────────────┐
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
└─────────────────────────────────────────────────────────────┘`}
      />

      <h2>Technology Stack</h2>

      <h3>Frontend</h3>
      <ul>
        <li>
          <strong>Next.js 16.1.1</strong> - React framework with App Router for server and client
          components
        </li>
        <li>
          <strong>React 19.2.3</strong> - UI library with latest features
        </li>
        <li>
          <strong>TypeScript 5</strong> - Type-safe JavaScript
        </li>
        <li>
          <strong>TailwindCSS 4</strong> - Utility-first CSS framework
        </li>
        <li>
          <strong>Heroicons 2.2.0</strong> - Icon library
        </li>
        <li>
          <strong>MDX</strong> - Markdown with React components for documentation
        </li>
        <li>
          <strong>FlexSearch</strong> - Client-side search for documentation
        </li>
        <li>
          <strong>Recharts</strong> - Charts and data visualization
        </li>
      </ul>

      <h3>Backend</h3>
      <ul>
        <li>
          <strong>Supabase</strong> - Backend-as-a-Service platform
          <ul>
            <li>PostgreSQL database with Row Level Security (RLS)</li>
            <li>Supabase Auth for user authentication</li>
            <li>Supabase Storage for file uploads</li>
          </ul>
        </li>
        <li>
          <strong>Next.js API Routes</strong> - Server-side API endpoints
        </li>
        <li>
          <strong>Server Actions</strong> - Server-side data mutations
        </li>
      </ul>

      <h3>Development Tools</h3>
      <ul>
        <li>
          <strong>ESLint</strong> - Code linting
        </li>
        <li>
          <strong>TypeScript</strong> - Static type checking
        </li>
        <li>
          <strong>Git</strong> - Version control
        </li>
        <li>
          <strong>Vercel</strong> - Deployment platform
        </li>
      </ul>

      <h2>Directory Structure</h2>
      <p>The project follows Next.js App Router conventions:</p>

      <CodeBlock
        language="text"
        code={`nexusxo/
├── frontend/                    # Next.js application
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/             # Authentication routes (public)
│   │   │   ├── manufacturer/   # Manufacturer login/signup
│   │   │   └── retailer/       # Retailer login/signup
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── manufacturer/   # Manufacturer dashboard pages
│   │   │   └── retailer/       # Retailer dashboard pages
│   │   ├── api/                # API routes
│   │   │   ├── v1/             # Public REST API v1
│   │   │   ├── manufacturer/   # Manufacturer-specific APIs
│   │   │   ├── retailer/       # Retailer-specific APIs
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
└── docs/                       # Additional documentation`}
      />

      <h2>Key Components</h2>

      <h3>Authentication Flow</h3>
      <p>
        Authentication is handled by Supabase Auth. Users sign up as either manufacturers or
        retailers, and their role is determined by checking the respective database tables.
      </p>

      <ol>
        <li>User signs up via `/manufacturer/signup` or `/retailer/signup`</li>
        <li>Supabase Auth creates the user account</li>
        <li>User record is created in `manufacturers` or `retailers` table</li>
        <li>Session is stored in HTTP-only cookies</li>
        <li>Protected routes check authentication and role</li>
      </ol>

      <h3>API Authentication</h3>
      <p>
        API endpoints use Bearer token authentication. Tokens are stored hashed in the database and
        validated on each request.
      </p>

      <CodeBlock
        language="typescript"
        code={`// API route authentication example
const authResult = await validateApiToken(request)
if (!authResult.valid) {
  return NextResponse.json({ error: authResult.error }, { status: 401 })
}

// Check access based on token type
if (authResult.token!.retailer_id) {
  // Retailer token - check retailer_data_access
} else if (authResult.token!.manufacturer_id) {
  // Manufacturer token - only access own products
}`}
      />

      <h3>Data Access Control</h3>
      <p>
        Access control is implemented at multiple levels:
      </p>
      <ul>
        <li>
          <strong>Row Level Security (RLS)</strong> - Database-level policies ensure users can only
          access their own data
        </li>
        <li>
          <strong>API-Level Checks</strong> - Application logic verifies access permissions
        </li>
        <li>
          <strong>Retailer Access Requests</strong> - Retailers must request and receive approval to
          access manufacturer data
        </li>
      </ul>

      <h3>File Storage</h3>
      <p>
        Files (logos, product images) are stored in Supabase Storage with the following structure:
      </p>
      <ul>
        <li>
          <strong>manufacturer-logos</strong> - Public bucket for manufacturer logos
        </li>
        <li>
          <strong>Folder Structure</strong> - Files organized by manufacturer ID:{' '}
          <code>{`{manufacturer_id}/logo.{ext}`}</code>
        </li>
        <li>
          <strong>RLS Policies</strong> - Manufacturers can only upload to their own folder, but
          logos are publicly readable
        </li>
      </ul>

      <h2>API Design</h2>
      <p>
        The platform exposes a REST API at `/api/v1` with the following characteristics:
      </p>
      <ul>
        <li>
          <strong>RESTful Design</strong> - Standard HTTP methods and status codes
        </li>
        <li>
          <strong>JSON Responses</strong> - All responses in JSON format
        </li>
        <li>
          <strong>Bearer Token Auth</strong> - Authentication via Authorization header
        </li>
        <li>
          <strong>Rate Limiting</strong> - Per-token rate limits (60/min, 1000/hour, 10000/day)
        </li>
        <li>
          <strong>Pagination</strong> - List endpoints support pagination
        </li>
        <li>
          <strong>Error Handling</strong> - Consistent error response format
        </li>
      </ul>

      <Callout type="info" title="API Documentation">
        For detailed API documentation, see the{' '}
        <Link href="/docs">API Documentation</Link> section.
      </Callout>

      <h2>Database Design</h2>
      <p>
        The database uses PostgreSQL with the following design principles:
      </p>
      <ul>
        <li>
          <strong>Normalized Schema</strong> - Proper relational design with foreign keys
        </li>
        <li>
          <strong>Row Level Security</strong> - RLS policies enforce data access at the database
          level
        </li>
        <li>
          <strong>Indexes</strong> - Strategic indexes for performance
        </li>
        <li>
          <strong>JSONB Fields</strong> - Flexible attributes stored as JSONB
        </li>
        <li>
          <strong>UUID Primary Keys</strong> - All tables use UUIDs for primary keys
        </li>
      </ul>

      <Callout type="info" title="Database Schema">
        See the <Link href="/docs/developer/database">Database Schema</Link> documentation for
        complete table definitions and relationships.
      </Callout>

      <h2>Deployment Architecture</h2>
      <p>
        The platform is designed for deployment on Vercel:
      </p>
      <ul>
        <li>
          <strong>Serverless Functions</strong> - Next.js API routes run as serverless functions
        </li>
        <li>
          <strong>Edge Network</strong> - Static assets and pages served from edge locations
        </li>
        <li>
          <strong>Environment Variables</strong> - Configuration via environment variables
        </li>
        <li>
          <strong>Automatic Scaling</strong> - Functions scale automatically with traffic
        </li>
      </ul>

      <Callout type="info" title="Deployment Guide">
        For detailed deployment instructions, see the{' '}
        <Link href="/docs/developer/deployment">Deployment</Link> guide.
      </Callout>
    </div>
  )
}
