'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  ShoppingBagIcon, 
  BuildingStorefrontIcon,
  HeartIcon,
  ScaleIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline'

interface SidebarProps {
  userRole: 'manufacturer' | 'retailer' | null
  currentPath?: string
}

export default function Sidebar({ userRole, currentPath }: SidebarProps) {
  const pathname = usePathname()
  const activePath = currentPath || pathname
  
  // State for expand/collapse functionality
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  
  // Load pin state from localStorage on mount
  useEffect(() => {
    const savedPinState = localStorage.getItem('sidebarPinned')
    if (savedPinState === 'true') {
      setIsPinned(true)
      setIsExpanded(true)
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--sidebar-width', '256px')
      }
    } else {
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--sidebar-width', '80px')
      }
    }
  }, [])
  
  // Toggle pin state and save to localStorage
  const togglePin = () => {
    const newPinState = !isPinned
    setIsPinned(newPinState)
    localStorage.setItem('sidebarPinned', String(newPinState))
    if (newPinState) {
      setIsExpanded(true)
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--sidebar-width', '256px')
      }
    } else {
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--sidebar-width', '80px')
      }
    }
  }

  // CSS variable is only updated when pinned (not on hover)
  // When not pinned, content stays at 80px (collapsed width)
  
  // Menu items WITHOUT Help and API Tokens
  const menuItems = {
    retailer: [
      { name: 'Dashboard', path: '/retailer', icon: HomeIcon },
      { name: 'Browse Products', path: '/retailer/products', icon: ShoppingBagIcon },
      { name: 'Manufacturers', path: '/retailer/manufacturers', icon: BuildingStorefrontIcon },
      { name: 'Favorites', path: '/retailer/favorites', icon: HeartIcon },
      { name: 'Compare', path: '/retailer/compare', icon: ScaleIcon },
      { name: 'Downloads', path: '/retailer/downloads', icon: ArrowDownTrayIcon },
      { name: 'Settings', path: '/retailer/settings', icon: Cog6ToothIcon },
    ],
    manufacturer: [
      { name: 'Dashboard', path: '/manufacturer', icon: HomeIcon },
      { name: 'My Products', path: '/manufacturer/products', icon: ShoppingBagIcon },
      { name: 'Analytics', path: '/manufacturer/analytics', icon: ChartBarIcon },
      { name: 'Retailers', path: '/manufacturer/settings/retailers', icon: BuildingStorefrontIcon },
      { name: 'Settings', path: '/manufacturer/settings', icon: Cog6ToothIcon },
    ],
    admin: [
      { name: 'Dashboard', path: '/admin', icon: HomeIcon },
      { name: 'Users', path: '/admin/users', icon: BuildingStorefrontIcon },
      { name: 'Products', path: '/admin/products', icon: ShoppingBagIcon },
      { name: 'Analytics', path: '/admin/analytics', icon: ChartBarIcon },
      { name: 'Settings', path: '/admin/settings', icon: Cog6ToothIcon },
    ]
  }
  
  const items = userRole ? menuItems[userRole] || [] : []

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        <Bars3Icon className="w-6 h-6 text-gray-700" />
      </button>
      
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 z-50
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isExpanded || isPinned ? 'w-64' : 'lg:w-20 w-0'}
          overflow-hidden
          relative
        `}
        onMouseEnter={() => !isPinned && setIsExpanded(true)}
        onMouseLeave={() => !isPinned && setIsExpanded(false)}
      >
        {/* Pin Button - Upper Right Corner */}
        <button
          onClick={togglePin}
          className={`
            absolute top-4 right-4 z-10 p-1 rounded-full bg-white border border-gray-200 shadow-sm
            hover:bg-gray-50 hover:shadow transition-all duration-200
            hidden lg:block
            ${isExpanded || isPinned ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
        >
          {isPinned ? (
            <LockClosedIcon className="w-3.5 h-3.5 text-gray-600" />
          ) : (
            <LockOpenIcon className="w-3.5 h-3.5 text-gray-600" />
          )}
        </button>

        {/* Mobile: Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1.5 rounded hover:bg-gray-100"
        >
          <XMarkIcon className="w-5 h-5 text-gray-600" />
        </button>
        
        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {items.map((item) => {
              const Icon = item.icon
              const isActive = activePath === item.path || activePath.startsWith(item.path + '/')
              
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    {/* Icon (always visible) */}
                    <Icon className={`w-6 h-6 flex-shrink-0 ${
                      isActive ? 'text-indigo-600' : 'text-gray-500'
                    }`} />
                    
                    {/* Text Label (only when expanded) */}
                    <span className={`
                      whitespace-nowrap transition-opacity duration-200
                      ${isExpanded || isPinned ? 'opacity-100' : 'opacity-0 lg:opacity-0 w-0 overflow-hidden'}
                    `}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
      
    </>
  )
}
