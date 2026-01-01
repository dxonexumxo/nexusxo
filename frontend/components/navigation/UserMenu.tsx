'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'

interface UserMenuProps {
  userRole: 'manufacturer' | 'retailer' | null
}

export default function UserMenu({ userRole }: UserMenuProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const table = userRole === 'manufacturer' ? 'manufacturers' : 'retailers'
        const { data } = await supabase
          .from(table)
          .select('*')
          .eq('id', user.id)
          .single()
        setUserData(data)
      }
    }
    fetchUser()
  }, [userRole])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
          {userData?.email?.[0].toUpperCase() || 'U'}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{userData?.company_name || userData?.email}</p>
            <p className="text-xs text-gray-500">{userData?.email}</p>
            <span className="inline-block mt-1 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
              {userRole}
            </span>
          </div>
          
          <button
            onClick={() => {
              setIsOpen(false)
              router.push(`/${userRole}/settings`)
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            ⚙️ Settings
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  )
}
