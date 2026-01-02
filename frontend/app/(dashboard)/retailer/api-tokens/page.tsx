'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'

interface ApiToken {
  id: string
  token_name: string
  token_prefix: string
  scopes: string[]
  created_at: string
  expires_at: string | null
  last_used_at: string | null
  is_active: boolean
  usage_count?: number
}

interface UsageStats {
  total_requests: number
  requests_today: number
  requests_this_week: number
  requests_this_month: number
  average_response_time: number
}

export default function ApiTokensPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newToken, setNewToken] = useState<{ token: string; name: string } | null>(null)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form state
  const [tokenName, setTokenName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read:products'])
  const [expiresIn, setExpiresIn] = useState<string>('never') // 'never', '30', '90', '365', 'custom'
  const [customExpiryDate, setCustomExpiryDate] = useState('')

  const availableScopes = [
    { value: 'read:products', label: 'Read Products', description: 'View product catalogs' },
    { value: 'search:products', label: 'Search Products', description: 'Search product catalog' },
    { value: 'read:manufacturers', label: 'Read Manufacturers', description: 'View manufacturer information' }
  ]

  useEffect(() => {
    fetchTokens()
  }, [])

  const fetchTokens = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/retailer/login')
        return
      }
      setUserId(user.id)

      // Get session to pass access token
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      // Fetch tokens via API
      const response = await fetch('/api/retailer/api-tokens', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        }
      })
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/retailer/login')
          return
        }
        const errorData = await response.json()
        setMessage({ type: 'error', text: 'Failed to load API tokens: ' + (errorData.error || 'Unknown error') })
        setLoading(false)
        return
      }

      const { data: tokensData } = await response.json()

      // Fetch usage counts for each token
      const tokensWithUsage = await Promise.all(
        (tokensData || []).map(async (token) => {
          const { count } = await supabase
            .from('api_usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('token_id', token.id)

          return {
            ...token,
            usage_count: count || 0
          }
        })
      )

      setTokens(tokensWithUsage)

      // Fetch usage stats via API
      const statsResponse = await fetch('/api/retailer/api-tokens/stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.data?.overall) {
          setUsageStats({
            total_requests: statsData.data.overall.total_requests || 0,
            requests_today: statsData.data.overall.requests_last_day || 0,
            requests_this_week: statsData.data.overall.requests_last_week || 0,
            requests_this_month: statsData.data.overall.requests_last_week || 0, // API provides last_week, use as month approximation
            average_response_time: statsData.data.overall.avg_response_time_ms || 0
          })
        }
      } else {
        // Fallback to default stats
        setUsageStats({
          total_requests: 0,
          requests_today: 0,
          requests_this_week: 0,
          requests_this_month: 0,
          average_response_time: 0
        })
      }

      setLoading(false)
    } catch (err: any) {
      console.error('Error:', err)
      setMessage({ type: 'error', text: 'Failed to load data: ' + (err.message || 'Unknown error') })
      setLoading(false)
    }
  }

  const handleCreateToken = async () => {
    if (!tokenName.trim()) {
      setMessage({ type: 'error', text: 'Token name is required' })
      return
    }

    if (selectedScopes.length === 0) {
      setMessage({ type: 'error', text: 'At least one scope must be selected' })
      return
    }

    setCreating(true)
    setMessage(null)

    try {
      if (!userId) {
        setMessage({ type: 'error', text: 'Not authenticated' })
        setCreating(false)
        return
      }

      // Calculate expiry date
      let expiresAt: string | null = null
      if (expiresIn !== 'never') {
        if (expiresIn === 'custom') {
          expiresAt = new Date(customExpiryDate).toISOString()
        } else {
          const days = parseInt(expiresIn)
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + days)
          expiresAt = expiryDate.toISOString()
        }
      }

      // Get session to pass access token
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const response = await fetch('/api/retailer/api-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          token_name: tokenName,
          scopes: selectedScopes,
          expires_at: expiresAt
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        setMessage({ type: 'error', text: 'Failed to create token: ' + (errorData.error || 'Unknown error') })
        setCreating(false)
        return
      }

      const data = await response.json()

      // Show the token to the user (only time they'll see it)
      setNewToken({ token: data.token, name: tokenName })
      setShowCreateModal(false)

      // Reset form
      setTokenName('')
      setSelectedScopes(['read:products'])
      setExpiresIn('never')
      setCustomExpiryDate('')

      // Refresh token list
      await fetchTokens()
    } catch (err: any) {
      console.error('Error:', err)
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setCreating(false)
    }
  }

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this token? It will stop working immediately.')) {
      return
    }

    try {
      // Get session to pass access token
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const response = await fetch('/api/retailer/api-tokens', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({ id: tokenId, is_active: false })
      })

      if (!response.ok) {
        const errorData = await response.json()
        setMessage({ type: 'error', text: 'Failed to revoke token: ' + (errorData.error || 'Unknown error') })
        return
      }

      setMessage({ type: 'success', text: 'Token revoked successfully' })
      setTimeout(() => setMessage(null), 3000)
      await fetchTokens()
    } catch (err: any) {
      console.error('Error:', err)
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    }
  }

  const handleDeleteToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this token? This action cannot be undone.')) {
      return
    }

    try {
      // Get session to pass access token
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const response = await fetch(`/api/retailer/api-tokens?id=${tokenId}`, {
        method: 'DELETE',
        headers: {
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setMessage({ type: 'error', text: 'Failed to delete token: ' + (errorData.error || 'Unknown error') })
        return
      }

      setMessage({ type: 'success', text: 'Token deleted successfully' })
      setTimeout(() => setMessage(null), 3000)
      await fetchTokens()
    } catch (err: any) {
      console.error('Error:', err)
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setMessage({ type: 'success', text: 'Copied to clipboard!' })
      setTimeout(() => setMessage(null), 2000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to copy to clipboard' })
    }
  }

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter(s => s !== scope))
    } else {
      setSelectedScopes([...selectedScopes, scope])
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading API tokens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <span>🔑</span>
            <span>API Tokens</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Manage API tokens to access NexusXO programmatically
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          + Create Token
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-4">×</button>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {usageStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Requests</div>
            <div className="text-2xl font-bold text-gray-900">{usageStats.total_requests.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Today</div>
            <div className="text-2xl font-bold text-gray-900">{usageStats.requests_today.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">This Week</div>
            <div className="text-2xl font-bold text-gray-900">{usageStats.requests_this_week.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">This Month</div>
            <div className="text-2xl font-bold text-gray-900">{usageStats.requests_this_month.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Avg Response Time</div>
            <div className="text-2xl font-bold text-gray-900">{usageStats.average_response_time}ms</div>
          </div>
        </div>
      )}

      {/* Tokens Table */}
      {tokens.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🔑</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No API Tokens
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first API token to start integrating with NexusXO
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create Token
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scopes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tokens.map((token) => (
                <tr key={token.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{token.token_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">{token.token_prefix}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {token.scopes.map((scope) => (
                        <span key={scope} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {scope}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(token.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {token.last_used_at ? new Date(token.last_used_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {token.usage_count || 0} requests
                  </td>
                  <td className="px-6 py-4">
                    {token.expires_at && new Date(token.expires_at) < new Date() ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Expired</span>
                    ) : token.is_active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Revoked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex justify-end space-x-2">
                      {token.is_active && (
                        <button
                          onClick={() => handleRevokeToken(token.id)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Revoke"
                        >
                          Revoke
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteToken(token.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Token Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create API Token</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token Name *
                </label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Production API, Development Token"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scopes *
                </label>
                <div className="space-y-2">
                  {availableScopes.map((scope) => (
                    <label key={scope.value} className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope.value)}
                        onChange={() => toggleScope(scope.value)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{scope.label}</div>
                        <div className="text-sm text-gray-600">{scope.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="never">Never</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                  <option value="custom">Custom date</option>
                </select>
              </div>

              {expiresIn === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Important:</strong> You will only be able to view the token once. Make sure to copy it and store it securely.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setTokenName('')
                  setSelectedScopes(['products:read'])
                  setExpiresIn('never')
                  setCustomExpiryDate('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateToken}
                disabled={creating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Token'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Token Display Modal */}
      {newToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Token Created Successfully</h2>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-semibold">
                ⚠️ Copy this token now! You won't be able to see it again.
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>
              <div className="text-gray-900 font-medium">{newToken.name}</div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md font-mono text-sm break-all">
                  {newToken.token}
                </code>
                <button
                  onClick={() => copyToClipboard(newToken.token)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Usage example:</strong>
              </p>
              <code className="block mt-2 text-xs text-blue-900 font-mono">
                curl -H "Authorization: Bearer {newToken.token}" {typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/products
              </code>
            </div>
            <button
              onClick={() => {
                setNewToken(null)
                setMessage({ type: 'success', text: 'Token created successfully' })
              }}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              I've copied the token
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
