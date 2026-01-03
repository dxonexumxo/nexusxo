'use client'

import { useState } from 'react'

interface ManufacturerAvatarProps {
  logoUrl?: string | null
  companyName: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-xl'
}

export default function ManufacturerAvatar({ 
  logoUrl, 
  companyName, 
  size = 'md',
  className = '' 
}: ManufacturerAvatarProps) {
  const [imageError, setImageError] = useState(false)

  const initials = companyName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizeClass = sizeClasses[size]
  const baseClasses = `rounded-full flex items-center justify-center font-semibold bg-indigo-100 text-indigo-700 flex-shrink-0 ${sizeClass} ${className}`

  if (logoUrl && !imageError) {
    return (
      <div className={`relative ${sizeClass} ${className} flex-shrink-0`}>
        <img
          src={logoUrl}
          alt={companyName}
          className="rounded-full object-cover w-full h-full"
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  return (
    <div className={baseClasses}>
      {initials}
    </div>
  )
}