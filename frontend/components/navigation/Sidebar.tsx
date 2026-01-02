'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  userRole: 'manufacturer' | 'retailer' | null
  currentPath: string
}

const manufacturerMenuItems = [
  { name: 'Dashboard', path: '/manufacturer', icon: '📊' },
  { name: 'Products', path: '/manufacturer/products', icon: '📦' },
  { name: 'Upload', path: '/manufacturer/upload', icon: '⬆️' },
  { name: 'Access Requests', path: '/manufacturer/access-requests', icon: '🔔' },
  { name: 'Analytics', path: '/manufacturer/analytics', icon: '📈' },
  { name: 'Settings', path: '/manufacturer/settings', icon: '⚙️' },
]

const retailerMenuItems = [
  { name: 'Dashboard', path: '/retailer', icon: '📊' },
  { name: 'Browse Products', path: '/retailer/products', icon: '🛍️' },
  { name: 'Manufacturers', path: '/retailer/manufacturers', icon: '🏭' },
  { name: 'Favorites', path: '/retailer/favorites', icon: '❤️' },
  { name: 'Compare', path: '/retailer/compare', icon: '⚖️' },
  { name: 'Downloads', path: '/retailer/browse', icon: '💾' },
  { name: 'Settings', path: '/retailer/settings', icon: '⚙️' },
]

export default function Sidebar({ userRole, currentPath }: SidebarProps) {
  const menuItems = userRole === 'manufacturer' ? manufacturerMenuItems : retailerMenuItems

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/')
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
