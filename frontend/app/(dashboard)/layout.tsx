'use client'
import TopNav from '@/components/navigation/TopNav'
import Sidebar from '@/components/navigation/Sidebar'
import ComparisonBadge from '@/components/ComparisonBadge'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/utils/supabase'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<'manufacturer' | 'retailer' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/')
        return
      }

      setUserId(user.id)

      // Determine role
      const { data: mfg, error: mfgError } = await supabase
        .from('manufacturers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (mfg && !mfgError) {
        setUserRole('manufacturer')
        setLoading(false)
        return
      }

      const { data: ret, error: retError } = await supabase
        .from('retailers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (ret && !retError) {
        setUserRole('retailer')
        setLoading(false)
        return
      }

      // No valid role found
      router.push('/')
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav userRole={userRole} userId={userId} />
      <Sidebar userRole={userRole} currentPath={pathname} />
      <main className="fixed top-16 left-0 right-0 bottom-0 transition-all duration-300 overflow-y-auto p-8" style={{ left: 'var(--sidebar-width)' }}>
        {children}
      </main>
      {userRole === 'retailer' && <ComparisonBadge />}
    </div>
  )
}
