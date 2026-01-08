import * as React from 'react'
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi'

const toastVariants = {
  success: {
    icon: FiCheck,
    classes: 'bg-green-50 border-green-200 text-green-800',
  },
  error: {
    icon: FiX,
    classes: 'bg-red-50 border-red-200 text-red-800',
  },
  warning: {
    icon: FiAlertCircle,
    classes: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  info: {
    icon: FiInfo,
    classes: 'bg-blue-50 border-blue-200 text-blue-800',
  },
}

export function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const variant = toastVariants[type] || toastVariants.info
  const Icon = variant.icon

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-3 min-w-[300px] ${variant.classes}`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <p className="flex-1 font-medium">{message}</p>
      <button
        onClick={onClose}
        className="p-1 hover:bg-black/10 rounded transition-colors"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = React.useState(null)

  const showToast = React.useCallback(
    (message, type = 'info', duration = 3000) => {
      setToast({ message, type, duration })
    },
    []
  )

  const hideToast = React.useCallback(() => {
    setToast(null)
  }, [])

  const ToastComponent = toast ? (
    <Toast
      message={toast.message}
      type={toast.type}
      duration={toast.duration}
      onClose={hideToast}
    />
  ) : null

  return {
    showToast,
    hideToast,
    ToastComponent,
  }
}
