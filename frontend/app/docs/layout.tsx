'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  KeyIcon,
  RocketLaunchIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import SearchModal from '@/components/docs/SearchModal'

const navigation = [
  {
    name: 'Getting Started',
    icon: RocketLaunchIcon,
    children: [
      { name: 'Introduction', href: '/docs' },
      { name: 'Authentication', href: '/docs/authentication' },
      { name: 'Quick Start', href: '/docs/quick-start' },
      { name: 'Rate Limits', href: '/docs/rate-limits' },
    ],
  },
  {
    name: 'Manufacturer API',
    icon: BuildingStorefrontIcon,
    children: [
      { name: 'Upload Products', href: '/docs/manufacturer/upload-products' },
      { name: 'Update Products', href: '/docs/manufacturer/update-products' },
      { name: 'Delete Products', href: '/docs/manufacturer/delete-products' },
      { name: 'Batch Operations', href: '/docs/manufacturer/batch-operations' },
    ],
  },
  {
    name: 'Retailer API',
    icon: ShoppingBagIcon,
    children: [
      { name: 'Download Products', href: '/docs/retailer/download-products' },
      { name: 'Filter & Query', href: '/docs/retailer/filter-query' },
      { name: 'Get Manufacturer Info', href: '/docs/retailer/manufacturer-info' },
    ],
  },
  {
    name: 'Reference',
    icon: DocumentTextIcon,
    children: [
      { name: 'Error Codes', href: '/docs/reference/error-codes' },
      { name: 'Data Schema', href: '/docs/reference/data-schema' },
      { name: 'Changelog', href: '/docs/reference/changelog' },
    ],
  },
  {
    name: 'SDKs & Tools',
    icon: CodeBracketIcon,
    children: [
      { name: 'Code Examples', href: '/docs/sdks/code-examples' },
      { name: 'Postman Collection', href: '/docs/sdks/postman' },
      { name: 'Sample Files', href: '/docs/sdks/sample-files' },
    ],
  },
  {
    name: 'Developer Guide',
    icon: BookOpenIcon,
    children: [
      { name: 'Overview', href: '/docs/developer' },
      { name: 'Executive Summary', href: '/docs/developer/summary' },
      { name: 'Architecture', href: '/docs/developer/architecture' },
      { name: 'Database Schema', href: '/docs/developer/database' },
      { name: 'Setup & Installation', href: '/docs/developer/setup' },
      { name: 'Development Workflow', href: '/docs/developer/development' },
      { name: 'Deployment', href: '/docs/developer/deployment' },
      { name: 'Testing', href: '/docs/developer/testing' },
      { name: 'Troubleshooting', href: '/docs/developer/troubleshooting' },
    ],
  },
]

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/docs" className="flex items-center gap-2">
              <BookOpenIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-lg text-gray-900 dark:text-white">NexusXO API</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigation.map((section) => {
              const Icon = section.icon
              return (
                <div key={section.name} className="mb-6">
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {section.name}
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {section.children.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {item.name}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 flex-1 max-w-2xl mx-auto">
              <button
                onClick={() => setSearchModalOpen(true)}
                className="relative flex-1 flex items-center gap-3 px-4 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                <span className="flex-1">Search documentation...</span>
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                  {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {mounted && theme === 'dark' ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </div>
  )
}
