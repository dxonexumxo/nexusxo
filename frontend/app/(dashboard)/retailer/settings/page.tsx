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

export default function RetailerSettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [retailerId, setRetailerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [industry, setIndustry] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // API Tokens state
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [tokensLoading, setTokensLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newToken, setNewToken] = useState<{ token: string; name: string } | null>(null)
  const [creating, setCreating] = useState(false)
  const [tokenMessage, setTokenMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [tokenName, setTokenName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read:products'])
  const [expiresIn, setExpiresIn] = useState<string>('never')
  const [customExpiryDate, setCustomExpiryDate] = useState('')

  const availableScopes = [
    { value: 'read:products', label: 'Read Products', description: 'View product catalogs' },
    { value: 'search:products', label: 'Search Products', description: 'Search product catalog' },
    { value: 'read:manufacturers', label: 'Read Manufacturers', description: 'View manufacturer information' }
  ]

  useEffect(() => {
    fetchRetailerData()
  }, [])

  useEffect(() => {
    if (activeTab === 'api-tokens') {
      fetchTokens()
    }
  }, [activeTab])

  const fetchRetailerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/retailer/login')
        return
      }
      setRetailerId(user.id)

      const { data, error } = await supabase
        .from('retailers')
        .select('company_name, email, industry, business_type')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching retailer data:', error)
        setLoading(false)
        return
      }

      if (data) {
        setCompanyName(data.company_name || '')
        setCompanyEmail(data.email || '')
        setIndustry(data.industry || '')
        setBusinessType(data.business_type || '')
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTokens = async () => {
    try {
      setTokensLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

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
        setTokenMessage({ type: 'error', text: 'Failed to load API tokens: ' + (errorData.error || 'Unknown error') })
        setTokensLoading(false)
        return
      }

      const { data: tokensData } = await response.json()

      const tokensWithUsage = await Promise.all(
        (tokensData || []).map(async (token: ApiToken) => {
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
      setTokensLoading(false)
    } catch (err: any) {
      console.error('Error:', err)
      setTokenMessage({ type: 'error', text: 'Failed to load data: ' + (err.message || 'Unknown error') })
      setTokensLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setSaveMessage(null)

    if (!retailerId) {
      setSaveMessage({ type: 'error', text: 'Please log in to save changes' })
      setIsSaving(false)
      return
    }

    try {
      const { error } = await supabase
        .from('retailers')
        .update({
          company_name: companyName,
          email: companyEmail,
          industry: industry || null,
          business_type: businessType || null
        })
        .eq('id', retailerId)

      if (error) {
        console.error('Error updating retailer:', error)
        setSaveMessage({ type: 'error', text: 'Failed to save changes: ' + error.message })
      } else {
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' })
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (err: any) {
      console.error('Error:', err)
      setSaveMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = () => {
    alert('Password change functionality can be implemented with Supabase auth. Contact support if you need to reset your password.')
  }

  const handleCreateToken = async () => {
    if (!tokenName.trim()) {
      setTokenMessage({ type: 'error', text: 'Token name is required' })
      return
    }

    if (selectedScopes.length === 0) {
      setTokenMessage({ type: 'error', text: 'At least one scope must be selected' })
      return
    }

    setCreating(true)
    setTokenMessage(null)

    try {
      if (!retailerId) {
        setTokenMessage({ type: 'error', text: 'Not authenticated' })
        setCreating(false)
        return
      }

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
        setTokenMessage({ type: 'error', text: 'Failed to create token: ' + (errorData.error || 'Unknown error') })
        setCreating(false)
        return
      }

      const data = await response.json()
      setNewToken({ token: data.token, name: tokenName })
      setShowCreateModal(false)
      setTokenName('')
      setSelectedScopes(['read:products'])
      setExpiresIn('never')
      setCustomExpiryDate('')
      await fetchTokens()
    } catch (err: any) {
      console.error('Error:', err)
      setTokenMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setCreating(false)
    }
  }

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this token? It will stop working immediately.')) {
      return
    }

    try {
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
        setTokenMessage({ type: 'error', text: 'Failed to revoke token: ' + (errorData.error || 'Unknown error') })
        return
      }

      setTokenMessage({ type: 'success', text: 'Token revoked successfully' })
      setTimeout(() => setTokenMessage(null), 3000)
      await fetchTokens()
    } catch (err: any) {
      console.error('Error:', err)
      setTokenMessage({ type: 'error', text: 'An unexpected error occurred' })
    }
  }

  const handleDeleteToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this token? This action cannot be undone.')) {
      return
    }

    try {
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
        setTokenMessage({ type: 'error', text: 'Failed to delete token: ' + (errorData.error || 'Unknown error') })
        return
      }

      setTokenMessage({ type: 'success', text: 'Token deleted successfully' })
      setTimeout(() => setTokenMessage(null), 3000)
      await fetchTokens()
    } catch (err: any) {
      console.error('Error:', err)
      setTokenMessage({ type: 'error', text: 'An unexpected error occurred' })
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setTokenMessage({ type: 'success', text: 'Copied to clipboard!' })
      setTimeout(() => setTokenMessage(null), 2000)
    } catch (err) {
      setTokenMessage({ type: 'error', text: 'Failed to copy to clipboard' })
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
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                activeTab === 'profile'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>👤</span>
              <span className="font-medium">Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('api-tokens')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                activeTab === 'api-tokens'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>🔑</span>
              <span className="font-medium">API Tokens</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                activeTab === 'security'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>🔒</span>
              <span className="font-medium">Security</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
                {saveMessage && (
                  <div className={`mb-6 rounded-lg p-4 ${
                    saveMessage.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {saveMessage.text}
                  </div>
                )}
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Email
                    </label>
                    <input
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. Grocery, Pharmacy"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Type
                      </label>
                      <input
                        type="text"
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. Retailer, Marketplace"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* API Tokens Tab */}
            {activeTab === 'api-tokens' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">API Tokens</h2>
                    <p className="text-gray-600">
                      Manage your API tokens for programmatic access to NexusXO
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    + Create Token
                  </button>
                </div>

                {tokenMessage && (
                  <div className={`mb-6 rounded-lg p-4 ${
                    tokenMessage.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {tokenMessage.text}
                  </div>
                )}

                {tokensLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading tokens...</p>
                  </div>
                ) : tokens.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🔑</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No API Tokens</h3>
                    <p className="text-gray-600 mb-6">Create your first API token to start integrating with NexusXO</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Create Token
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
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
                                  >
                                    Revoke
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteToken(token.id)}
                                  className="text-red-600 hover:text-red-800"
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
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Change Password
                    </label>
                    <p className="text-sm text-gray-600 mb-4">
                      To change your password, please use the password reset functionality. Contact support if you need assistance.
                    </p>
                    <button
                      onClick={handleChangePassword}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
                  setSelectedScopes(['read:products'])
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
                setTokenMessage({ type: 'success', text: 'Token created successfully' })
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
