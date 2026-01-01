'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if manufacturer
        const { data: mfg } = await supabase
          .from('manufacturers')
          .select('id')
          .eq('id', user.id)
          .single()
        
        if (mfg) {
          router.push('/manufacturer')
          return
        }
        
        // Check if retailer
        const { data: ret } = await supabase
          .from('retailers')
          .select('id')
          .eq('id', user.id)
          .single()
        
        if (ret) {
          router.push('/retailer')
          return
        }
      }
    }
    
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-indigo-600">NexusXO</div>
        <div className="space-x-4">
          <Link href="/manufacturer/login" className="px-4 py-2 text-gray-700 hover:text-indigo-600">
            Manufacturer Login
          </Link>
          <Link href="/retailer/login" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Retailer Login
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl font-extrabold text-gray-900 mb-6">
          Modern Product Data Exchange
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
          Connect manufacturers with retailers. Share product catalogs, images, and specifications 
          seamlessly with AI-powered search and chat.
        </p>
        
        <div className="flex justify-center gap-6">
          <Link 
            href="/manufacturer/signup" 
            className="px-8 py-4 bg-indigo-600 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 shadow-lg"
          >
            Start as Manufacturer
          </Link>
          <Link 
            href="/retailer/signup" 
            className="px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg text-lg font-semibold hover:bg-indigo-50 shadow-lg"
          >
            Start as Retailer
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-3">AI-Powered Search</h3>
            <p className="text-gray-600">Semantic search with vector embeddings finds products by meaning, not just keywords.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-3">Chat with Your Data</h3>
            <p className="text-gray-600">RAG-powered conversations let you query product catalogs naturally.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-3">Instant Sync</h3>
            <p className="text-gray-600">Real-time updates across all channels with composable architecture.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
