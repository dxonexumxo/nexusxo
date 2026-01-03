import Link from 'next/link'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'

export default function SummaryPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Executive Summary</h1>
      <p className="lead">
        A high-level overview of the NexusXO data exchange platform, its purpose, architecture, and
        key technical concepts.
      </p>

      <h2>What is NexusXO?</h2>
      <p>
        NexusXO is a B2B (Business-to-Business) data exchange platform that facilitates product
        catalog sharing between manufacturers and retailers. The platform enables manufacturers to
        upload, manage, and distribute their product catalogs, while retailers can browse, search,
        download, and integrate product data from multiple manufacturers into their systems.
      </p>

      <Callout type="info" title="Platform Purpose">
        NexusXO solves the problem of manual, inefficient product data exchange between manufacturers
        and retailers by providing a centralized, automated platform for catalog management and
        distribution.
      </Callout>

      <h2>Key Users</h2>
      <div className="grid md:grid-cols-2 gap-6 my-6">
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="mt-0 mb-3">Manufacturers</h3>
          <p className="mb-0">
            Companies that produce and supply products. They use NexusXO to:
          </p>
          <ul className="mb-0">
            <li>Upload and manage product catalogs</li>
            <li>Control which retailers can access their data</li>
            <li>Automate product data distribution</li>
            <li>Track access and usage analytics</li>
          </ul>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="mt-0 mb-3">Retailers</h3>
          <p className="mb-0">
            Companies that sell products to end customers. They use NexusXO to:
          </p>
          <ul className="mb-0">
            <li>Browse product catalogs from multiple manufacturers</li>
            <li>Download product data in various formats (CSV, JSON, Excel)</li>
            <li>Integrate product data via REST API</li>
            <li>Compare products and manage favorites</li>
          </ul>
        </div>
      </div>

      <h2>Core Functionality</h2>
      <h3>Product Management</h3>
      <ul>
        <li>
          <strong>Product Catalog:</strong> Structured product data including SKUs, names,
          descriptions, prices, categories, images, and custom attributes
        </li>
        <li>
          <strong>Bulk Operations:</strong> Upload, update, and delete products in bulk via CSV or
          JSON
        </li>
        <li>
          <strong>Image Management:</strong> Support for multiple product images per item
        </li>
        <li>
          <strong>Custom Attributes:</strong> Flexible JSONB fields for manufacturer-specific
          product data
        </li>
      </ul>

      <h3>Access Control</h3>
      <ul>
        <li>
          <strong>Request-Based Access:</strong> Retailers must request access to manufacturer
          catalogs
        </li>
        <li>
          <strong>Approval Workflow:</strong> Manufacturers approve or deny access requests
        </li>
        <li>
          <strong>Row Level Security:</strong> Database-level security policies ensure data
          isolation
        </li>
        <li>
          <strong>Role-Based Access:</strong> Different permissions for manufacturers and retailers
        </li>
      </ul>

      <h3>Data Export & Integration</h3>
      <ul>
        <li>
          <strong>Multiple Formats:</strong> Download product data as CSV, JSON, or Excel files
        </li>
        <li>
          <strong>Filtered Exports:</strong> Export specific products, attributes, or manufacturers
        </li>
        <li>
          <strong>REST API:</strong> Programmatic access for system integration
        </li>
        <li>
          <strong>Real-Time Data:</strong> Access to up-to-date product information
        </li>
      </ul>

      <h2>Technology Stack</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Layer</th>
              <th>Technology</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Frontend</strong>
              </td>
              <td>Next.js 16, React 19, TypeScript</td>
              <td>User interface and API routes</td>
            </tr>
            <tr>
              <td>
                <strong>Styling</strong>
              </td>
              <td>TailwindCSS</td>
              <td>UI design and responsive layout</td>
            </tr>
            <tr>
              <td>
                <strong>Database</strong>
              </td>
              <td>PostgreSQL (via Supabase)</td>
              <td>Data storage and querying</td>
            </tr>
            <tr>
              <td>
                <strong>Authentication</strong>
              </td>
              <td>Supabase Auth</td>
              <td>User authentication and authorization</td>
            </tr>
            <tr>
              <td>
                <strong>Storage</strong>
              </td>
              <td>Supabase Storage</td>
              <td>File storage (logos, images)</td>
            </tr>
            <tr>
              <td>
                <strong>Deployment</strong>
              </td>
              <td>Vercel</td>
              <td>Hosting and serverless functions</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>System Architecture</h2>
      <p>
        NexusXO follows a modern full-stack architecture:
      </p>

      <CodeBlock
        language="text"
        code={`┌─────────────────────────────────────────┐
│         Next.js Application          │
│  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │  API Routes  │ │
│  │   (React)    │  │  (Next.js)   │ │
│  └──────────────┘  └──────────────┘ │
└──────────────┬───────────────────────┘
               │
               │ Supabase Client
               │
┌──────────────▼───────────────────────┐
│         Supabase Backend             │
│  ┌──────────┐  ┌──────────┐  ┌────┐ │
│  │PostgreSQL│  │   Auth   │  │Stor│ │
│  │Database  │  │ Service  │  │age │ │
│  └──────────┘  └──────────┘  └────┘ │
└──────────────────────────────────────┘`}
      />

      <h3>Key Architectural Decisions</h3>
      <ul>
        <li>
          <strong>Serverless Architecture:</strong> API routes run as serverless functions,
          providing automatic scaling
        </li>
        <li>
          <strong>Database-as-a-Service:</strong> Supabase provides managed PostgreSQL with built-in
          authentication and storage
        </li>
        <li>
          <strong>Type Safety:</strong> TypeScript throughout for better code quality and
          maintainability
        </li>
        <li>
          <strong>Row Level Security:</strong> Database-level security policies for data
          protection
        </li>
        <li>
          <strong>API-First Design:</strong> REST API allows for programmatic access and future
          integrations
        </li>
      </ul>

      <h2>Database Overview</h2>
      <p>
        The system uses a relational PostgreSQL database with the following key entities:
      </p>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="mt-0 mb-2">Core Entities</h4>
          <ul className="mb-0 text-sm">
            <li>
              <code>manufacturers</code> - Manufacturer accounts
            </li>
            <li>
              <code>retailers</code> - Retailer accounts
            </li>
            <li>
              <code>product_data</code> - Product catalog
            </li>
            <li>
              <code>retailer_data_access</code> - Access control
            </li>
          </ul>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="mt-0 mb-2">API & Integration</h4>
          <ul className="mb-0 text-sm">
            <li>
              <code>api_tokens</code> - API authentication
            </li>
            <li>
              <code>api_rate_limits</code> - Rate limiting
            </li>
            <li>
              <code>api_usage_logs</code> - Usage analytics
            </li>
            <li>
              <code>webhooks</code> - Event notifications
            </li>
          </ul>
        </div>
      </div>

      <Callout type="info" title="Database Schema">
        For complete database schema details, see the{' '}
        <Link href="/docs/developer/database">Database Schema</Link> documentation.
      </Callout>

      <h2>Security Model</h2>
      <p>
        Security is implemented at multiple layers:
      </p>
      <ul>
        <li>
          <strong>Authentication:</strong> Supabase Auth handles user authentication with secure
          session management
        </li>
        <li>
          <strong>Authorization:</strong> Role-based access control (manufacturer vs retailer)
        </li>
        <li>
          <strong>Row Level Security:</strong> Database policies ensure users can only access their
          own data
        </li>
        <li>
          <strong>API Tokens:</strong> Secure token-based authentication for programmatic access
        </li>
        <li>
          <strong>Token Hashing:</strong> API tokens are stored as SHA-256 hashes, never in plain
          text
        </li>
        <li>
          <strong>Rate Limiting:</strong> API endpoints have configurable rate limits to prevent
          abuse
        </li>
      </ul>

      <h2>Key Features</h2>
      <h3>For Manufacturers</h3>
      <ul>
        <li>Product catalog management (upload, edit, delete)</li>
        <li>Bulk product operations (CSV/JSON import)</li>
        <li>Access request management (approve/deny retailers)</li>
        <li>Analytics and reporting</li>
        <li>API token management</li>
        <li>Logo and branding management</li>
      </ul>

      <h3>For Retailers</h3>
      <ul>
        <li>Browse products from multiple manufacturers</li>
        <li>Advanced search and filtering</li>
        <li>Product comparison tools</li>
        <li>Favorites management</li>
        <li>Data download in multiple formats (CSV, JSON, Excel)</li>
        <li>REST API access for integration</li>
        <li>Manufacturer directory</li>
      </ul>

      <h2>API Access</h2>
      <p>
        The platform provides a REST API for programmatic access:
      </p>
      <ul>
        <li>
          <strong>Base URL:</strong> <code>/api/v1</code>
        </li>
        <li>
          <strong>Authentication:</strong> Bearer token (API tokens)
        </li>
        <li>
          <strong>Endpoints:</strong> Products, manufacturers, and more
        </li>
        <li>
          <strong>Rate Limits:</strong> 60 requests/minute, 1000/hour, 10000/day (default)
        </li>
        <li>
          <strong>Formats:</strong> JSON requests and responses
        </li>
      </ul>

      <Callout type="info" title="API Documentation">
        Complete API documentation is available at <Link href="/docs">/docs</Link>.
      </Callout>

      <h2>Deployment</h2>
      <p>
        NexusXO is designed for deployment on Vercel:
      </p>
      <ul>
        <li>
          <strong>Platform:</strong> Vercel (serverless Next.js hosting)
        </li>
        <li>
          <strong>Database:</strong> Supabase (managed PostgreSQL)
        </li>
        <li>
          <strong>Storage:</strong> Supabase Storage (file storage)
        </li>
        <li>
          <strong>Scaling:</strong> Automatic scaling with serverless functions
        </li>
        <li>
          <strong>CDN:</strong> Global edge network for fast content delivery
        </li>
      </ul>

      <h2>Development Workflow</h2>
      <p>
        The platform follows modern development practices:
      </p>
      <ul>
        <li>
          <strong>Version Control:</strong> Git with feature branch workflow
        </li>
        <li>
          <strong>Type Safety:</strong> TypeScript for type checking
        </li>
        <li>
          <strong>Code Quality:</strong> ESLint for linting
        </li>
        <li>
          <strong>Documentation:</strong> Comprehensive inline and external documentation
        </li>
        <li>
          <strong>Testing:</strong> Manual testing with checklists and guidelines
        </li>
      </ul>

      <h2>Scalability Considerations</h2>
      <p>
        The system is designed to scale:
      </p>
      <ul>
        <li>
          <strong>Serverless Functions:</strong> Automatic scaling based on demand
        </li>
        <li>
          <strong>Database Indexes:</strong> Strategic indexes for query performance
        </li>
        <li>
          <strong>Pagination:</strong> All list endpoints support pagination
        </li>
        <li>
          <strong>CDN:</strong> Static assets served from edge locations
        </li>
        <li>
          <strong>Rate Limiting:</strong> Protects against abuse and ensures fair usage
        </li>
      </ul>

      <h2>Next Steps</h2>
      <p>
        To dive deeper into the system:
      </p>
      <ol>
        <li>
          Read the <Link href="/docs/developer/architecture">Architecture</Link> documentation for
          detailed system design
        </li>
        <li>
          Review the <Link href="/docs/developer/database">Database Schema</Link> for data model
          details
        </li>
        <li>
          Follow the <Link href="/docs/developer/setup">Setup & Installation</Link> guide to get
          started
        </li>
        <li>
          Explore the <Link href="/docs">API Documentation</Link> for integration details
        </li>
      </ol>

      <div className="mt-12 p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">Quick Facts</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Technology Stack:</strong> Next.js, React, TypeScript, Supabase
          </div>
          <div>
            <strong>Database:</strong> PostgreSQL (Supabase)
          </div>
          <div>
            <strong>Deployment:</strong> Vercel (serverless)
          </div>
          <div>
            <strong>Authentication:</strong> Supabase Auth
          </div>
          <div>
            <strong>API Style:</strong> REST API with JSON
          </div>
          <div>
            <strong>Security:</strong> RLS, Token-based auth, Rate limiting
          </div>
        </div>
      </div>
    </div>
  )
}
