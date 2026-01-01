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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/')
        return
      }

      // Determine role
      const { data: mfg } = await supabase
        .from('manufacturers')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (mfg) {
        setUserRole('manufacturer')
        setLoading(false)
        return
      }

      const { data: ret } = await supabase
        .from('retailers')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (ret) {
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
      <TopNav userRole={userRole} />
      <div className="flex">
        <Sidebar userRole={userRole} currentPath={pathname} />
        <main className="flex-1 ml-64 mt-16 p-8">
          {children}
        </main>
      </div>
      {userRole === 'retailer' && <ComparisonBadge />}
    </div>
  )
}
