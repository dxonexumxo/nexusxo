import Callout from '@/components/docs/Callout'

export default function ChangelogPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1>API Changelog</h1>
      <p>History of API changes, new features, and deprecations.</p>

      <h2>Version 1.0.0 (Current)</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">Released: January 2024</p>

      <h3>Initial Release</h3>
      <ul>
        <li>Product upload, update, and delete endpoints</li>
        <li>Product search and filtering</li>
        <li>Manufacturer information endpoints</li>
        <li>Batch operations support</li>
        <li>API token authentication</li>
        <li>Rate limiting</li>
        <li>Bulk download functionality</li>
      </ul>

      <h2>Upcoming Changes</h2>
      <Callout type="info" title="Version 1.1.0 (Planned)">
        <ul>
          <li>Webhooks support for real-time notifications</li>
          <li>Advanced search with full-text indexing</li>
          <li>Product variants and options</li>
          <li>Bulk image upload endpoint</li>
        </ul>
      </Callout>

      <h2>Deprecation Policy</h2>
      <p>
        We maintain backward compatibility for at least 12 months after deprecating an endpoint or
        feature. Deprecated features will be marked with notices in the documentation.
      </p>

      <h2>Breaking Changes</h2>
      <p>No breaking changes in the current version.</p>

      <Callout type="warning" title="Migration Guides">
        When breaking changes are introduced, migration guides will be provided with at least 3
        months notice before the changes take effect.
      </Callout>
    </div>
  )
}
