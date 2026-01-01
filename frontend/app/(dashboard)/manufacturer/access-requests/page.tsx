'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

interface AccessRequest {
  id: string
  retailer_id: string
  retailer_name: string
  retailer_email: string
  retailer_industry: string | null
  status: string
  requested_at: string
  message: string | null
  currently_has_access: boolean
}

export default function AccessRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/manufacturer/login')
      return
    }
    setUserId(user.id)

    const { data, error } = await supabase
      .from('manufacturer_access_requests')
      .select('*')
      .eq('manufacturer_id', user.id)
      .order('requested_at', { ascending: false })

    if (data) {
      setRequests(data)
    }
    setLoading(false)
  }

  const handleApprove = async (requestId: string) => {
    // Get the request details first
    const { data: request } = await supabase
      .from('access_requests')
      .select('retailer_id, manufacturer_id')
      .eq('id', requestId)
      .single()

    if (!request) {
      alert('Request not found')
      return
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('access_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)

    if (updateError) {
      alert('Error approving request: ' + updateError.message)
      return
    }

    // Create or update retailer_data_access record
    const { data: existingAccess } = await supabase
      .from('retailer_data_access')
      .select('id')
      .eq('retailer_id', request.retailer_id)
      .eq('manufacturer_id', request.manufacturer_id)
      .single()

    if (existingAccess) {
      // Update existing record
      const { error: accessError } = await supabase
        .from('retailer_data_access')
        .update({ access_granted: true })
        .eq('id', existingAccess.id)

      if (accessError) {
        alert('Error granting access: ' + accessError.message)
        return
      }
    } else {
      // Create new record
      const { error: accessError } = await supabase
        .from('retailer_data_access')
        .insert({
          retailer_id: request.retailer_id,
          manufacturer_id: request.manufacturer_id,
          access_granted: true
        })

      if (accessError) {
        alert('Error granting access: ' + accessError.message)
        return
      }
    }

    alert('Access granted successfully!')
    fetchRequests()
  }

  const handleReject = async (requestId: string) => {
    const { error } = await supabase
      .from('access_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)

    if (error) {
      alert('Error rejecting request: ' + error.message)
    } else {
      alert('Access request rejected')
      fetchRequests()
    }
  }

  const handleRevoke = async (requestId: string) => {
    if (!confirm('Are you sure you want to revoke this retailer\'s access? They will be notified immediately.')) {
      return
    }

    if (!userId) return

    // Get the request details first
    const { data: request } = await supabase
      .from('access_requests')
      .select('retailer_id, manufacturer_id')
      .eq('id', requestId)
      .single()

    if (!request) {
      alert('Request not found')
      return
    }

    try {
      // 1. Update retailer_data_access to revoke
      const { error: accessError } = await supabase
        .from('retailer_data_access')
        .update({ access_granted: false })
        .eq('manufacturer_id', userId)
        .eq('retailer_id', request.retailer_id)

      if (accessError) throw accessError

      // 2. Update access_requests to rejected
      const { error: requestError } = await supabase
        .from('access_requests')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
          response_message: 'Access has been revoked by the manufacturer.'
        })
        .eq('id', requestId)

      if (requestError) throw requestError

      // 3. Create notification for retailer
      const { data: mfgData } = await supabase
        .from('manufacturers')
        .select('company_name')
        .eq('id', userId)
        .single()

      const companyName = mfgData?.company_name || 'A manufacturer'
      const message = `${companyName} has revoked your access to their product catalog.`

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: request.retailer_id,
          user_type: 'retailer',
          type: 'access_revoked',
          title: 'Access Revoked',
          message,
          related_id: null,
          read: false
        })

      if (notifError) throw notifError

      // 4. Log to audit table
      await supabase.from('access_audit_log').insert({
        retailer_id: request.retailer_id,
        manufacturer_id: userId,
        action: 'revoked',
        performed_by: userId,
        performed_by_type: 'manufacturer'
      })

      alert('Access revoked successfully! The retailer has been notified.')
      fetchRequests()

    } catch (error: any) {
      console.error('Error revoking access:', error)
      alert('Error revoking access: ' + error.message)
    }
  }

  const filteredRequests = requests.filter(r => r.status === activeTab)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Access Requests</h1>
        <p className="text-gray-600 mt-2">Manage retailer access to your product catalog</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {(['pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({requests.filter(r => r.status === tab).length})
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No {activeTab} requests</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retailer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.retailer_name}</div>
                      <div className="text-sm text-gray-500">{request.retailer_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {request.retailer_industry || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(request.requested_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {request.message || '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    {activeTab === 'pending' && (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                    {activeTab === 'approved' && (
                      <button
                        onClick={() => handleRevoke(request.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        title="Revoke this retailer's access"
                      >
                        🚫 Revoke Access
                      </button>
                    )}
                    {activeTab === 'rejected' && (
                      <span className="text-xs text-gray-400">No actions available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
