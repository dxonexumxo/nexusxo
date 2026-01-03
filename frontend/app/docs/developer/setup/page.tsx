import Link from 'next/link'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'

export default function SetupPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Setup & Installation</h1>
      <p>
        Step-by-step guide to set up your development environment for NexusXO from scratch.
      </p>

      <h2>Prerequisites</h2>
      <p>Before you begin, make sure you have the following installed:</p>
      <ul>
        <li>
          <strong>Node.js</strong> - Version 20.x or higher
        </li>
        <li>
          <strong>npm</strong> - Version 9.x or higher (or yarn/pnpm)
        </li>
        <li>
          <strong>Git</strong> - For version control
        </li>
        <li>
          <strong>Supabase Account</strong> - Free account at{' '}
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
            supabase.com
          </a>
        </li>
        <li>
          <strong>PostgreSQL Client Tools</strong> (optional) - For database management
        </li>
      </ul>

      <h2>Step 1: Clone Repository</h2>
      <CodeBlock
        language="bash"
        code={`git clone <repository-url>
cd NexusXO`}
      />

      <h2>Step 2: Install Dependencies</h2>
      <CodeBlock
        language="bash"
        code={`cd frontend
npm install`}
      />

      <Callout type="info" title="Package Manager">
        You can use npm, yarn, pnpm, or bun. All commands in this guide use npm.
      </Callout>

      <h2>Step 3: Set Up Supabase</h2>
      <p>Create a Supabase project and configure it:</p>

      <h3>3.1 Create Supabase Project</h3>
      <ol>
        <li>Go to <a href="https://supabase.com">supabase.com</a> and sign up/login</li>
        <li>Click "New Project"</li>
        <li>Fill in project details (name, database password, region)</li>
        <li>Wait for project to be created (takes a few minutes)</li>
      </ol>

      <h3>3.2 Get Your Credentials</h3>
      <p>Once your project is ready, get your credentials:</p>
      <ol>
        <li>Go to Settings → API</li>
        <li>Copy the following values:
          <ul>
            <li>
              <strong>Project URL</strong> - Looks like: <code>https://[project-ref].supabase.co</code>
            </li>
            <li>
              <strong>anon/public key</strong> - Your public/anonymous key
            </li>
            <li>
              <strong>service_role key</strong> - Your service role key (keep secret!)
            </li>
          </ul>
        </li>
      </ol>

      <Callout type="warning" title="Keep Secrets Safe">
        Never commit service role keys or other secrets to version control. Use environment
        variables.
      </Callout>

      <h2>Step 4: Configure Environment Variables</h2>
      <p>Create a <code>.env.local</code> file in the <code>frontend</code> directory:</p>

      <CodeBlock
        language="bash"
        code={`cd frontend
touch .env.local`}
      />

      <p>Add the following environment variables:</p>

      <CodeBlock
        language="env"
        code={`# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application URL (for API docs and webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000`}
      />

      <Callout type="warning" title="Environment Variables">
        Replace the placeholder values with your actual Supabase credentials. The{' '}
        <code>.env.local</code> file should already be in <code>.gitignore</code> to prevent
        committing secrets.
      </Callout>

      <h2>Step 5: Set Up Database</h2>
      <p>Create the necessary database tables and policies:</p>

      <h3>5.1 Create Tables</h3>
      <p>
        Run the SQL scripts to create tables. You can find the schema definitions in the{' '}
        <code>API_INTEGRATION_SETUP.md</code> file or use the SQL Editor in Supabase Dashboard.
      </p>

      <Callout type="info" title="Database Schema">
        See the <Link href="/docs/developer/database">Database Schema</Link> documentation for
        complete table definitions, or check <code>API_INTEGRATION_SETUP.md</code> in the
        repository.
      </Callout>

      <h3>5.2 Set Up Row Level Security (RLS)</h3>
      <p>
        Enable RLS on all tables and create policies. Example policies are documented in{' '}
        <code>API_INTEGRATION_SETUP.md</code>.
      </p>

      <h3>5.3 Create Storage Bucket</h3>
      <p>Set up storage for manufacturer logos:</p>
      <ol>
        <li>Go to Storage in Supabase Dashboard</li>
        <li>Click "New bucket"</li>
        <li>Name: <code>manufacturer-logos</code></li>
        <li>Public bucket: <strong>Enabled</strong></li>
        <li>File size limit: 2 MB</li>
        <li>Click "Create bucket"</li>
      </ol>

      <Callout type="info" title="Storage Setup">
        See <code>STORAGE_SETUP.md</code> in the repository for detailed storage setup instructions
        including RLS policies.
      </Callout>

      <h2>Step 6: Run Development Server</h2>
      <CodeBlock
        language="bash"
        code={`npm run dev`}
      />

      <p>Open <a href="http://localhost:3000">http://localhost:3000</a> in your browser.</p>

      <Callout type="success" title="Success!">
        If everything is set up correctly, you should see the NexusXO application. If you encounter
        errors, check the <Link href="/docs/developer/troubleshooting">Troubleshooting</Link> guide.
      </Callout>

      <h2>Step 7: Create First User</h2>
      <p>Create your first user account:</p>

      <h3>For Manufacturers</h3>
      <ol>
        <li>Navigate to <code>/manufacturer/signup</code></li>
        <li>Fill in the signup form</li>
        <li>After signup, you'll be automatically added to the <code>manufacturers</code> table</li>
      </ol>

      <h3>For Retailers</h3>
      <ol>
        <li>Navigate to <code>/retailer/signup</code></li>
        <li>Fill in the signup form</li>
        <li>After signup, you'll be automatically added to the <code>retailers</code> table</li>
      </ol>

      <Callout type="info" title="User Creation">
        The user record is created automatically when you sign up. Make sure your signup logic
        creates the corresponding record in the <code>manufacturers</code> or <code>retailers</code>{' '}
        table.
      </Callout>

      <h2>Verification Checklist</h2>
      <p>Verify your setup is working correctly:</p>
      <ul>
        <li>✅ Development server starts without errors</li>
        <li>✅ Can access the application at <code>http://localhost:3000</code></li>
        <li>✅ Can sign up as manufacturer or retailer</li>
        <li>✅ Can log in after signup</li>
        <li>✅ Database tables are created and accessible</li>
        <li>✅ Storage bucket exists and is configured</li>
        <li>✅ Environment variables are loaded correctly</li>
      </ul>

      <h2>Next Steps</h2>
      <p>Now that your development environment is set up:</p>
      <ol>
        <li>Review the <Link href="/docs/developer/architecture">Architecture</Link> documentation</li>
        <li>Explore the <Link href="/docs/developer/database">Database Schema</Link></li>
        <li>Learn about the <Link href="/docs/developer/development">Development Workflow</Link></li>
        <li>Check out the <Link href="/docs">API Documentation</Link> if you're building integrations</li>
      </ol>

      <h2>Common Issues</h2>
      <h3>Environment Variables Not Loading</h3>
      <p>
        Make sure <code>.env.local</code> is in the <code>frontend</code> directory and restart the
        development server.
      </p>

      <h3>Database Connection Errors</h3>
      <p>
        Verify your Supabase credentials are correct and your project is active. Check the Supabase
        dashboard for any service issues.
      </p>

      <h3>Module Not Found Errors</h3>
      <p>
        Make sure you've run <code>npm install</code> and all dependencies are installed correctly.
      </p>

      <Callout type="info" title="Need Help?">
        If you encounter issues not covered here, check the{' '}
        <Link href="/docs/developer/troubleshooting">Troubleshooting</Link> guide or review the
        error messages in your terminal and browser console.
      </Callout>
    </div>
  )
}
