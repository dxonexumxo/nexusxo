import Link from 'next/link'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'

export default function DeploymentPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Deployment</h1>
      <p>
        Guide to deploying NexusXO to production environments, with a focus on Vercel deployment.
      </p>

      <h2>Deployment Options</h2>
      <p>
        NexusXO can be deployed to any platform that supports Next.js. The recommended platform is
        Vercel, but you can also deploy to:
      </p>
      <ul>
        <li>Vercel (Recommended)</li>
        <li>Netlify</li>
        <li>AWS (using Amplify or custom setup)</li>
        <li>Google Cloud Platform</li>
        <li>Self-hosted (Docker, etc.)</li>
      </ul>

      <h2>Vercel Deployment (Recommended)</h2>
      <p>
        Vercel is the recommended platform for deploying Next.js applications. It provides:
      </p>
      <ul>
        <li>Automatic deployments from Git</li>
        <li>Serverless function scaling</li>
        <li>Edge network for fast global delivery</li>
        <li>Built-in SSL certificates</li>
        <li>Environment variable management</li>
        <li>Preview deployments for pull requests</li>
      </ul>

      <h3>Step 1: Connect Repository</h3>
      <ol>
        <li>Go to <a href="https://vercel.com">vercel.com</a> and sign up/login</li>
        <li>Click "New Project"</li>
        <li>Import your Git repository (GitHub, GitLab, or Bitbucket)</li>
        <li>Select the repository</li>
      </ol>

      <h3>Step 2: Configure Project</h3>
      <p>Configure your project settings:</p>
      <ul>
        <li>
          <strong>Framework Preset:</strong> Next.js (auto-detected)
        </li>
        <li>
          <strong>Root Directory:</strong> <code>frontend</code>
        </li>
        <li>
          <strong>Build Command:</strong> <code>npm run build</code> (default)
        </li>
        <li>
          <strong>Output Directory:</strong> <code>.next</code> (default)
        </li>
        <li>
          <strong>Install Command:</strong> <code>npm install</code> (default)
        </li>
      </ul>

      <h3>Step 3: Environment Variables</h3>
      <p>
        Add all environment variables from your <code>.env.local</code> file:
      </p>

      <CodeBlock
        language="env"
        code={`NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com`}
      />

      <Callout type="warning" title="Environment Variables">
        Make sure to add all required environment variables. Vercel allows you to set different
        values for Production, Preview, and Development environments.
      </Callout>

      <h3>Step 4: Deploy</h3>
      <ol>
        <li>Click "Deploy"</li>
        <li>Wait for the build to complete (usually 2-5 minutes)</li>
        <li>Your application will be available at <code>https://your-project.vercel.app</code></li>
      </ol>

      <Callout type="success" title="Deployment Complete">
        Your application is now live! Vercel will automatically deploy new commits to the main
        branch.
      </Callout>

      <h2>Custom Domain</h2>
      <p>
        To use a custom domain:
      </p>
      <ol>
        <li>Go to your project settings in Vercel</li>
        <li>Navigate to "Domains"</li>
        <li>Add your domain</li>
        <li>Follow the DNS configuration instructions</li>
        <li>Wait for DNS propagation (can take up to 48 hours)</li>
        <li>SSL certificate is automatically provisioned</li>
      </ol>

      <Callout type="info" title="DNS Configuration">
        Vercel will provide specific DNS records to add. Typically, you'll add a CNAME record
        pointing to your Vercel deployment.
      </Callout>

      <h2>Environment-Specific Configuration</h2>
      <p>
        Vercel supports different environment variables for different environments:
      </p>
      <ul>
        <li>
          <strong>Production:</strong> Used for production deployments (main branch)
        </li>
        <li>
          <strong>Preview:</strong> Used for preview deployments (pull requests, other branches)
        </li>
        <li>
          <strong>Development:</strong> Used for local development (via Vercel CLI)
        </li>
      </ul>

      <h2>Database Backups</h2>
      <p>
        Set up regular database backups for production:
      </p>
      <ol>
        <li>Use Supabase's built-in backup feature (if available on your plan)</li>
        <li>Set up automated backups using <code>pg_dump</code> and a cron job</li>
        <li>Store backups in a secure location (S3, etc.)</li>
      </ol>

      <Callout type="info" title="Backup Guide">
        See <code>SUPABASE_DUMP_GUIDE.md</code> in the repository for detailed backup instructions.
      </Callout>

      <h2>Monitoring</h2>
      <p>
        Monitor your production deployment:
      </p>
      <ul>
        <li>
          <strong>Vercel Analytics:</strong> Built-in analytics for performance and usage
        </li>
        <li>
          <strong>Supabase Dashboard:</strong> Monitor database performance and usage
        </li>
        <li>
          <strong>Error Tracking:</strong> Consider integrating error tracking (Sentry, etc.)
        </li>
        <li>
          <strong>Logs:</strong> Check Vercel function logs for errors
        </li>
      </ul>

      <h2>Performance Optimization</h2>
      <p>
        Optimize your production deployment:
      </p>
      <ul>
        <li>
          <strong>Image Optimization:</strong> Use Next.js Image component for automatic optimization
        </li>
        <li>
          <strong>Database Indexes:</strong> Ensure proper indexes on frequently queried columns
        </li>
        <li>
          <strong>Caching:</strong> Use appropriate cache headers for static assets
        </li>
        <li>
          <strong>Code Splitting:</strong> Next.js automatically code-splits your application
        </li>
        <li>
          <strong>CDN:</strong> Vercel's edge network provides global CDN
        </li>
      </ul>

      <h2>Security Considerations</h2>
      <p>
        Ensure production security:
      </p>
      <ul>
        <li>
          <strong>Environment Variables:</strong> Never commit secrets. Use Vercel environment
          variables.
        </li>
        <li>
          <strong>HTTPS:</strong> Vercel automatically provides SSL certificates
        </li>
        <li>
          <strong>RLS Policies:</strong> Verify Row Level Security policies are correctly
          configured
        </li>
        <li>
          <strong>API Rate Limiting:</strong> Ensure rate limiting is configured correctly
        </li>
        <li>
          <strong>CORS:</strong> Configure CORS policies if needed
        </li>
      </ul>

      <h2>Rolling Back</h2>
      <p>
        If you need to roll back a deployment:
      </p>
      <ol>
        <li>Go to your project in Vercel</li>
        <li>Navigate to "Deployments"</li>
        <li>Find the previous deployment you want to roll back to</li>
        <li>Click the three dots menu</li>
        <li>Select "Promote to Production"</li>
      </ol>

      <h2>CI/CD</h2>
      <p>
        Vercel automatically provides CI/CD:
      </p>
      <ul>
        <li>
          <strong>Automatic Deploys:</strong> Pushes to main branch automatically deploy to
          production
        </li>
        <li>
          <strong>Preview Deploys:</strong> Pull requests automatically get preview deployments
        </li>
        <li>
          <strong>Build Status:</strong> Build status is shown in GitHub/GitLab
        </li>
      </ul>

      <h2>Troubleshooting Deployment</h2>

      <h3>Build Failures</h3>
      <p>
        If your build fails:
      </p>
      <ul>
        <li>Check build logs in Vercel dashboard</li>
        <li>Verify all environment variables are set</li>
        <li>Ensure dependencies are listed in <code>package.json</code></li>
        <li>Check for TypeScript or linting errors</li>
      </ul>

      <h3>Runtime Errors</h3>
      <p>
        If you see runtime errors:
      </p>
      <ul>
        <li>Check function logs in Vercel dashboard</li>
        <li>Verify environment variables are correctly set</li>
        <li>Check Supabase connection and credentials</li>
        <li>Review error messages in browser console</li>
      </ul>

      <Callout type="info" title="Need Help?">
        If you encounter deployment issues, check the{' '}
        <Link href="/docs/developer/troubleshooting">Troubleshooting</Link> guide or Vercel's
        documentation.
      </Callout>
    </div>
  )
}
