'use client'

import { useState, useEffect } from 'react'
import { PlayIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline'

interface ApiExplorerProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  baseUrl?: string
  defaultBody?: string
}

export default function ApiExplorer({
  method,
  path,
  baseUrl = '/api/v1',
  defaultBody = '{}',
}: ApiExplorerProps) {
  const [apiKey, setApiKey] = useState('')
  const [requestBody, setRequestBody] = useState(defaultBody)
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Load API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('nexusxo_api_key')
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [])

  const saveApiKey = (key: string) => {
    setApiKey(key)
    if (key) {
      localStorage.setItem('nexusxo_api_key', key)
    } else {
      localStorage.removeItem('nexusxo_api_key')
    }
  }

  const handleSend = async () => {
    if (!apiKey) {
      alert('Please enter your API key')
      return
    }

    setLoading(true)
    setResponse(null)

    try {
      const url = `${baseUrl}${path}`
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }

      if (method !== 'GET' && requestBody) {
        try {
          JSON.parse(requestBody) // Validate JSON
          options.body = requestBody
        } catch (e) {
          setResponse(JSON.stringify({ error: 'Invalid JSON in request body' }, null, 2))
          setLoading(false)
          return
        }
      }

      const res = await fetch(url, options)
      const data = await res.json()

      setResponse(
        JSON.stringify(
          {
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries()),
            data,
          },
          null,
          2
        )
      )
    } catch (error: any) {
      setResponse(JSON.stringify({ error: error.message }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const copyAsCurl = () => {
    let curl = `curl -X ${method} "${baseUrl}${path}" \\\n`
    curl += `  -H "Authorization: Bearer ${apiKey}" \\\n`
    curl += `  -H "Content-Type: application/json"`

    if (method !== 'GET' && requestBody) {
      curl += ` \\\n  -d '${requestBody}'`
    }

    navigator.clipboard.writeText(curl)
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
    <div className="my-8 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded text-sm font-semibold ${methodColors[method]}`}>
              {method}
            </span>
            <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
              {baseUrl}
              {path}
            </code>
          </div>
          <button
            onClick={copyAsCurl}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            {copied ? (
              <>
                <CheckIcon className="w-4 h-4" /> Copied!
              </>
            ) : (
              <>
                <ClipboardIcon className="w-4 h-4" /> Copy as cURL
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => saveApiKey(e.target.value)}
            placeholder="Enter your API key"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Your API key is saved locally and never sent to our servers except in API requests.
          </p>
        </div>

        {method !== 'GET' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Request Body (JSON)
            </label>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-900 text-gray-100 font-mono text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={loading || !apiKey}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlayIcon className="w-5 h-5" />
          {loading ? 'Sending...' : 'Send Request'}
        </button>

        {response && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Response
            </label>
            <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
              <code>{response}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
