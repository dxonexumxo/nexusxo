'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  userRole: 'manufacturer' | 'retailer' | null
}

export default function SearchBar({ userRole }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/${userRole}/products?search=${encodeURIComponent(query)}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products... (AI-powered)"
        className="w-full px-4 py-2 pl-10 pr-4 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <svg 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </form>
  )
}
