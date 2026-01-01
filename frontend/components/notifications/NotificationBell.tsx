'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  related_id: string | null
  read: boolean
  created_at: string
}

interface Props {
  userId: string
  userType: 'manufacturer' | 'retailer'
}

export default function NotificationBell({ userId, userType }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
    
    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    }
    setLoading(false)
  }

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
    
    fetchNotifications()
  }

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    
    fetchNotifications()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'access_request': return '📨'
      case 'access_approved': return '✅'
      case 'access_rejected': return '❌'
      case 'access_revoked': return '🚫'
      default: return '🔔'
    }
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.type === 'access_request') {
      return `/${userType}/access-requests`
    }
    if (notification.type === 'access_approved' && userType === 'retailer') {
      return '/retailer/products'
    }
    if (notification.type === 'access_revoked' && userType === 'retailer') {
      return '/retailer/manufacturers'
    }
    if (notification.type === 'access_rejected' && userType === 'retailer') {
      return '/retailer/manufacturers'
    }
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-[32rem] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🔔</div>
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map(notification => {
                  const link = getNotificationLink(notification)
                  const content = (
                    <div
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        markAsRead(notification.id)
                        setIsOpen(false)
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className="font-semibold text-sm text-gray-900">{notification.title}</p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">{formatDate(notification.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  )

                  return link ? (
                    <Link key={notification.id} href={link}>
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id}>{content}</div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
