'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Manufacturer {
  id: string
  company_name: string
  email: string
  industry: string | null
  product_count: number
  access_granted: boolean | null
  request_status: string | null
}

export default function ManufacturersPage() {
  const router = useRouter()
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchManufacturers()
  }, [])

  const fetchManufacturers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/retailer/login')
      return
    }
    setUserId(user.id)

    // Get all manufacturers
    const { data: manufacturersData, error: mfgError } = await supabase
      .from('manufacturers')
      .select('id, company_name, email, industry')
      .order('company_name')

    if (!manufacturersData) {
      setLoading(false)
      return
    }

    // Get access status for current retailer
    const { data: accessData } = await supabase
      .from('retailer_data_access')
      .select('manufacturer_id, access_granted')
      .eq('retailer_id', user.id)

    // Get pending requests for current retailer
    const { data: requestsData } = await supabase
      .from('access_requests')
      .select('manufacturer_id, status')
      .eq('retailer_id', user.id)
      .in('status', ['pending', 'rejected'])

    // Create maps for quick lookup
    const accessMap = new Map(accessData?.map(a => [a.manufacturer_id, a.access_granted]) || [])
    const requestMap = new Map(requestsData?.map(r => [r.manufacturer_id, r.status]) || [])

    // Enrich manufacturers with product counts and access status
    const enriched = await Promise.all(
      manufacturersData.map(async (mfg) => {
        const { count } = await supabase
          .from('product_data')
          .select('*', { count: 'exact', head: true })
          .eq('manufacturer_id', mfg.id)

        return {
          id: mfg.id,
          company_name: mfg.company_name,
          email: mfg.email,
          industry: mfg.industry,
          product_count: count || 0,
          access_granted: accessMap.get(mfg.id) || false,
          request_status: requestMap.get(mfg.id) || null
        }
      })
    )
    setManufacturers(enriched)
    setLoading(false)
  }

  const handleRequestAccess = async () => {
    if (!selectedManufacturer || !userId) return
    setSubmitting(true)

    try {
      // Use UPSERT to handle both new requests and re-requests
      const { error } = await supabase
        .from('access_requests')
        .upsert({
          retailer_id: userId,
          manufacturer_id: selectedManufacturer.id,
          message: requestMessage,
          status: 'pending',
          requested_at: new Date().toISOString(),
          responded_at: null,
          response_message: null
        }, {
          onConflict: 'retailer_id,manufacturer_id',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Error sending request:', error)
        alert('Error sending request: ' + error.message)
      } else {
        alert('Access request sent successfully!')
        setSelectedManufacturer(null)
        setRequestMessage('')
        await fetchManufacturers()
      }
    } catch (err: any) {
      console.error('Unexpected error:', err)
      alert('Error sending request: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredManufacturers = manufacturers.filter(m =>
    m.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manufacturer Directory</h1>
        <p className="text-gray-600 mt-2">Browse and request access to manufacturer catalogs</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search manufacturers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredManufacturers.map(manufacturer => (
            <div key={manufacturer.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{manufacturer.company_name}</h3>
                  {manufacturer.industry && (
                    <p className="text-sm text-gray-600 mt-1">{manufacturer.industry}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                {manufacturer.access_granted ? (
                  <div className="space-y-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      ✓ Access Granted
                    </span>
                    <p className="text-sm text-gray-600">
                      {manufacturer.product_count} products available
                    </p>
                    <Link href={`/retailer/products?manufacturer=${manufacturer.id}`}>
                      <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                        Browse Products
                      </button>
                    </Link>
                  </div>
                ) : manufacturer.request_status === 'pending' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                    ⏳ Request Pending
                  </span>
                ) : manufacturer.request_status === 'rejected' && !manufacturer.access_granted ? (
                  <div className="space-y-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                      ✗ Access Revoked
                    </span>
                    <p className="text-sm text-gray-600">
                      This manufacturer has revoked your access.
                    </p>
                    <button
                      onClick={() => setSelectedManufacturer(manufacturer)}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Request Access Again
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedManufacturer(manufacturer)}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Request Access
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Access Modal */}
      {selectedManufacturer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Access</h2>
            <p className="text-gray-600 mb-4">
              Request access to <strong>{selectedManufacturer.company_name}</strong>'s product catalog
            </p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Add a message (optional)..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
              rows={4}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedManufacturer(null)
                  setRequestMessage('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestAccess}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
