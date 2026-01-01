'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

interface RetailerAccess {
  id: string
  retailer_id: string
  company_name: string
  email: string
  industry: string | null
  access_granted: boolean
  created_at: string
}

export default function RetailerAccessSettings() {
  const router = useRouter()
  const [retailers, setRetailers] = useState<RetailerAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [revokeModalData, setRevokeModalData] = useState<{
    retailerId: string
    retailerName: string
  } | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRetailers()
  }, [])

  const fetchRetailers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/manufacturer/login')
      return
    }
    setUserId(user.id)

    const { data, error } = await supabase
      .from('retailer_data_access')
      .select(`
        id,
        retailer_id,
        access_granted,
        created_at,
        retailers!inner (
          company_name,
          email,
          industry
        )
      `)
      .eq('manufacturer_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      const formatted = data.map((item: any) => ({
        id: item.id,
        retailer_id: item.retailer_id,
        company_name: item.retailers.company_name,
        email: item.retailers.email,
        industry: item.retailers.industry,
        access_granted: item.access_granted,
        created_at: item.created_at
      }))
      setRetailers(formatted)
    }
    setLoading(false)
  }

  const openRevokeModal = (retailerId: string, retailerName: string) => {
    setRevokeModalData({ retailerId, retailerName })
    setRevokeReason('')
  }

  const confirmRevoke = async () => {
    if (!revokeModalData || !userId) return
    setSubmitting(true)

    const { retailerId, retailerName } = revokeModalData

    try {
      // 1. Update retailer_data_access to revoke
      const { error: accessError } = await supabase
        .from('retailer_data_access')
        .update({ access_granted: false })
        .eq('manufacturer_id', userId)
        .eq('retailer_id', retailerId)

      if (accessError) throw accessError

      // 2. Update access_requests to rejected
      const { error: requestError } = await supabase
        .from('access_requests')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
          response_message: revokeReason || 'Access has been revoked by the manufacturer.'
        })
        .eq('manufacturer_id', userId)
        .eq('retailer_id', retailerId)
        .eq('status', 'approved')

      // Don't throw error if no request exists
      if (requestError && requestError.code !== 'PGRST116') {
        throw requestError
      }

      // 3. Create notification for retailer
      const { data: mfgData } = await supabase
        .from('manufacturers')
        .select('company_name')
        .eq('id', userId)
        .single()

      const companyName = mfgData?.company_name || 'A manufacturer'
      const message = revokeReason
        ? `${companyName} has revoked your access. Reason: ${revokeReason}`
        : `${companyName} has revoked your access to their product catalog.`

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: retailerId,
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
        retailer_id: retailerId,
        manufacturer_id: userId,
        action: 'revoked',
        performed_by: userId,
        performed_by_type: 'manufacturer',
        reason: revokeReason || null
      })

      alert(`Access revoked for ${retailerName}. The retailer has been notified.`)
      setRevokeModalData(null)
      setRevokeReason('')
      await fetchRetailers()

    } catch (error: any) {
      console.error('Error revoking access:', error)
      alert('Error revoking access: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const grantAccess = async (retailerId: string, retailerName: string) => {
    if (!confirm(`Grant access to ${retailerName}?`)) return
    if (!userId) return

    try {
      // 1. Update or insert retailer_data_access
      const { error: accessError } = await supabase
        .from('retailer_data_access')
        .update({ access_granted: true })
        .eq('manufacturer_id', userId)
        .eq('retailer_id', retailerId)

      if (accessError) {
        // If doesn't exist, insert
        const { error: insertError } = await supabase
          .from('retailer_data_access')
          .insert({
            manufacturer_id: userId,
            retailer_id: retailerId,
            access_granted: true
          })
        if (insertError) throw insertError
      }

      // 2. Update access_requests to approved (if exists)
      const { error: requestError } = await supabase
        .from('access_requests')
        .update({
          status: 'approved',
          responded_at: new Date().toISOString()
        })
        .eq('manufacturer_id', userId)
        .eq('retailer_id', retailerId)

      // Don't throw error if no request exists
      if (requestError && requestError.code !== 'PGRST116') {
        throw requestError
      }

      // 3. Create notification
      const { data: mfgData } = await supabase
        .from('manufacturers')
        .select('company_name')
        .eq('id', userId)
        .single()

      const companyName = mfgData?.company_name || 'A manufacturer'

      await supabase.from('notifications').insert({
        user_id: retailerId,
        user_type: 'retailer',
        type: 'access_approved',
        title: 'Access Granted!',
        message: `${companyName} has granted you access to their product catalog.`,
        related_id: null,
        read: false
      })

      // 4. Log to audit
      await supabase.from('access_audit_log').insert({
        retailer_id: retailerId,
        manufacturer_id: userId,
        action: 'granted',
        performed_by: userId,
        performed_by_type: 'manufacturer'
      })

      alert(`Access granted to ${retailerName}!`)
      await fetchRetailers()

    } catch (error: any) {
      console.error('Error granting access:', error)
      alert('Error granting access: ' + error.message)
    }
  }

  const stats = {
    total: retailers.length,
    active: retailers.filter(r => r.access_granted).length,
    revoked: retailers.filter(r => !r.access_granted).length
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Retailer Access Management</h1>
        <p className="text-gray-600 mt-2">Manage which retailers can access your product catalog</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Retailers</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Active Access</div>
          <div className="text-3xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Revoked Access</div>
          <div className="text-3xl font-bold text-red-600">{stats.revoked}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : retailers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No retailers have access yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retailer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Since</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {retailers.map(retailer => (
                <tr key={retailer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{retailer.company_name}</div>
                      <div className="text-sm text-gray-500">{retailer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{retailer.industry || '-'}</td>
                  <td className="px-6 py-4">
                    {retailer.access_granted ? (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Revoked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(retailer.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex justify-end space-x-2">
                      {retailer.access_granted ? (
                        <button
                          onClick={() => openRevokeModal(retailer.retailer_id, retailer.company_name)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                        >
                          Revoke Access
                        </button>
                      ) : (
                        <button
                          onClick={() => grantAccess(retailer.retailer_id, retailer.company_name)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                        >
                          Grant Access
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Revoke Access</h2>
            <p className="text-gray-600 mb-4">
              You are about to revoke <strong>{revokeModalData.retailerName}</strong>'s access to your product catalog.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Explain why you're revoking access..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
                disabled={submitting}
              />
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                ⚠️ This will immediately remove their access to your products and they will be notified.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setRevokeModalData(null)
                  setRevokeReason('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={confirmRevoke}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              >
                {submitting ? 'Revoking...' : 'Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
