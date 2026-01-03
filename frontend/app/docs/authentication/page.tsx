import ApiEndpoint from '@/components/docs/ApiEndpoint'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import ParameterTable from '@/components/docs/ParameterTable'

export default function AuthenticationPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Authentication</h1>
      <p>
        All API requests require authentication using an API token. Your token must be included in
        the <code>Authorization</code> header of every request.
      </p>

      <h2>API Key Types</h2>
      <p>NexusXO uses different token prefixes to identify the type of API key:</p>
      <ul>
        <li>
          <strong>Manufacturer Keys:</strong> Prefix <code>mk_prod_</code> or <code>mk_test_</code>
        </li>
        <li>
          <strong>Retailer Tokens:</strong> Prefix <code>rt_prod_</code> or <code>rt_test_</code>
        </li>
      </ul>

      <Callout type="info" title="Test vs Production Keys">
        Use test keys (prefixes ending in <code>_test_</code>) for development and testing. They
        have the same functionality but may have different rate limits. Production keys should only
        be used in production environments.
      </Callout>

      <h2>Getting Your API Key</h2>
      <h3>For Manufacturers</h3>
      <ol>
        <li>Log in to your manufacturer dashboard</li>
        <li>Navigate to Settings → API Tokens</li>
        <li>Click "Create Token"</li>
        <li>Copy your token immediately (it's only shown once)</li>
        <li>Store it securely - never commit to version control</li>
      </ol>

      <h3>For Retailers</h3>
      <ol>
        <li>Log in to your retailer dashboard</li>
        <li>Navigate to Settings → API Tokens</li>
        <li>Click "Create Token"</li>
        <li>Copy your token immediately (it's only shown once)</li>
        <li>Store it securely - never commit to version control</li>
      </ol>

      <h2>Using Your API Key</h2>
      <p>
        Include your API key in the <code>Authorization</code> header using the Bearer scheme:
      </p>

      <CodeBlock
        language="http"
        code={`Authorization: Bearer YOUR_API_KEY_HERE`}
      />

      <h2>Example Request</h2>
      <p>Here's a complete example of an authenticated request:</p>

      <CodeBlock
        language="bash"
        title="cURL"
        code={`curl -X GET "https://api.nexusxo.com/api/v1/products" \\
  -H "Authorization: Bearer mk_prod_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json"`}
      />

      <CodeBlock
        language="javascript"
        title="JavaScript (fetch)"
        code={`const response = await fetch('https://api.nexusxo.com/api/v1/products', {
  headers: {
    'Authorization': 'Bearer mk_prod_xxxxxxxxxxxx',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`}
      />

      <CodeBlock
        language="python"
        title="Python (requests)"
        code={`import requests

headers = {
    'Authorization': 'Bearer mk_prod_xxxxxxxxxxxx',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.nexusxo.com/api/v1/products', headers=headers)
data = response.json()
print(data)`}
      />

      <h2>Security Best Practices</h2>
      <Callout type="warning" title="Never Share Your API Keys">
        <ul>
          <li>Never commit API keys to version control (Git, SVN, etc.)</li>
          <li>Never share keys in emails, chat, or public forums</li>
          <li>Use environment variables to store keys</li>
          <li>Rotate keys regularly (at least every 90 days)</li>
          <li>Use different keys for development and production</li>
        </ul>
      </Callout>

      <h3>Using Environment Variables</h3>
      <p>Store your API key in an environment variable:</p>

      <CodeBlock
        language="bash"
        title=".env file"
        code={`NEXUSXO_API_KEY=mk_prod_xxxxxxxxxxxx`}
      />

      <CodeBlock
        language="javascript"
        title="JavaScript"
        code={`const apiKey = process.env.NEXUSXO_API_KEY;

const response = await fetch('https://api.nexusxo.com/api/v1/products', {
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  }
});`}
      />

      <CodeBlock
        language="python"
        title="Python"
        code={`import os
import requests

api_key = os.getenv('NEXUSXO_API_KEY')

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.nexusxo.com/api/v1/products', headers=headers)`}
      />

      <h2>Token Scopes</h2>
      <p>
        API tokens can have different scopes that control what actions they can perform. When
        creating a token, you can select which scopes to grant:
      </p>

      <ParameterTable
        parameters={[
          {
            name: 'read:products',
            type: 'scope',
            required: false,
            description: 'Read access to product data',
          },
          {
            name: 'write:products',
            type: 'scope',
            required: false,
            description: 'Create and update products (manufacturers only)',
          },
          {
            name: 'search:products',
            type: 'scope',
            required: false,
            description: 'Search and filter product catalogs',
          },
          {
            name: 'read:manufacturers',
            type: 'scope',
            required: false,
            description: 'Read manufacturer information',
          },
        ]}
      />

      <h2>Token Expiration</h2>
      <p>
        Tokens can be set to expire after a certain period. Expired tokens will return a{' '}
        <code>401 Unauthorized</code> error. You can create new tokens before expiration to avoid
        service interruption.
      </p>

      <Callout type="info" title="Token Management">
        You can view, revoke, and manage your API tokens from the Settings page in your dashboard.
        Revoked tokens stop working immediately.
      </Callout>

      <h2>Error Responses</h2>
      <p>If authentication fails, you'll receive one of these error responses:</p>

      <CodeBlock
        language="json"
        title="401 Unauthorized - Missing Token"
        code={`{
  "error": "Unauthorized",
  "message": "No API token provided"
}`}
      />

      <CodeBlock
        language="json"
        title="401 Unauthorized - Invalid Token"
        code={`{
  "error": "Unauthorized",
  "message": "Invalid API token"
}`}
      />

      <CodeBlock
        language="json"
        title="403 Forbidden - Insufficient Permissions"
        code={`{
  "error": "Forbidden",
  "message": "Token does not have required scope: write:products"
}`}
      />

      <h2>Testing Your Authentication</h2>
      <p>
        You can test your API key by making a simple request to the products endpoint. If
        authentication is successful, you'll receive product data. If not, you'll receive an error
        message.
      </p>
    </div>
  )
}
