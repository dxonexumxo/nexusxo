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

          {/* Help (Retailers only) */}
          {userRole === 'retailer' && (
            <Link
              href="/retailer/help"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Help"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>
          )}

          {/* User Menu */}
          <UserMenu userRole={userRole} />
        </div>
      </div>
    </nav>
  )
}
