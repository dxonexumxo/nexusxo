'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
// @ts-ignore - FlexSearch types may not be perfect
import { Index } from 'flexsearch'
import { documentationPages, DocPage } from '@/lib/docs-search'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DocPage[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const indexRef = useRef<FlexSearch.Index<DocPage> | null>(null)

  // Initialize search index
  useEffect(() => {
    if (!indexRef.current) {
      const index = new Index({
        tokenize: 'forward',
        threshold: 1,
        depth: 2,
      })

      // Add documents to index
      documentationPages.forEach((page, id) => {
        const searchableText = `${page.title} ${page.content} ${page.section}`.toLowerCase()
        index.add(id, searchableText)
      })

      indexRef.current = index
    }
  }, [])

  // Handle search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSelectedIndex(0)
      return
    }

    if (!indexRef.current) return

    const searchResults = indexRef.current.search(query.toLowerCase(), 10)
    const matchedPages = searchResults.map((id) => documentationPages[id as number])
    setResults(matchedPages)
    setSelectedIndex(0)
  }, [query])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        router.push(results[selectedIndex].href)
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, router, onClose])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Close on outside click
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No results found for "{query}"
              </div>
            ) : (
              <ul className="py-2">
                {results.map((page, index) => (
                  <li key={page.href}>
                    <a
                      href={page.href}
                      onClick={(e) => {
                        e.preventDefault()
                        router.push(page.href)
                        onClose()
                      }}
                      className={`block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {page.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {page.section}
                          </div>
                        </div>
                        <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                          ↵
                        </kbd>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Help text */}
        {!query.trim() && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p className="mb-2">Search documentation</p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd>
              <span>Navigate</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd>
              <span>Select</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
