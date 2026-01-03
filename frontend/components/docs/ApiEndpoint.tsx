'use client'

import { useState } from 'react'
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline'

interface ApiEndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description?: string
  baseUrl?: string
}

export default function ApiEndpoint({ method, path, description, baseUrl }: ApiEndpointProps) {
  const [copied, setCopied] = useState(false)
  const fullUrl = `${baseUrl || '/api/v1'}${path}`

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const methodColors = {
    GET: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  }

  return (
    <div className="my-6">
      {description && <p className="text-gray-600 dark:text-gray-400 mb-3">{description}</p>}
      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <span
          className={`px-3 py-1 rounded text-sm font-semibold ${methodColors[method]}`}
        >
          {method}
        </span>
        <code className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100">
          {fullUrl}
        </code>
        <button
          onClick={copyToClipboard}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label="Copy URL"
        >
          {copied ? (
            <CheckIcon className="w-5 h-5 text-green-600" />
          ) : (
            <ClipboardIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>
    </div>
  )
}
