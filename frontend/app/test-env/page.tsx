'use client'

export default function TestEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      <div className="space-y-2">
        <p>URL: {url || '❌ Not loaded'}</p>
        <p>Key: {key ? '✅ Loaded (hidden)' : '❌ Not loaded'}</p>
        <p>Key length: {key?.length || 0} characters</p>
      </div>
    </div>
  )
}
