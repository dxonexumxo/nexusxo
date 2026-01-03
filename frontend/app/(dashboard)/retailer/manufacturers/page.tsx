'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ManufacturerAvatar from '@/components/ManufacturerAvatar'
import { 
  Squares2X2Icon, 
  ListBulletIcon, 
  TableCellsIcon 
} from '@heroicons/react/24/outline'

type ViewMode = 'tile' | 'list' | 'table'

interface Manufacturer {
  id: string
  company_name: string
  email: string
  industry: string | null
  logo_url: string | null
  product_count: number
  access_granted: boolean | null
  request_status: string | null
}

export default function ManufacturersPage() {
  const router = useRouter()
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('tile')
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
      .select('id, company_name, email, industry, logo_url')
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
          logo_url: mfg.logo_url,
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

  const renderStatusBadge = (manufacturer: Manufacturer) => {
    if (manufacturer.access_granted) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
          ✓ Access Granted
        </span>
      )
    } else if (manufacturer.request_status === 'pending') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
          ⏳ Request Pending
        </span>
      )
    } else if (manufacturer.request_status === 'rejected') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
          ✗ Access Revoked
        </span>
      )
    }
    return null
  }

  const renderActionButton = (manufacturer: Manufacturer) => {
    if (manufacturer.access_granted) {
      return (
        <Link href={`/retailer/products?manufacturer=${manufacturer.id}`}>
          <button className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap">
            Browse Products
          </button>
        </Link>
      )
    } else if (manufacturer.request_status === 'rejected' && !manufacturer.access_granted) {
      return (
        <button
          onClick={() => setSelectedManufacturer(manufacturer)}
          className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          Request Access Again
        </button>
      )
    } else {
      return (
        <button
          onClick={() => setSelectedManufacturer(manufacturer)}
          className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          Request Access
        </button>
      )
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manufacturer Directory</h1>
        <p className="text-gray-600 mt-2">Browse and request access to manufacturer catalogs</p>
      </div>

      {/* Search and View Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search manufacturers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1 bg-white">
          <button
            onClick={() => setViewMode('tile')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'tile'
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Tile View"
          >
            <Squares2X2Icon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="List View"
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'table'
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Table View"
          >
            <TableCellsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading manufacturers...</p>
        </div>
      ) : filteredManufacturers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No manufacturers found.</p>
        </div>
      ) : (
        <>
          {/* Tile View */}
          {viewMode === 'tile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredManufacturers.map(manufacturer => (
                <div key={manufacturer.id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Logo Section - Prominent */}
                  <div className="bg-gradient-to-br from-indigo-50 to-gray-50 p-8 flex items-center justify-center">
                    <ManufacturerAvatar 
                      logoUrl={manufacturer.logo_url} 
                      companyName={manufacturer.company_name} 
                      size="xl"
                    />
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{manufacturer.company_name}</h3>
                      {manufacturer.industry && (
                        <p className="text-sm text-gray-600">{manufacturer.industry}</p>
                      )}
                      {manufacturer.access_granted && (
                        <p className="text-sm text-gray-600 mt-2">
                          {manufacturer.product_count} products available
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      {renderStatusBadge(manufacturer)}
                      {renderActionButton(manufacturer)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {filteredManufacturers.map(manufacturer => (
                <div key={manufacturer.id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-center gap-6">
                    {/* Large Logo */}
                    <div className="flex-shrink-0">
                      <ManufacturerAvatar 
                        logoUrl={manufacturer.logo_url} 
                        companyName={manufacturer.company_name} 
                        size="lg"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{manufacturer.company_name}</h3>
                          {manufacturer.industry && (
                            <p className="text-sm text-gray-600 mb-2">{manufacturer.industry}</p>
                          )}
                          {manufacturer.access_granted && (
                            <p className="text-sm text-gray-600">
                              {manufacturer.product_count} products available
                            </p>
                          )}
                        </div>
                        {renderStatusBadge(manufacturer)}
                      </div>
                    </div>
                    
                    {/* Action */}
                    <div className="flex-shrink-0">
                      {renderActionButton(manufacturer)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Logo
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Industry
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredManufacturers.map(manufacturer => (
                      <tr key={manufacturer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ManufacturerAvatar 
                            logoUrl={manufacturer.logo_url} 
                            companyName={manufacturer.company_name} 
                            size="md"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{manufacturer.company_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{manufacturer.industry || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {manufacturer.access_granted ? manufacturer.product_count : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStatusBadge(manufacturer) || (
                            <span className="text-sm text-gray-500">No access</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {renderActionButton(manufacturer)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Request Access Modal */}
      {selectedManufacturer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <ManufacturerAvatar 
                logoUrl={selectedManufacturer.logo_url} 
                companyName={selectedManufacturer.company_name} 
                size="lg"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Request Access</h2>
                <p className="text-gray-600">
                  Request access to <strong>{selectedManufacturer.company_name}</strong>'s product catalog
                </p>
              </div>
            </div>
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