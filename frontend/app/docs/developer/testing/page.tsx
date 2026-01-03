import Link from 'next/link'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'

export default function TestingPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Testing</h1>
      <p>
        Guide to testing your changes, including manual testing checklists and testing best
        practices.
      </p>

      <h2>Testing Strategy</h2>
      <p>
        NexusXO uses a combination of manual testing and type checking. Before submitting changes,
        make sure to:
      </p>
      <ul>
        <li>Run TypeScript type checking</li>
        <li>Run ESLint</li>
        <li>Test functionality manually</li>
        <li>Test in different browsers</li>
        <li>Test responsive design</li>
        <li>Test dark/light mode</li>
      </ul>

      <h2>Type Checking</h2>
      <p>
        TypeScript provides static type checking. Check for type errors:
      </p>

      <CodeBlock
        language="bash"
        code={`# TypeScript will check types during build
npm run build

# Or use tsc directly (if installed globally)
tsc --noEmit`}
      />

      <Callout type="info" title="Type Safety">
        TypeScript errors will prevent builds from succeeding. Fix all type errors before
        committing.
      </Callout>

      <h2>Linting</h2>
      <p>
        Run ESLint to check code quality:
      </p>

      <CodeBlock
        language="bash"
        code={`npm run lint`}
      />

      <p>
        Fix all linting errors and warnings before committing.
      </p>

      <h2>Manual Testing Checklist</h2>

      <h3>Authentication</h3>
      <ul>
        <li>✅ Manufacturer signup/login works</li>
        <li>✅ Retailer signup/login works</li>
        <li>✅ Sessions persist across page refreshes</li>
        <li>✅ Logout functionality works</li>
        <li>✅ Protected routes redirect when not authenticated</li>
        <li>✅ Role-based access control works correctly</li>
      </ul>

      <h3>Manufacturer Features</h3>
      <ul>
        <li>✅ Product upload (single/bulk) works</li>
        <li>✅ Product editing works</li>
        <li>✅ Product deletion works</li>
        <li>✅ Access request approval/denial works</li>
        <li>✅ API token creation/revocation works</li>
        <li>✅ Logo upload/removal works</li>
        <li>✅ Analytics display correctly</li>
        <li>✅ Settings save correctly</li>
      </ul>

      <h3>Retailer Features</h3>
      <ul>
        <li>✅ Product browsing works</li>
        <li>✅ Product search/filtering works</li>
        <li>✅ Access request submission works</li>
        <li>✅ Data download (CSV/JSON/Excel) works</li>
        <li>✅ Product comparison works</li>
        <li>✅ Favorites management works</li>
        <li>✅ API token creation/revocation works</li>
        <li>✅ Settings save correctly</li>
      </ul>

      <h3>API Testing</h3>
      <ul>
        <li>✅ Token authentication works</li>
        <li>✅ Product listing endpoint works</li>
        <li>✅ Product detail endpoint works</li>
        <li>✅ Manufacturer listing endpoint works</li>
        <li>✅ Rate limiting works</li>
        <li>✅ Error handling returns correct status codes</li>
        <li>✅ Response formats are correct</li>
        <li>✅ Pagination works</li>
      </ul>

      <h3>UI/UX Testing</h3>
      <ul>
        <li>✅ Dark mode works correctly</li>
        <li>✅ Light mode works correctly</li>
        <li>✅ Responsive design works on mobile</li>
        <li>✅ Responsive design works on tablet</li>
        <li>✅ Responsive design works on desktop</li>
        <li>✅ Loading states display correctly</li>
        <li>✅ Error messages display correctly</li>
        <li>✅ Success messages display correctly</li>
        <li>✅ Navigation works correctly</li>
        <li>✅ Links work correctly</li>
      </ul>

      <h2>Browser Testing</h2>
      <p>
        Test in multiple browsers to ensure compatibility:
      </p>
      <ul>
        <li>
          <strong>Chrome/Edge:</strong> Latest version
        </li>
        <li>
          <strong>Firefox:</strong> Latest version
        </li>
        <li>
          <strong>Safari:</strong> Latest version (if available)
        </li>
      </ul>

      <Callout type="info" title="Browser Support">
        Next.js supports modern browsers. For production, test in the browsers your users use most
        frequently.
      </Callout>

      <h2>API Testing Tools</h2>
      <p>
        Use these tools to test the API:
      </p>
      <ul>
        <li>
          <strong>Postman:</strong> Import the collection from{' '}
          <Link href="/docs/sdks/postman">/docs/sdks/postman</Link>
        </li>
        <li>
          <strong>curl:</strong> Command-line testing
        </li>
        <li>
          <strong>API Documentation Site:</strong> Interactive explorer at{' '}
          <Link href="/docs">/docs</Link>
        </li>
        <li>
          <strong>Browser DevTools:</strong> Network tab for debugging requests
        </li>
      </ul>

      <h3>Example API Test</h3>
      <p>
        Test the products endpoint:
      </p>

      <CodeBlock
        language="bash"
        code={`# List products
curl -X GET "http://localhost:3000/api/v1/products" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json"

# Get product details
curl -X GET "http://localhost:3000/api/v1/products/{product-id}" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json"`}
      />

      <h2>Performance Testing</h2>
      <p>
        Check performance:
      </p>
      <ul>
        <li>
          <strong>Page Load Times:</strong> Use browser DevTools Network tab
        </li>
        <li>
          <strong>Database Queries:</strong> Check Supabase Dashboard for slow queries
        </li>
        <li>
          <strong>Image Loading:</strong> Verify images load efficiently
        </li>
        <li>
          <strong>API Response Times:</strong> Check response times in API logs
        </li>
      </ul>

      <h2>Security Testing</h2>
      <p>
        Verify security:
      </p>
      <ul>
        <li>✅ No secrets exposed in client-side code</li>
        <li>✅ Authentication is required for protected routes</li>
        <li>✅ Row Level Security policies work correctly</li>
        <li>✅ API tokens are validated correctly</li>
        <li>✅ Input validation works (prevent SQL injection, XSS, etc.)</li>
        <li>✅ CORS policies are configured correctly</li>
      </ul>

      <h2>Error Handling Testing</h2>
      <p>
        Test error scenarios:
      </p>
      <ul>
        <li>✅ Invalid API tokens are rejected</li>
        <li>✅ Expired tokens are rejected</li>
        <li>✅ Missing required fields show validation errors</li>
        <li>✅ Invalid data formats show appropriate errors</li>
        <li>✅ Rate limit exceeded errors are returned</li>
        <li>✅ Network errors are handled gracefully</li>
        <li>✅ 404 errors display correctly</li>
        <li>✅ 500 errors are logged and show user-friendly messages</li>
      </ul>

      <h2>Database Testing</h2>
      <p>
        Verify database operations:
      </p>
      <ul>
        <li>✅ Data is inserted correctly</li>
        <li>✅ Data is updated correctly</li>
        <li>✅ Data is deleted correctly</li>
        <li>✅ Foreign key constraints work</li>
        <li>✅ Unique constraints work</li>
        <li>✅ RLS policies prevent unauthorized access</li>
        <li>✅ Indexes improve query performance</li>
      </ul>

      <Callout type="info" title="Database Testing">
        Use Supabase Dashboard SQL Editor to test queries directly. Verify RLS policies by testing
        queries with different user contexts.
      </Callout>

      <h2>File Upload Testing</h2>
      <p>
        Test file uploads:
      </p>
      <ul>
        <li>✅ Logo upload works (manufacturers)</li>
        <li>✅ File size validation works (max 2MB)</li>
        <li>✅ File type validation works (images only)</li>
        <li>✅ Upload progress displays correctly</li>
        <li>✅ Error messages show for invalid files</li>
        <li>✅ Uploaded files are accessible via URL</li>
      </ul>

      <h2>Before Committing</h2>
      <p>
        Before committing your changes, make sure to:
      </p>
      <ol>
        <li>Run <code>npm run lint</code> and fix all errors</li>
        <li>Run <code>npm run build</code> to check for TypeScript errors</li>
        <li>Test your changes manually</li>
        <li>Test in both light and dark modes</li>
        <li>Test on different screen sizes</li>
        <li>Check browser console for errors</li>
        <li>Verify no sensitive data is logged</li>
      </ol>

      <Callout type="warning" title="Don't Skip Testing">
        Skipping tests can lead to bugs in production. Always test your changes thoroughly before
        committing.
      </Callout>

      <h2>Testing Checklist Template</h2>
      <p>
        Use this checklist for each feature or bug fix:
      </p>

      <CodeBlock
        language="text"
        code={`Testing Checklist for: [Feature Name]

Functionality:
- [ ] Core functionality works
- [ ] Edge cases handled
- [ ] Error cases handled

UI/UX:
- [ ] Works in light mode
- [ ] Works in dark mode
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] Loading states work
- [ ] Error messages display

API (if applicable):
- [ ] Endpoint works correctly
- [ ] Authentication required
- [ ] Error handling works
- [ ] Response format correct

Database (if applicable):
- [ ] Data saved correctly
- [ ] RLS policies work
- [ ] Indexes improve performance

Security:
- [ ] No secrets exposed
- [ ] Authentication required
- [ ] Input validation works

Performance:
- [ ] Page loads quickly
- [ ] No slow queries
- [ ] Images optimized`}
      />

      <h2>Resources</h2>
      <ul>
        <li>
          <a href="https://nextjs.org/docs/testing" target="_blank" rel="noopener noreferrer">
            Next.js Testing Documentation
          </a>
        </li>
        <li>
          <a href="https://supabase.com/docs/guides/database/testing" target="_blank" rel="noopener noreferrer">
            Supabase Testing Guide
          </a>
        </li>
      </ul>
    </div>
  )
}
