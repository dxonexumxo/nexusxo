interface Parameter {
  name: string
  type: string
  required: boolean
  description: string
  default?: string
  example?: string
}

interface ParameterTableProps {
  parameters: Parameter[]
  title?: string
}

export default function ParameterTable({ parameters, title = 'Parameters' }: ParameterTableProps) {
  return (
    <div className="my-6">
      <h4 className="text-lg font-semibold mb-3">{title}</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Required
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {parameters.map((param) => (
              <tr key={param.name} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 whitespace-nowrap">
                  <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                    {param.name}
                  </code>
                  {param.default && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      (default: {param.default})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{param.type}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {param.required ? (
                    <span className="px-2 py-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 rounded">
                      Required
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
                      Optional
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{param.description}</span>
                  {param.example && (
                    <div className="mt-1">
                      <code className="text-xs text-gray-500 dark:text-gray-400">
                        Example: {param.example}
                      </code>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
