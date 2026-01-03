import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import Link from 'next/link'

export default function PostmanPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Postman Collection</h1>
      <p>
        Import our Postman collection to quickly test API endpoints, explore the API, and build
        your integration.
      </p>

      <h2>Download Collection</h2>
      <p>Download the latest Postman collection:</p>

      <div className="my-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
        <h3 className="mt-0">NexusXO API Collection</h3>
        <p>Complete collection with all endpoints, examples, and environment variables.</p>
        <a
          href="/api/v1/docs?format=postman"
          className="inline-block mt-3 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          download
        >
          Download Postman Collection
        </a>
      </div>

      <h2>Import into Postman</h2>
      <ol>
        <li>Open Postman</li>
        <li>Click "Import" in the top left</li>
        <li>Select the downloaded collection file</li>
        <li>The collection will appear in your workspace</li>
      </ol>

      <h2>Set Up Environment Variables</h2>
      <p>Create a Postman environment with these variables:</p>

      <CodeBlock
        language="json"
        code={`{
  "base_url": "https://api.nexusxo.com/api/v1",
  "api_key": "YOUR_API_KEY_HERE"
}`}
      />

      <h2>Collection Structure</h2>
      <p>The collection is organized into folders:</p>
      <ul>
        <li>
          <strong>Manufacturer API</strong>
          <ul>
            <li>Upload Products</li>
            <li>Update Products</li>
            <li>Delete Products</li>
            <li>Batch Operations</li>
          </ul>
        </li>
        <li>
          <strong>Retailer API</strong>
          <ul>
            <li>List Products</li>
            <li>Get Product Details</li>
            <li>Search Products</li>
            <li>Get Manufacturers</li>
          </ul>
        </li>
      </ul>

      <h2>Using the Collection</h2>
      <h3>1. Set Your API Key</h3>
      <p>
        Update the <code>api_key</code> environment variable with your actual API key. The
        collection uses this variable in all requests.
      </p>

      <h3>2. Run Requests</h3>
      <p>
        Select any request and click "Send" to execute it. Pre-configured examples are included for
        each endpoint.
      </p>

      <h3>3. Test Different Scenarios</h3>
      <p>
        Modify request bodies to test different scenarios. The collection includes example data
        that you can customize.
      </p>

      <Callout type="info" title="Collection Features">
        <ul>
          <li>Pre-configured headers with environment variables</li>
          <li>Example request bodies for all endpoints</li>
          <li>Response examples and schema validation</li>
          <li>Organized folder structure</li>
          <li>Documentation included in collection</li>
        </ul>
      </Callout>

      <h2>OpenAPI Specification</h2>
      <p>
        You can also download our OpenAPI 3.0 specification for use with other API tools:
      </p>

      <div className="my-6">
        <a
          href="/api/v1/docs"
          className="inline-block px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          target="_blank"
        >
          View OpenAPI Spec
        </a>
      </div>

      <Callout type="warning" title="API Key Security">
        Never commit your Postman collection with real API keys to version control. Use environment
        variables and keep your keys secure.
      </Callout>
    </div>
  )
}
