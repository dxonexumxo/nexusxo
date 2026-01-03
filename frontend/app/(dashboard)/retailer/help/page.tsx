'use client'
import { useState } from 'react'
import Link from 'next/link'

interface HelpSection {
  id: string
  title: string
  icon: string
  content: {
    subtitle: string
    description: string
    steps?: string[]
    tips?: string[]
  }[]
}

export default function RetailerHelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const helpSections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      content: [
        {
          subtitle: 'Welcome to NexusXO',
          description: 'NexusXO is a B2B product data exchange platform that connects retailers with manufacturers. Access product catalogs, download product data, and manage your product sourcing all in one place.',
          tips: [
            'Complete your profile in Settings for better manufacturer trust',
            'Start by browsing manufacturers and requesting access',
            'Use favorites to bookmark products you\'re interested in'
          ]
        },
        {
          subtitle: 'Account Setup',
          description: 'After creating your retailer account, you can customize your profile and preferences.',
          steps: [
            'Go to Settings from the sidebar',
            'Update your company information',
            'Set your industry and business type',
            'Add your contact details'
          ]
        }
      ]
    },
    {
      id: 'manufacturers',
      title: 'Manufacturer Directory',
      icon: '🏭',
      content: [
        {
          subtitle: 'Finding Manufacturers',
          description: 'Browse all available manufacturers and their product catalogs. You need to request access before viewing products.',
          steps: [
            'Click "Manufacturers" in the sidebar',
            'Browse the list of available manufacturers',
            'Use the search bar to find specific manufacturers',
            'Check manufacturer industry and product count'
          ]
        },
        {
          subtitle: 'Requesting Access',
          description: 'To view a manufacturer\'s products, you must request and receive access approval.',
          steps: [
            'Find the manufacturer you want to access',
            'Click "Request Access" button',
            'Add an optional message explaining your business needs',
            'Click "Send Request"',
            'Wait for manufacturer approval (you\'ll receive a notification)'
          ],
          tips: [
            'Include a professional message about your business',
            'Mention your store locations or online presence',
            'Explain why you\'re interested in their products'
          ]
        },
        {
          subtitle: 'Access Status',
          description: 'Understand the different access states for manufacturers.',
          steps: [
            '🟢 Access Granted - You can view and download products',
            '🟡 Request Pending - Waiting for manufacturer approval',
            '🔴 Access Revoked - Previously had access, now revoked',
            '⚪ No Request - Haven\'t requested access yet'
          ]
        },
        {
          subtitle: 'Re-requesting After Revocation',
          description: 'If a manufacturer revokes your access, you can request it again.',
          steps: [
            'Go to the Manufacturers page',
            'Find the manufacturer with "Access Revoked" status',
            'Click "Request Access Again"',
            'Provide a new message if needed',
            'Submit your request'
          ]
        }
      ]
    },
    {
      id: 'browsing-products',
      title: 'Browsing Products',
      icon: '🛍️',
      content: [
        {
          subtitle: 'Product Catalog',
          description: 'Browse products from all manufacturers you have access to.',
          steps: [
            'Click "Browse Products" in the sidebar',
            'Use filters to narrow down results:',
            '  - Search by product name or SKU',
            '  - Filter by category',
            '  - Filter by manufacturer',
            'View product details by clicking on any product card'
          ]
        },
        {
          subtitle: 'Product Details',
          description: 'View comprehensive information about any product.',
          steps: [
            'Click on a product to open detail view',
            'See product images (click to enlarge)',
            'View specifications, pricing, and description',
            'Check price history chart',
            'See related products from same manufacturer',
            'Add to favorites or comparison'
          ]
        },
        {
          subtitle: 'Search Functionality',
          description: 'Quickly find products using the search feature.',
          steps: [
            'Use the search bar at the top of the page',
            'Search by product name, SKU, or description',
            'Results show only from manufacturers you have access to',
            'Combine search with filters for precise results'
          ]
        }
      ]
    },
    {
      id: 'favorites',
      title: 'Favorites & Bookmarks',
      icon: '❤️',
      content: [
        {
          subtitle: 'Adding Favorites',
          description: 'Save products you\'re interested in for quick access later.',
          steps: [
            'Open any product detail page',
            'Click the heart icon "Add to Favorites"',
            'Product is saved to your favorites list',
            'Access favorites anytime from the sidebar'
          ]
        },
        {
          subtitle: 'Managing Favorites',
          description: 'View and organize your saved products.',
          steps: [
            'Click "Favorites" in the sidebar',
            'View all your favorited products',
            'Click on any product to view details',
            'Remove from favorites by clicking the heart again',
            'Use search to filter your favorites'
          ],
          tips: [
            'Favorites are automatically removed if manufacturer revokes access',
            'Use favorites to create your product shortlist',
            'Share favorite products with your team'
          ]
        }
      ]
    },
    {
      id: 'comparison',
      title: 'Product Comparison',
      icon: '⚖️',
      content: [
        {
          subtitle: 'Adding to Comparison',
          description: 'Compare up to 4 products side-by-side to make better decisions.',
          steps: [
            'Browse products or search for specific items',
            'Click "Add to Compare" on product cards',
            'Add up to 4 products',
            'Click "View Comparison" to see side-by-side view'
          ]
        },
        {
          subtitle: 'Comparison View',
          description: 'Analyze product differences in a clear table format.',
          steps: [
            'Click "Compare" in the sidebar',
            'View products side-by-side',
            'Compare: Price, specifications, features, manufacturer',
            'Click any product to view full details',
            'Remove products from comparison as needed',
            'Clear all to start a new comparison'
          ],
          tips: [
            'Compare products from different manufacturers',
            'Use comparison for similar product categories',
            'Products are removed if manufacturer revokes access'
          ]
        }
      ]
    },
    {
      id: 'downloads',
      title: 'Downloading Product Data',
      icon: '💾',
      content: [
        {
          subtitle: 'Bulk Downloads',
          description: 'Download complete product catalogs from manufacturers you have access to.',
          steps: [
            'Click "Downloads" in the sidebar',
            'Select a manufacturer from the list',
            'Choose download format (CSV, Excel, JSON)',
            'Click "Download Catalog"',
            'File will be downloaded to your device'
          ]
        },
        {
          subtitle: 'Download Formats',
          description: 'Choose the format that works best for your systems.',
          steps: [
            'CSV - Compatible with Excel, Google Sheets, most systems',
            'Excel - Native Microsoft Excel format with formatting',
            'JSON - For technical integration with your systems'
          ]
        },
        {
          subtitle: 'What\'s Included',
          description: 'Downloaded files contain complete product information.',
          steps: [
            'Product SKU and name',
            'Description and specifications',
            'Pricing information',
            'Category and tags',
            'Image URLs',
            'Manufacturer details'
          ]
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: '🔔',
      content: [
        {
          subtitle: 'Understanding Notifications',
          description: 'Stay informed about access requests and product updates.',
          steps: [
            'Click the bell icon in the top navigation',
            'View all notifications in the dropdown',
            'Unread notifications are highlighted',
            'Click a notification to view related content',
            'Mark all as read or individual notifications'
          ]
        },
        {
          subtitle: 'Notification Types',
          description: 'Different types of notifications you may receive.',
          steps: [
            '✅ Access Approved - Manufacturer granted your access',
            '❌ Access Rejected - Your access request was declined',
            '🚫 Access Revoked - Manufacturer revoked your existing access',
            '📨 Other Updates - System announcements and updates'
          ]
        },
        {
          subtitle: 'Managing Notifications',
          description: 'Keep your notification center organized.',
          steps: [
            'Click on notifications to mark as read',
            'Use "Mark all as read" to clear unread status',
            'Notifications remain accessible after being read',
            'Recent notifications show in the dropdown'
          ]
        }
      ]
    },
    {
      id: 'settings',
      title: 'Account Settings',
      icon: '⚙️',
      content: [
        {
          subtitle: 'Profile Information',
          description: 'Update your company and contact details.',
          steps: [
            'Click "Settings" in the sidebar',
            'Update company name and email',
            'Set your industry and business type',
            'Save changes when complete'
          ]
        },
        {
          subtitle: 'Password & Security',
          description: 'Keep your account secure.',
          steps: [
            'Use a strong, unique password',
            'Log out when using shared devices',
            'Contact support if you suspect unauthorized access'
          ]
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: '🔧',
      content: [
        {
          subtitle: 'Cannot See Products',
          description: 'If you can\'t view a manufacturer\'s products:',
          steps: [
            'Check if you have requested access',
            'Verify your access request was approved',
            'Ensure manufacturer hasn\'t revoked your access',
            'Check notifications for any access changes',
            'Contact the manufacturer directly if needed'
          ]
        },
        {
          subtitle: 'Missing Favorites or Comparisons',
          description: 'If favorites or comparison items disappeared:',
          steps: [
            'Manufacturer may have revoked your access',
            'Check notifications for "Access Revoked" messages',
            'Products from revoked manufacturers are automatically removed',
            'Request access again if needed'
          ]
        },
        {
          subtitle: 'Download Issues',
          description: 'If downloads fail or are incomplete:',
          steps: [
            'Verify you still have access to that manufacturer',
            'Check your internet connection',
            'Try a different download format',
            'Clear browser cache and try again',
            'Contact support if problem persists'
          ]
        }
      ]
    }
  ]

  const faqs = [
    {
      question: 'How long does it take for access requests to be approved?',
      answer: 'Approval time varies by manufacturer. Most respond within 24-48 hours. You\'ll receive a notification once they respond.'
    },
    {
      question: 'Can I request access to multiple manufacturers at once?',
      answer: 'Yes! Visit the Manufacturers page and request access to as many as you need. Each request is handled independently.'
    },
    {
      question: 'Why was my access revoked?',
      answer: 'Manufacturers can revoke access for various business reasons. Check your notification for any message from the manufacturer. You can request access again with an updated message.'
    },
    {
      question: 'Can I download product images?',
      answer: 'Image URLs are included in downloaded data files. You can access images directly from those URLs or view them in the product detail pages.'
    },
    {
      question: 'How often is product data updated?',
      answer: 'Manufacturers update their product data in real-time. You always see the most current information when browsing or downloading.'
    },
    {
      question: 'Is there a limit to how many products I can favorite or compare?',
      answer: 'You can favorite unlimited products. Comparison is limited to 4 products at a time for optimal side-by-side viewing.'
    },
    {
      question: 'Can I integrate NexusXO data with my systems?',
      answer: 'Yes! Download product data in JSON format for easy integration with your inventory or e-commerce systems.'
    },
    {
      question: 'What if I can\'t find a specific manufacturer?',
      answer: 'Not all manufacturers may be on the platform yet. Contact support to suggest new manufacturers you\'d like to see added.'
    }
  ]

  const filteredSections = searchQuery
    ? helpSections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.some(c =>
          c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : helpSections

  const filteredFaqs = searchQuery
    ? faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-lg text-gray-600">
          Learn how to use all features available to retailers on NexusXO
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <input
            type="text"
            placeholder="Search help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {helpSections.map(section => (
          <button
            key={section.id}
            onClick={() => {
              setActiveSection(section.id)
              document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-2">{section.icon}</div>
            <div className="text-sm font-semibold text-gray-900">{section.title}</div>
          </button>
        ))}
      </div>

      {/* API Documentation Link */}
      <div className="mb-12 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">📚 API Documentation</h3>
            <p className="text-gray-700 mb-4">
              Looking to integrate NexusXO into your systems? Check out our comprehensive API documentation with code examples, interactive testing, and guides.
            </p>
            <Link
              href="/docs"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              View API Documentation
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Help Sections */}
      <div className="space-y-12">
        {filteredSections.map(section => (
          <div
            key={section.id}
            id={section.id}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <div className="flex items-center mb-6">
              <span className="text-4xl mr-4">{section.icon}</span>
              <h2 className="text-3xl font-bold text-gray-900">{section.title}</h2>
            </div>

            <div className="space-y-8">
              {section.content.map((content, idx) => (
                <div key={idx}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {content.subtitle}
                  </h3>
                  <p className="text-gray-700 mb-4">{content.description}</p>

                  {content.steps && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Steps:</h4>
                      <ol className="space-y-2">
                        {content.steps.map((step, stepIdx) => (
                          <li key={stepIdx} className="flex items-start">
                            <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                              {stepIdx + 1}
                            </span>
                            <span className="text-gray-700">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {content.tips && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                        <span className="mr-2">💡</span> Tips:
                      </h4>
                      <ul className="space-y-1">
                        {content.tips.map((tip, tipIdx) => (
                          <li key={tipIdx} className="text-blue-800 text-sm">
                            • {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="mr-3">❓</span>
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          {filteredFaqs.map((faq, idx) => (
            <div key={idx} className="border-b border-gray-200 pb-6 last:border-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-700">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-3">Still Need Help?</h2>
        <p className="text-lg mb-6 opacity-90">
          Our support team is here to help you succeed
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="mailto:support@nexusxo.com"
            className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Email Support
          </a>
          <Link
            href="/retailer"
            className="px-6 py-3 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* No Results */}
      {searchQuery && filteredSections.length === 0 && filteredFaqs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 mb-4">
            Try different keywords or browse all topics above
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  )
}
