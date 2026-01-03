import Link from 'next/link'
import { ArrowRightIcon, KeyIcon, RocketLaunchIcon, CodeBracketIcon } from '@heroicons/react/24/outline'

export default function DocsHomePage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to NexusXO API Documentation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Build powerful integrations with our data exchange platform
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <BuildingStorefrontIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-semibold m-0">For Manufacturers</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload, update, and manage your product catalog programmatically. Automate your data sync
            and keep retailers up to date.
          </p>
          <Link
            href="/docs/manufacturer/upload-products"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Get Started <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBagIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-semibold m-0">For Retailers</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Download product data, filter catalogs, and integrate manufacturer information into your
            systems.
          </p>
          <Link
            href="/docs/retailer/download-products"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Get Started <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-2xl font-semibold mb-6">Quick Links</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            href="/docs/authentication"
            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <KeyIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="font-semibold m-0 mb-1">Authentication</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 m-0">
                Learn how to authenticate your requests
              </p>
            </div>
          </Link>

          <Link
            href="/docs/quick-start"
            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RocketLaunchIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="font-semibold m-0 mb-1">Quick Start</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 m-0">
                Get up and running in minutes
              </p>
            </div>
          </Link>

          <Link
            href="/docs/sdks/code-examples"
            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <CodeBracketIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="font-semibold m-0 mb-1">Code Examples</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 m-0">
                See examples in multiple languages
              </p>
            </div>
          </Link>
        </div>
      </div>

      <div className="mt-12 p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">Base URL</h3>
        <code className="block p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          {typeof window !== 'undefined' ? window.location.origin : 'https://api.nexusxo.com'}/api/v1
        </code>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-0">
          All API requests should be made to this base URL.
        </p>
      </div>
    </div>
  )
}

function BuildingStorefrontIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
      />
    </svg>
  )
}

function ShoppingBagIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.263-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  )
}
