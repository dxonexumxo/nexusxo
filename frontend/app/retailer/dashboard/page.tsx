'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'
import { getFavoriteProductIds } from '@/utils/favorites'

export default function RetailerDashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessibleManufacturers, setAccessibleManufacturers] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [recentProducts, setRecentProducts] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [recentActivity, setRecentActivity] = useState<Array<{
    type: 'new_product' | 'updated_price'
    manufacturer_name: string
    product_name?: string
    date: string
  }>>([])
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserEmail(user.email || null)
          setUserId(user.id)
        } else {
          router.push('/retailer/login')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/retailer/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  useEffect(() => {
    if (userId) {
      fetchStats()
    }
  }, [userId])

  const fetchStats = async () => {
    if (!userId) return

    try {
      // Get accessible manufacturers
      const { data: accessData, error: accessError } = await supabase
        .from('retailer_data_access')
        .select('manufacturer_id')
        .eq('retailer_id', userId)
        .eq('access_granted', true)

      if (accessError) {
        console.error('Error fetching access data:', accessError)
        return
      }

      const manufacturerIds = (accessData || []).map(a => a.manufacturer_id)
      setAccessibleManufacturers(manufacturerIds.length)

      if (manufacturerIds.length === 0) {
        setTotalProducts(0)
        setRecentProducts(0)
        return
      }

      // Get total products count
      const { count: totalCount, error: totalError } = await supabase
        .from('product_data')
        .select('*', { count: 'exact', head: true })
        .in('manufacturer_id', manufacturerIds)

      if (totalError) {
        console.error('Error fetching total products:', totalError)
      } else {
        setTotalProducts(totalCount || 0)
      }

      // Get recently added products (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentCount, error: recentError } = await supabase
        .from('product_data')
        .select('*', { count: 'exact', head: true })
        .in('manufacturer_id', manufacturerIds)
        .gte('created_at', sevenDaysAgo.toISOString())

      if (recentError) {
        console.error('Error fetching recent products:', recentError)
      } else {
        setRecentProducts(recentCount || 0)
      }

      // Fetch recent activity
      await fetchRecentActivity(manufacturerIds)

      // Fetch favorite count
      await fetchFavoriteCount()
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const fetchFavoriteCount = async () => {
    if (!userId) return

    try {
      const favoriteIds = await getFavoriteProductIds(userId)
      setFavoriteCount(favoriteIds.length)
    } catch (err) {
      console.error('Error fetching favorite count:', err)
    }
  }

  const fetchRecentActivity = async (manufacturerIds: string[]) => {
    if (!userId || manufacturerIds.length === 0) return

    try {
      const activities: Array<{
        type: 'new_product' | 'updated_price'
        manufacturer_name: string
        product_name?: string
        date: string
      }> = []

      // Get recently added products (last 7 days) with manufacturer names
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: newProducts } = await supabase
        .from('product_data')
        .select('id, product_name, manufacturer_id, created_at')
        .in('manufacturer_id', manufacturerIds)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

      // Get manufacturer names
      const manufacturerMap = new Map<string, string>()
      if (newProducts && newProducts.length > 0) {
        const uniqueMfgIds = Array.from(new Set(newProducts.map(p => p.manufacturer_id)))
        const { data: mfgData } = await supabase
          .from('manufacturers')
          .select('id, company_name')
          .in('id', uniqueMfgIds)

        if (mfgData) {
          mfgData.forEach(m => manufacturerMap.set(m.id, m.company_name))
        }
      }

      // Add new product activities (group by manufacturer, show latest 3)
      const manufacturerActivityMap = new Map<string, typeof newProducts>()
      newProducts?.forEach(product => {
        const mfgId = product.manufacturer_id
        if (!manufacturerActivityMap.has(mfgId)) {
          manufacturerActivityMap.set(mfgId, [])
        }
        manufacturerActivityMap.get(mfgId)?.push(product)
      })

      manufacturerActivityMap.forEach((products, mfgId) => {
        const manufacturerName = manufacturerMap.get(mfgId) || 'Unknown Manufacturer'
        if (products && products.length > 0) {
          activities.push({
            type: 'new_product',
            manufacturer_name: manufacturerName,
            date: products[0].created_at,
          })
        }
      })

      // Sort by date and take latest 5
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setRecentActivity(activities.slice(0, 5))
    } catch (err) {
      console.error('Error fetching recent activity:', err)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/retailer/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">
                Retailer Dashboard
              </h1>
              {userEmail && (
                <p className="mt-2 text-sm text-gray-600">
                  Welcome, <span className="font-medium text-indigo-600">{userEmail}</span>
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Accessible Manufacturers */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Accessible Manufacturers</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{accessibleManufacturers}</p>
                </div>
                <svg className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              {/* Total Products */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Products Available</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{totalProducts}</p>
                </div>
                <svg className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>

              {/* Recently Added Products */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Added This Week</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{recentProducts}</p>
                </div>
                <svg className="h-10 w-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Browse Products Card */}
              <Link
                href="/retailer/products"
                className="block p-6 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-colors relative"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Browse Product Catalogs</h3>
                    <p className="text-sm text-gray-600">Explore products from your connected manufacturers</p>
                  </div>
                </div>
                {totalProducts > 0 && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-600 text-white">
                      {totalProducts} products
                    </span>
                  </div>
                )}
              </Link>

              {/* Favorites Card */}
              <Link
                href="/retailer/favorites"
                className="block p-6 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100 hover:border-pink-300 transition-colors relative"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-pink-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Favorites</h3>
                    <p className="text-sm text-gray-600">View your saved products</p>
                  </div>
                </div>
                {favoriteCount > 0 && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-600 text-white">
                      {favoriteCount} saved
                    </span>
                  </div>
                )}
              </Link>

              {/* Download Data Card */}
              <Link
                href="/retailer/browse"
                className="block p-6 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Download Data</h3>
                    <p className="text-sm text-gray-600">Export product catalogs for offline use</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {activity.type === 'new_product' ? (
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm text-gray-900">
                          {activity.type === 'new_product' 
                            ? `New products added by ${activity.manufacturer_name}`
                            : `Updated pricing from ${activity.manufacturer_name}`
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
