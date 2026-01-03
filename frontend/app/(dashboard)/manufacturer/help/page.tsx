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

export default function ManufacturerHelpPage() {
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
          description: 'NexusXO is a B2B product data exchange platform that connects manufacturers with retailers. Upload your product catalogs, manage retailer access, and reach new customers.',
          tips: [
            'Complete your profile in Settings for better visibility',
            'Start by uploading your product catalog',
            'Manage access requests from retailers'
          ]
        },
        {
          subtitle: 'Account Setup',
          description: 'After creating your manufacturer account, you can customize your profile and start adding products.',
          steps: [
            'Go to Settings from the sidebar',
            'Update your company information',
            'Set your industry and contact details',
            'Configure your profile preferences'
          ]
        }
      ]
    },
    {
      id: 'products',
      title: 'Managing Products',
      icon: '📦',
      content: [
        {
          subtitle: 'Uploading Products',
          description: 'Add products to your catalog so retailers can discover and request access.',
          steps: [
            'Click "My Products" in the sidebar',
            'Click "Upload Products" button',
            'Fill in product details (SKU, name, price, description, etc.)',
            'Upload product images',
            'Add product specifications and attributes',
            'Click "Save Product" to add to your catalog'
          ],
          tips: [
            'Use clear, descriptive product names',
            'Include high-quality product images',
            'Fill in all relevant specifications',
            'Use consistent SKU format'
          ]
        },
        {
          subtitle: 'Editing Products',
          description: 'Update product information, prices, and availability.',
          steps: [
            'Go to "My Products"',
            'Click on the product you want to edit',
            'Update any fields you want to change',
            'Click "Save Changes"',
            'Retailers will see updated information'
          ]
        },
        {
          subtitle: 'Product Details',
          description: 'View comprehensive information about your products.',
          steps: [
            'Click on any product to view details',
            'See all product information and images',
            'View which retailers have access',
            'Check product performance metrics',
            'Edit or delete products as needed'
          ]
        }
      ]
    },
    {
      id: 'retailers',
      title: 'Managing Retailers',
      icon: '🏪',
      content: [
        {
          subtitle: 'Access Requests',
          description: 'Review and manage requests from retailers who want access to your products.',
          steps: [
            'Click "Retailers" in the sidebar',
            'View the "Access Requests" tab',
            'See pending requests with retailer information',
            'Review retailer profile and message',
            'Click "Approve" or "Reject"',
            'Retailers receive notifications about your decision'
          ],
          tips: [
            'Review retailer profiles before approving',
            'Check their business type and industry',
            'Consider their product needs',
            'You can revoke access later if needed'
          ]
        },
        {
          subtitle: 'Retailer Management',
          description: 'Manage retailers who have access to your products.',
          steps: [
            'Go to "Retailers" page',
            'View list of retailers with access',
            'See access status and date granted',
            'Revoke access if needed',
            'View retailer activity and engagement'
          ]
        },
        {
          subtitle: 'Revoking Access',
          description: 'If needed, you can revoke a retailer\'s access to your products.',
          steps: [
            'Go to "Retailers" page',
            'Find the retailer you want to revoke access from',
            'Click "Revoke Access" button',
            'Optionally add a reason for revocation',
            'Confirm the action',
            'Retailer will be notified and can no longer see your products'
          ]
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Insights',
      icon: '📊',
      content: [
        {
          subtitle: 'Viewing Analytics',
          description: 'Track how retailers interact with your products and catalog.',
          steps: [
            'Click "Analytics" in the sidebar',
            'View product performance metrics',
            'See retailer engagement statistics',
            'Check access request trends',
            'Analyze product views and downloads'
          ],
          tips: [
            'Regularly check analytics to understand retailer interest',
            'Identify your most popular products',
            'Use insights to improve product listings'
          ]
        },
        {
          subtitle: 'Key Metrics',
          description: 'Understand the metrics available in your analytics dashboard.',
          steps: [
            'Product Views - How many times products are viewed',
            'Access Requests - Number of retailers requesting access',
            'Active Retailers - Retailers with current access',
            'Downloads - Product catalog downloads by retailers',
            'Top Products - Your most viewed products'
          ]
        }
      ]
    },
    {
      id: 'settings',
      title: 'Settings & Configuration',
      icon: '⚙️',
      content: [
        {
          subtitle: 'Profile Settings',
          description: 'Update your company information and profile details.',
          steps: [
            'Click "Settings" in the sidebar',
            'Go to "Profile" tab',
            'Update company name, email, and industry',
            'Save your changes'
          ]
        },
        {
          subtitle: 'API Tokens',
          description: 'Create API tokens for programmatic access to your product data.',
          steps: [
            'Go to Settings → API Tokens tab',
            'Click "Create Token"',
            'Enter a token name and select scopes',
            'Set expiration date (optional)',
            'Copy and save your token securely',
            'Use the token to integrate with external systems'
          ],
          tips: [
            'Store API tokens securely - they\'re only shown once',
            'Use different tokens for different environments',
            'Rotate tokens regularly for security',
            'Revoke tokens you no longer need'
          ]
        },
        {
          subtitle: 'Security Settings',
          description: 'Manage your account security and password.',
          steps: [
            'Go to Settings → Security tab',
            'Change your password if needed',
            'Review account activity',
            'Manage security preferences'
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
          description: 'Stay informed about access requests and retailer activity.',
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
            '🆕 New Access Request - Retailer requesting access',
            '✅ Access Approved - You approved a request',
            '❌ Access Rejected - You rejected a request',
            '📊 Analytics Update - Weekly/monthly reports',
            '📨 System Updates - Platform announcements'
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
    }
  ]

  const faqs = [
    {
      question: 'How do I upload multiple products at once?',
      answer: 'You can upload products individually through the "Upload Products" page. For bulk uploads, use the API with batch operations - see the API documentation for details.',
    },
    {
      question: 'Can I revoke access from a retailer?',
      answer: 'Yes, you can revoke access at any time. Go to the "Retailers" page, find the retailer, and click "Revoke Access". The retailer will be notified and can no longer see your products.',
    },
    {
      question: 'How do retailers find my products?',
      answer: 'Retailers can browse manufacturers and request access. Once approved, they can view your product catalog, search products, and download data.',
    },
    {
      question: 'What information should I include in my products?',
      answer: 'Include clear product names, descriptions, high-quality images, accurate pricing, specifications, and any relevant attributes. Complete information helps retailers make decisions.',
    },
    {
      question: 'How do I update product prices?',
      answer: 'Go to "My Products", click on the product you want to update, change the price field, and save. All retailers with access will see the updated price.',
    },
    {
      question: 'Can I see which retailers viewed my products?',
      answer: 'Yes, check the Analytics page to see product views, retailer engagement, and other metrics about how retailers interact with your catalog.',
    },
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
          Learn how to use all features available to manufacturers on NexusXO
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
              Want to automate product uploads or integrate NexusXO into your systems? Check out our comprehensive API documentation with code examples, interactive testing, and guides.
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
      <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {filteredFaqs.map((faq, idx) => (
            <div key={idx} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-700">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="mt-12 p-8 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Still Need Help?</h3>
        <p className="text-gray-700 mb-4">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
          Contact Support
        </button>
      </div>
    </div>
  )
}
