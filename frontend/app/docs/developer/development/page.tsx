import Link from 'next/link'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'

export default function DevelopmentPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Development Workflow</h1>
      <p>
        Guide to the development workflow, coding standards, and best practices for working on
        NexusXO.
      </p>

      <h2>Project Structure</h2>
      <p>
        The project follows Next.js App Router conventions. Key directories:
      </p>

      <CodeBlock
        language="text"
        code={`frontend/
├── app/                  # Next.js App Router
│   ├── (auth)/          # Public auth routes
│   ├── (dashboard)/     # Protected dashboard routes
│   ├── api/             # API routes
│   └── docs/            # Documentation site
├── components/          # Reusable React components
├── lib/                 # Utility libraries
├── utils/               # Utility functions
└── public/              # Static assets`}
      />

      <h2>Running Commands</h2>

      <h3>Development Server</h3>
      <CodeBlock
        language="bash"
        code={`npm run dev`}
      />
      <p>Starts the development server at <code>http://localhost:3000</code></p>

      <h3>Build for Production</h3>
      <CodeBlock
        language="bash"
        code={`npm run build`}
      />
      <p>Creates an optimized production build</p>

      <h3>Start Production Server</h3>
      <CodeBlock
        language="bash"
        code={`npm start`}
      />
      <p>Starts the production server (run after build)</p>

      <h3>Lint Code</h3>
      <CodeBlock
        language="bash"
        code={`npm run lint`}
      />
      <p>Runs ESLint to check code quality</p>

      <h2>Code Style</h2>
      <p>
        The project uses ESLint for code quality. Key guidelines:
      </p>
      <ul>
        <li>
          <strong>TypeScript:</strong> Use TypeScript for type safety. Avoid <code>any</code> when
          possible.
        </li>
        <li>
          <strong>Formatting:</strong> Code is automatically formatted (configure your editor to
          format on save).
        </li>
        <li>
          <strong>Naming:</strong> Use camelCase for variables/functions, PascalCase for components.
        </li>
        <li>
          <strong>Components:</strong> Use functional components with hooks. Prefer server components
          when possible.
        </li>
        <li>
          <strong>Imports:</strong> Use absolute imports with <code>@/</code> prefix for cleaner
          paths.
        </li>
      </ul>

      <h2>Git Workflow</h2>

      <h3>Branching Strategy</h3>
      <ul>
        <li>
          <strong>main</strong> - Production-ready code
        </li>
        <li>
          <strong>feature/*</strong> - New features
        </li>
        <li>
          <strong>bugfix/*</strong> - Bug fixes
        </li>
        <li>
          <strong>hotfix/*</strong> - Critical production fixes
        </li>
      </ul>

      <h3>Creating a Feature Branch</h3>
      <CodeBlock
        language="bash"
        code={`# Start from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create pull request
git push origin feature/my-feature`}
      />

      <h3>Commit Messages</h3>
      <p>Use conventional commit messages:</p>
      <ul>
        <li>
          <code>feat:</code> New feature
        </li>
        <li>
          <code>fix:</code> Bug fix
        </li>
        <li>
          <code>docs:</code> Documentation changes
        </li>
        <li>
          <code>style:</code> Code style changes (formatting, etc.)
        </li>
        <li>
          <code>refactor:</code> Code refactoring
        </li>
        <li>
          <code>test:</code> Test additions/changes
        </li>
        <li>
          <code>chore:</code> Maintenance tasks
        </li>
      </ul>

      <h2>Adding New Features</h2>

      <h3>1. Create API Routes</h3>
      <p>
        API routes go in <code>app/api/</code>. Use the route handler pattern:
      </p>

      <CodeBlock
        language="typescript"
        code={`// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Handle GET request
  return NextResponse.json({ data: 'example' })
}

export async function POST(request: NextRequest) {
  // Handle POST request
  const body = await request.json()
  return NextResponse.json({ success: true })
}`}
      />

      <h3>2. Create Pages</h3>
      <p>
        Pages go in <code>app/</code> directories. Use server components when possible:
      </p>

      <CodeBlock
        language="typescript"
        code={`// app/example/page.tsx
export default function ExamplePage() {
  return (
    <div>
      <h1>Example Page</h1>
    </div>
  )
}`}
      />

      <h3>3. Create Reusable Components</h3>
      <p>
        Reusable components go in <code>components/</code>:
      </p>

      <CodeBlock
        language="typescript"
        code={`// components/ExampleComponent.tsx
interface ExampleComponentProps {
  title: string
}

export default function ExampleComponent({ title }: ExampleComponentProps) {
  return <div>{title}</div>
}`}
      />

      <h2>Database Changes</h2>
      <p>
        When adding new tables or columns:
      </p>
      <ol>
        <li>Create SQL migration file in <code>database/</code> directory</li>
        <li>Document changes in this documentation</li>
        <li>Test migration on development database</li>
        <li>Apply to production database</li>
      </ol>

      <Callout type="warning" title="Database Migrations">
        Always test migrations on a development database first. Never run untested migrations on
        production.
      </Callout>

      <h2>Environment Variables</h2>
      <p>
        Add new environment variables to:
      </p>
      <ul>
        <li>
          <code>.env.local</code> - For local development
        </li>
        <li>
          <code>.env.example</code> - Template file (commit this, not actual values)
        </li>
        <li>
          Vercel project settings - For production deployment
        </li>
      </ul>

      <h2>Testing</h2>
      <p>
        Before submitting changes, make sure to:
      </p>
      <ul>
        <li>Test your changes locally</li>
        <li>Run the linter: <code>npm run lint</code></li>
        <li>Check for TypeScript errors</li>
        <li>Test in both light and dark modes</li>
        <li>Test on different screen sizes (responsive design)</li>
      </ul>

      <Callout type="info" title="Testing Guide">
        See the <Link href="/docs/developer/testing">Testing</Link> guide for more detailed testing
        instructions.
      </Callout>

      <h2>Debugging</h2>

      <h3>Browser Console</h3>
      <p>
        Use browser DevTools console to debug client-side issues. Check for errors and warnings.
      </p>

      <h3>Server Logs</h3>
      <p>
        Check the terminal where you ran <code>npm run dev</code> for server-side errors and logs.
      </p>

      <h3>Supabase Dashboard</h3>
      <p>
        Use Supabase Dashboard to:
      </p>
      <ul>
        <li>Check database queries and RLS policies</li>
        <li>View storage buckets and files</li>
        <li>Monitor API usage and logs</li>
        <li>Debug authentication issues</li>
      </ul>

      <h2>Best Practices</h2>

      <h3>Performance</h3>
      <ul>
        <li>Use server components when possible (default in App Router)</li>
        <li>Optimize images with Next.js Image component</li>
        <li>Use React.memo for expensive components</li>
        <li>Implement pagination for large data sets</li>
        <li>Use database indexes for frequently queried columns</li>
      </ul>

      <h3>Security</h3>
      <ul>
        <li>Never expose service role keys to the client</li>
        <li>Always validate user input</li>
        <li>Use RLS policies for database access control</li>
        <li>Hash sensitive data (like API tokens)</li>
        <li>Use HTTPS in production</li>
      </ul>

      <h3>Code Organization</h3>
      <ul>
        <li>Keep components small and focused</li>
        <li>Extract reusable logic into utility functions</li>
        <li>Use TypeScript interfaces for type safety</li>
        <li>Document complex logic with comments</li>
        <li>Follow Next.js conventions and patterns</li>
      </ul>

      <h2>Resources</h2>
      <ul>
        <li>
          <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer">
            Next.js Documentation
          </a>
        </li>
        <li>
          <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer">
            Supabase Documentation
          </a>
        </li>
        <li>
          <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
            React Documentation
          </a>
        </li>
        <li>
          <a href="https://tailwindcss.com/docs" target="_blank" rel="noopener noreferrer">
            TailwindCSS Documentation
          </a>
        </li>
      </ul>
    </div>
  )
}
