import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

interface CalloutProps {
  type: 'info' | 'warning' | 'error' | 'success'
  title?: string
  children: React.ReactNode
}

export default function Callout({ type, title, children }: CalloutProps) {
  const styles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: InformationCircleIcon,
      iconColor: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-800 dark:text-blue-200',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      text: 'text-yellow-800 dark:text-yellow-200',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: XCircleIcon,
      iconColor: 'text-red-600 dark:text-red-400',
      text: 'text-red-800 dark:text-red-200',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: CheckCircleIcon,
      iconColor: 'text-green-600 dark:text-green-400',
      text: 'text-green-800 dark:text-green-200',
    },
  }

  const style = styles[type]
  const Icon = style.icon

  return (
    <div
      className={`my-6 p-4 rounded-lg border ${style.bg} ${style.border} ${style.text}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
        <div className="flex-1">
          {title && <h5 className="font-semibold mb-1">{title}</h5>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
