'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'

export default function RetailerSettingsPage() {
  const router = useRouter()
  const [retailerId, setRetailerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [industry, setIndustry] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    const fetchRetailerData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/retailer/login')
          return
        }
        setRetailerId(user.id)

        // Fetch retailer profile data
        const { data, error } = await supabase
          .from('retailers')
          .select('company_name, email, industry, business_type')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching retailer data:', error)
          setLoading(false)
          return
        }

        if (data) {
          setCompanyName(data.company_name || '')
          setCompanyEmail(data.email || '')
          setIndustry(data.industry || '')
          setBusinessType(data.business_type || '')
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRetailerData()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setSaveMessage(null)

    if (!retailerId) {
      setSaveMessage({ type: 'error', text: 'Please log in to save changes' })
      setIsSaving(false)
      return
    }

    try {
      const { error } = await supabase
        .from('retailers')
        .update({
          company_name: companyName,
          email: companyEmail,
          industry: industry || null,
          business_type: businessType || null
        })
        .eq('id', retailerId)

      if (error) {
        console.error('Error updating retailer:', error)
        setSaveMessage({ type: 'error', text: 'Failed to save changes: ' + error.message })
      } else {
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' })
        // Clear message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (err: any) {
      console.error('Error:', err)
      setSaveMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = () => {
    // Redirect to password reset or open password change modal
    // For Supabase, you can use: supabase.auth.resetPasswordForEmail(companyEmail)
    // Or redirect to a password change page
    alert('Password change functionality can be implemented with Supabase auth. Contact support if you need to reset your password.')
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <span>⚙️</span>
          <span>Account Settings</span>
        </h1>
        <p className="text-gray-600">
          Update your company information and keep your account secure.
        </p>
      </div>

      {/* Success/Error Message */}
      {saveMessage && (
        <div className={`mb-6 rounded-lg p-4 ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">{saveMessage.type === 'success' ? '✅' : '❌'}</span>
            <span>{saveMessage.text}</span>
          </div>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile card */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Profile Information
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Update your company and contact details.
          </p>

          {/* Steps helper */}
          <div className="mb-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">
              Steps to update your profile:
            </h3>
            <ol className="space-y-1 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-2 mt-0.5">
                  1
                </span>
                <span>Update company name and email</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-2 mt-0.5">
                  2
                </span>
                <span>Set your industry and business type</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-2 mt-0.5">
                  3
                </span>
                <span>Save changes when complete</span>
              </li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Your company name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company email
              </label>
              <input
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. Grocery, Pharmacy, Home Center"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business type
                </label>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. Retailer, Marketplace, Distributor"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Security card */}
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Password & Security
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Keep your account secure.
          </p>

          {/* Steps helper */}
          <div className="mb-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">
              Security best practices:
            </h3>
            <ol className="space-y-1 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-2 mt-0.5">
                  1
                </span>
                <span>Use a strong, unique password</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-2 mt-0.5">
                  2
                </span>
                <span>Log out when using shared devices</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-2 mt-0.5">
                  3
                </span>
                <span>Contact support if you suspect unauthorized access</span>
              </li>
            </ol>
          </div>

          {/* Change password CTA */}
          <button
            type="button"
            onClick={handleChangePassword}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Change password
          </button>

          <p className="mt-3 text-xs text-gray-500">
            If you can't change your password here, contact support so we can help you secure your account.
          </p>
        </div>
      </div>
    </div>
  )
}
