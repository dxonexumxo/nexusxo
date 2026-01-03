import Link from 'next/link'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'

export default function TroubleshootingPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Troubleshooting</h1>
      <p>
        Common issues and solutions for developing and deploying NexusXO.
      </p>

      <h2>Environment & Setup Issues</h2>

      <h3>"Missing Supabase environment variables"</h3>
      <p>
        <strong>Problem:</strong> Application fails to start, shows error about missing environment
        variables.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Verify <code>.env.local</code> exists in the <code>frontend</code> directory</li>
        <li>Check all required variables are present:
          <CodeBlock
            language="env"
            code={`NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL`}
          />
        </li>
        <li>Restart the development server after adding/changing environment variables</li>
        <li>Verify values are correct (no extra spaces, quotes, etc.)</li>
      </ol>

      <h3>"406 Not Acceptable" errors</h3>
      <p>
        <strong>Problem:</strong> Database queries return 406 errors with PGRST116 code.
      </p>
      <p>
        <strong>Solution:</strong> Use <code>.maybeSingle()</code> instead of <code>.single()</code>{' '}
        when records may not exist:
      </p>
      <CodeBlock
        language="typescript"
        code={`// ❌ Wrong - throws 406 if no record found
const { data } = await supabase
  .from('manufacturers')
  .select('id')
  .eq('id', userId)
  .single()

// ✅ Correct - returns null if no record found
const { data } = await supabase
  .from('manufacturers')
  .select('id')
  .eq('id', userId)
  .maybeSingle()`}
      />

      <h3>Module not found errors</h3>
      <p>
        <strong>Problem:</strong> "Cannot find module" errors when running the application.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Delete <code>node_modules</code> and <code>package-lock.json</code></li>
        <li>Run <code>npm install</code> again</li>
        <li>If using TypeScript, check import paths are correct</li>
        <li>Verify the package is listed in <code>package.json</code></li>
      </ol>

      <h2>Authentication Issues</h2>

      <h3>"401 Unauthorized" on API calls</h3>
      <p>
        <strong>Problem:</strong> API calls return 401 Unauthorized errors.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Verify the token is correctly formatted (starts with <code>nx_</code>)</li>
        <li>Check the token is active (not revoked)</li>
        <li>Verify the token hasn't expired</li>
        <li>Ensure the token is included in the Authorization header:
          <CodeBlock
            language="http"
            code={`Authorization: Bearer nx_your_token_here`}
          />
        </li>
        <li>Check API route authentication logic handles both cookie and Bearer token auth</li>
      </ol>

      <h3>User role not determined correctly</h3>
      <p>
        <strong>Problem:</strong> User role is not detected, user gets redirected to home page.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Verify user exists in <code>manufacturers</code> or <code>retailers</code> table</li>
        <li>Check the user ID matches <code>auth.users.id</code></li>
        <li>Verify RLS policies allow reading the user's own record</li>
        <li>Check browser console for errors</li>
      </ol>

      <h2>Database Issues</h2>

      <h3>Database connection errors</h3>
      <p>
        <strong>Problem:</strong> Cannot connect to Supabase database.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Verify Supabase project is active (check dashboard)</li>
        <li>Check credentials are correct in <code>.env.local</code></li>
        <li>Verify network connectivity</li>
        <li>Check Supabase status page for service issues</li>
        <li>Ensure project hasn't been paused (free tier projects pause after inactivity)</li>
      </ol>

      <h3>RLS policy errors</h3>
      <p>
        <strong>Problem:</strong> Queries fail with permission errors.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Verify RLS is enabled on the table</li>
        <li>Check RLS policies are correctly configured</li>
        <li>Verify the authenticated user has the correct role</li>
        <li>Use Supabase Dashboard SQL Editor to test queries directly</li>
        <li>Check if service role key is needed (bypasses RLS)</li>
      </ol>

      <h3>Foreign key constraint errors</h3>
      <p>
        <strong>Problem:</strong> Cannot insert/update records due to foreign key constraints.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Verify referenced records exist</li>
        <li>Check foreign key values are correct (UUIDs match)</li>
        <li>Ensure referenced records aren't deleted (check ON DELETE CASCADE behavior)</li>
        <li>Verify data types match (UUID vs TEXT, etc.)</li>
      </ol>

      <h2>File Upload Issues</h2>

      <h3>Logo upload fails</h3>
      <p>
        <strong>Problem:</strong> Cannot upload manufacturer logos.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Verify storage bucket <code>manufacturer-logos</code> exists</li>
        <li>Check bucket is set to public</li>
        <li>Verify RLS policies on storage bucket allow uploads</li>
        <li>Check file size is under 2MB</li>
        <li>Verify file type is allowed (JPEG, PNG, WebP, GIF)</li>
        <li>Check folder path matches manufacturer ID</li>
        <li>Verify service role key is used for uploads (if needed)</li>
      </ol>

      <h3>Image URLs not accessible</h3>
      <p>
        <strong>Problem:</strong> Uploaded images return 403 or 404 errors.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Verify storage bucket is public (for logos)</li>
        <li>Check RLS policies allow public read access</li>
        <li>Verify URL format is correct</li>
        <li>Check file exists in storage bucket</li>
        <li>Verify CORS policies allow access from your domain</li>
      </ol>

      <h2>API Issues</h2>

      <h3>API endpoints return 500 errors</h3>
      <p>
        <strong>Problem:</strong> API endpoints return 500 Internal Server Error.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Check server logs (terminal where <code>npm run dev</code> is running)</li>
        <li>Check Vercel function logs (if deployed)</li>
        <li>Verify database connection works</li>
        <li>Check for unhandled errors in API route code</li>
        <li>Verify all required environment variables are set</li>
        <li>Check for TypeScript/JavaScript errors</li>
      </ol>

      <h3>Rate limiting not working</h3>
      <p>
        <strong>Problem:</strong> API rate limiting doesn't seem to be enforced.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Verify <code>api_rate_limits</code> table exists</li>
        <li>Check rate limit record exists for the token</li>
        <li>Verify rate limiting logic is called in API routes</li>
        <li>Check rate limit counters are being updated</li>
        <li>Test with multiple requests to verify limits are enforced</li>
      </ol>

      <h2>Build & Deployment Issues</h2>

      <h3>Build fails on Vercel</h3>
      <p>
        <strong>Problem:</strong> Deployment fails during build step.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Check build logs in Vercel dashboard for specific errors</li>
        <li>Verify all dependencies are in <code>package.json</code></li>
        <li>Check for TypeScript errors (run <code>npm run build</code> locally)</li>
        <li>Verify Node.js version is compatible (check <code>package.json</code> engines)</li>
        <li>Check environment variables are set in Vercel</li>
        <li>Verify build command is correct</li>
      </ol>

      <h3>Environment variables not available in production</h3>
      <p>
        <strong>Problem:</strong> Application works locally but fails in production.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Verify all environment variables are set in Vercel project settings</li>
        <li>Check variable names are correct (case-sensitive)</li>
        <li>Ensure <code>NEXT_PUBLIC_</code> prefix is used for client-side variables</li>
        <li>Redeploy after adding/changing environment variables</li>
        <li>Verify values don't have extra spaces or quotes</li>
      </ol>

      <h2>Performance Issues</h2>

      <h3>Slow page loads</h3>
      <p>
        <strong>Problem:</strong> Pages load slowly.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Check database query performance in Supabase Dashboard</li>
        <li>Verify indexes exist on frequently queried columns</li>
        <li>Use Next.js Image component for images (automatic optimization)</li>
        <li>Check for N+1 query problems</li>
        <li>Use pagination for large data sets</li>
        <li>Check network tab in browser DevTools for slow requests</li>
      </ol>

      <h3>Database queries are slow</h3>
      <p>
        <strong>Problem:</strong> Database queries take a long time to execute.
      </p>
      <p>
        <strong>Solution:</strong>
      </p>
      <ol>
        <li>Check query execution plans in Supabase Dashboard</li>
        <li>Verify indexes exist and are being used</li>
        <li>Consider adding indexes on frequently filtered columns</li>
        <li>Check for missing WHERE clauses (full table scans)</li>
        <li>Verify JSONB indexes for attributes_json queries</li>
        <li>Consider query optimization or restructuring</li>
      </ol>

      <h2>Debugging Tips</h2>

      <h3>Check Browser Console</h3>
      <p>
        Always check the browser console (F12 → Console tab) for errors:
      </p>
      <ul>
        <li>JavaScript errors</li>
        <li>Network request failures</li>
        <li>React errors</li>
        <li>TypeScript errors (if visible)</li>
      </ul>

      <h3>Check Server Logs</h3>
      <p>
        Check the terminal where you're running <code>npm run dev</code>:
      </p>
      <ul>
        <li>API route errors</li>
        <li>Database query errors</li>
        <li>Server-side errors</li>
      </ul>

      <h3>Use Supabase Dashboard</h3>
      <p>
        Supabase Dashboard provides useful debugging tools:
      </p>
      <ul>
        <li>
          <strong>SQL Editor:</strong> Test queries directly
        </li>
        <li>
          <strong>Table Editor:</strong> View and edit data
        </li>
        <li>
          <strong>Logs:</strong> View API and database logs
        </li>
        <li>
          <strong>Storage:</strong> View uploaded files
        </li>
      </ul>

      <h3>Add Temporary Logging</h3>
      <p>
        Add console.log statements for debugging (remember to remove them):
      </p>
      <CodeBlock
        language="typescript"
        code={`// Debug logging
console.log('Debug:', { variable1, variable2 })

// Check API route execution
console.log('API Route:', request.url, request.method)

// Check database queries
console.log('Query result:', { data, error })`}
      />

      <Callout type="warning" title="Remove Debug Code">
        Always remove debug logging and console.log statements before committing code.
      </Callout>

      <h2>Getting Help</h2>
      <p>
        If you can't resolve an issue:
      </p>
      <ol>
        <li>Check this troubleshooting guide</li>
        <li>Search for error messages online</li>
        <li>Check Next.js and Supabase documentation</li>
        <li>Review code changes that might have introduced the issue</li>
        <li>Ask for help from the development team</li>
      </ol>

      <h2>Common Error Messages</h2>

      <h3>"Invalid API key"</h3>
      <p>
        Token is incorrect, expired, or revoked. Create a new token.
      </p>

      <h3>"Access denied to this resource"</h3>
      <p>
        RLS policy or API-level check is preventing access. Verify user has correct permissions.
      </p>

      <h3>"Product not found"</h3>
      <p>
        Product doesn't exist or user doesn't have access to it. Verify product ID and access
        permissions.
      </p>

      <h3>"Rate limit exceeded"</h3>
      <p>
        Too many requests in the time window. Wait before retrying or increase rate limits.
      </p>

      <h2>Resources</h2>
      <ul>
        <li>
          <a href="https://nextjs.org/docs/app/building-your-application/debugging" target="_blank" rel="noopener noreferrer">
            Next.js Debugging Guide
          </a>
        </li>
        <li>
          <a href="https://supabase.com/docs/guides/database/troubleshooting" target="_blank" rel="noopener noreferrer">
            Supabase Troubleshooting Guide
          </a>
        </li>
        <li>
          <Link href="/docs/developer/setup">Setup & Installation Guide</Link>
        </li>
        <li>
          <Link href="/docs/developer/database">Database Schema Documentation</Link>
        </li>
      </ul>
    </div>
  )
}
