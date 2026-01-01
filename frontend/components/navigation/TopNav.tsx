'use client'
import SearchBar from './SearchBar'
import UserMenu from './UserMenu'
import NotificationBell from '@/components/notifications/NotificationBell'
import Link from 'next/link'

interface TopNavProps {
  userRole: 'manufacturer' | 'retailer' | null
  userId: string | null
}

export default function TopNav({ userRole, userId }: TopNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${userRole}`} className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <span className="text-xl font-bold text-gray-900">NexusXO</span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-8">
          <SearchBar userRole={userRole} />
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          {userId && userRole && (
            <NotificationBell userId={userId} userType={userRole} />
          )}

          {/* User Menu */}
          <UserMenu userRole={userRole} />
        </div>
      </div>
    </nav>
  )
}
