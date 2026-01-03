import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'

export default function CodeExamplesPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Code Examples</h1>
      <p>
        Complete code examples in multiple programming languages to help you get started quickly.
      </p>

      <h2>JavaScript / TypeScript</h2>
      <h3>Using Fetch API</h3>
      <CodeBlock
        language="javascript"
        code={`// List products
async function listProducts() {
  const response = await fetch('https://api.nexusxo.com/api/v1/products', {
    headers: {
      'Authorization': \`Bearer \${process.env.NEXUSXO_API_KEY}\`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(\`API error: \${response.status}\`);
  }
  
  const data = await response.json();
  return data.data;
}

// Upload product
async function uploadProduct(productData) {
  const response = await fetch('https://api.nexusxo.com/api/v1/manufacturer/products/upload', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.NEXUSXO_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ product: productData })
  });
  
  return response.json();
}`}
      />

      <h3>Using Axios</h3>
      <CodeBlock
        language="javascript"
        code={`import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.nexusxo.com/api/v1',
  headers: {
    'Authorization': \`Bearer \${process.env.NEXUSXO_API_KEY}\`,
    'Content-Type': 'application/json'
  }
});

// List products
const products = await api.get('/products');

// Upload product
const result = await api.post('/manufacturer/products/upload', {
  product: {
    sku: 'PROD-001',
    product_name: 'Example Product',
    price: 29.99,
    category: 'Electronics'
  }
});`}
      />

      <h2>Python</h2>
      <CodeBlock
        language="python"
        code={`import requests
import os

API_KEY = os.getenv('NEXUSXO_API_KEY')
BASE_URL = 'https://api.nexusxo.com/api/v1'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# List products
def list_products():
    response = requests.get(f'{BASE_URL}/products', headers=headers)
    response.raise_for_status()
    return response.json()['data']

# Upload product
def upload_product(product_data):
    payload = {'product': product_data}
    response = requests.post(
        f'{BASE_URL}/manufacturer/products/upload',
        headers=headers,
        json=payload
    )
    response.raise_for_status()
    return response.json()

# Example usage
products = list_products()
print(f'Found {len(products)} products')

new_product = {
    'sku': 'PROD-001',
    'product_name': 'Example Product',
    'price': 29.99,
    'category': 'Electronics'
}
result = upload_product(new_product)
print(f'Uploaded: {result["uploaded"]}')`}
      />

      <h2>PHP</h2>
      <CodeBlock
        language="php"
        code={`<?php

$apiKey = getenv('NEXUSXO_API_KEY');
$baseUrl = 'https://api.nexusxo.com/api/v1';

$headers = [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
];

// List products
function listProducts($baseUrl, $headers) {
    $ch = curl_init($baseUrl . '/products');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true)['data'];
}

// Upload product
function uploadProduct($baseUrl, $headers, $productData) {
    $ch = curl_init($baseUrl . '/manufacturer/products/upload');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['product' => $productData]));
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Example usage
$products = listProducts($baseUrl, $headers);
echo 'Found ' . count($products) . ' products';

$newProduct = [
    'sku' => 'PROD-001',
    'product_name' => 'Example Product',
    'price' => 29.99,
    'category' => 'Electronics'
];
$result = uploadProduct($baseUrl, $headers, $newProduct);
echo 'Uploaded: ' . $result['uploaded'];
?>`}
      />

      <h2>C#</h2>
      <CodeBlock
        language="csharp"
        code={`using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class NexusXOClient
{
    private readonly HttpClient _client;
    private readonly string _apiKey;
    private const string BaseUrl = "https://api.nexusxo.com/api/v1";

    public NexusXOClient(string apiKey)
    {
        _apiKey = apiKey;
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
        _client.DefaultRequestHeaders.Add("Content-Type", "application/json");
    }

    public async Task<Product[]> ListProductsAsync()
    {
        var response = await _client.GetAsync($"{BaseUrl}/products");
        response.EnsureSuccessStatusCode();
        
        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ApiResponse>(json);
        return result.Data;
    }

    public async Task<UploadResult> UploadProductAsync(Product product)
    {
        var payload = new { product };
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _client.PostAsync($"{BaseUrl}/manufacturer/products/upload", content);
        response.EnsureSuccessStatusCode();
        
        var responseJson = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<UploadResult>(responseJson);
    }
}`}
      />

      <h2>Ruby</h2>
      <CodeBlock
        language="ruby"
        code={`require 'net/http'
require 'json'
require 'uri'

class NexusXOClient
  BASE_URL = 'https://api.nexusxo.com/api/v1'
  
  def initialize(api_key)
    @api_key = api_key
  end
  
  def list_products
    uri = URI("#{BASE_URL}/products")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    
    request = Net::HTTP::Get.new(uri)
    request['Authorization'] = "Bearer #{@api_key}"
    request['Content-Type'] = 'application/json'
    
    response = http.request(request)
    JSON.parse(response.body)['data']
  end
  
  def upload_product(product_data)
    uri = URI("#{BASE_URL}/manufacturer/products/upload")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    
    request = Net::HTTP::Post.new(uri)
    request['Authorization'] = "Bearer #{@api_key}"
    request['Content-Type'] = 'application/json'
    request.body = { product: product_data }.to_json
    
    response = http.request(request)
    JSON.parse(response.body)
  end
end

# Example usage
client = NexusXOClient.new(ENV['NEXUSXO_API_KEY'])
products = client.list_products
puts "Found #{products.length} products"

new_product = {
  sku: 'PROD-001',
  product_name: 'Example Product',
  price: 29.99,
  category: 'Electronics'
}
result = client.upload_product(new_product)
puts "Uploaded: #{result['uploaded']}"`}
      />

      <Callout type="info" title="More Examples">
        Check individual endpoint pages for language-specific examples. Each endpoint documentation
        includes examples in multiple languages.
      </Callout>
    </div>
  )
}
