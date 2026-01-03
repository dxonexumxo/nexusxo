import Link from 'next/link'
import {
  ArrowRightIcon,
  ServerStackIcon,
  CircleStackIcon,
  WrenchScrewdriverIcon,
  RocketLaunchIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'

export default function DeveloperOverviewPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Developer Documentation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Complete technical documentation for developing, deploying, and maintaining NexusXO
        </p>
      </div>

      <Callout type="info" title="For API Users">
        If you're looking to integrate with our API, check out the{' '}
        <Link href="/docs">API Documentation</Link> instead. This developer guide is for those
        working on the platform itself.
      </Callout>

      <h2>What's in This Guide</h2>
      <p>
        This comprehensive developer documentation covers everything you need to understand,
        develop, deploy, and maintain the NexusXO platform:
      </p>

      <div className="grid md:grid-cols-2 gap-6 my-8">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <ServerStackIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-semibold m-0">Architecture</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Understand the system architecture, technology stack, and how components interact.
          </p>
          <Link
            href="/docs/developer/architecture"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Learn More <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <CircleStackIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-semibold m-0">Database Schema</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Complete database schema reference with tables, relationships, and indexes.
          </p>
          <Link
            href="/docs/developer/database"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Learn More <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <WrenchScrewdriverIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-semibold m-0">Setup & Installation</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Step-by-step guide to set up your development environment from scratch.
          </p>
          <Link
            href="/docs/developer/setup"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Learn More <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <RocketLaunchIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-semibold m-0">Deployment</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Learn how to deploy the platform to production environments.
          </p>
          <Link
            href="/docs/developer/deployment"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Learn More <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <h2>Quick Start</h2>
      <p>Get started developing with NexusXO in minutes:</p>

      <CodeBlock
        language="bash"
        code={`# Clone the repository
git clone <repository-url>
cd NexusXO/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev`}
      />

      <Callout type="warning" title="Prerequisites">
        Before you begin, make sure you have:
        <ul>
          <li>Node.js 20.x or higher installed</li>
          <li>A Supabase account and project</li>
          <li>Git for version control</li>
        </ul>
        See the <Link href="/docs/developer/setup">Setup & Installation</Link> guide for detailed
        instructions.
      </Callout>

      <h2>Technology Stack</h2>
      <p>NexusXO is built with modern web technologies:</p>

      <div className="grid md:grid-cols-3 gap-4 my-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-semibold mb-2">Frontend</h4>
          <ul className="text-sm space-y-1">
            <li>Next.js 16 (App Router)</li>
            <li>React 19</li>
            <li>TypeScript</li>
            <li>TailwindCSS</li>
          </ul>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-semibold mb-2">Backend</h4>
          <ul className="text-sm space-y-1">
            <li>Supabase (PostgreSQL)</li>
            <li>Next.js API Routes</li>
            <li>Row Level Security</li>
            <li>Supabase Storage</li>
          </ul>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-semibold mb-2">Tools</h4>
          <ul className="text-sm space-y-1">
            <li>ESLint</li>
            <li>Git</li>
            <li>Vercel (Deployment)</li>
            <li>MDX (Documentation)</li>
          </ul>
        </div>
      </div>

      <h2>Getting Help</h2>
      <p>
        If you run into issues or have questions, check these resources:
      </p>
      <ul>
        <li>
          <Link href="/docs/developer/troubleshooting">Troubleshooting Guide</Link> - Common issues
          and solutions
        </li>
        <li>
          <Link href="/docs/developer/testing">Testing Guide</Link> - How to test your changes
        </li>
        <li>
          <Link href="/docs">API Documentation</Link> - For API integration questions
        </li>
      </ul>

      <div className="mt-12 p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">Next Steps</h3>
        <p className="mb-4">
          Ready to start developing? Follow these steps:
        </p>
        <ol>
          <li>Read the <Link href="/docs/developer/architecture">Architecture</Link> overview</li>
          <li>Follow the <Link href="/docs/developer/setup">Setup & Installation</Link> guide</li>
          <li>Review the <Link href="/docs/developer/database">Database Schema</Link></li>
          <li>Explore the <Link href="/docs/developer/development">Development Workflow</Link></li>
        </ol>
      </div>
    </div>
  )
}
