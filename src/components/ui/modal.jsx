import * as React from 'react'
import { FiX } from 'react-icons/fi'

export function Modal({ isOpen, onClose, children, title, size = 'md' }) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden m-4`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
}) {
  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700',
    primary: 'bg-[#cff000] hover:bg-[#b8dc00] text-black',
    warning: 'bg-amber-600 hover:bg-amber-700',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6">
        {title && (
          <h3 className="text-lg font-semibold text-slate-900 mb-3">{title}</h3>
        )}
        {message && <p className="text-slate-600 mb-6">{message}</p>}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`px-4 py-2 rounded-lg text-white transition-colors font-medium ${variantClasses[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function ImagePreviewModal({ isOpen, onClose, src, alt = 'Preview' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <div className="p-4 flex items-center justify-center min-h-[500px] bg-slate-50">
        {src ? (
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-lg"
          />
        ) : (
          <p className="text-slate-500">No image available</p>
        )}
      </div>
    </Modal>
  )
}

import HlsVideoPlayer from '../../app/components/managers/HlsVideoPlayer'
export function VideoPreviewModal({
  isOpen,
  onClose,
  src,
  poster,
  alt = 'Video Preview',
}) {
  const isHls = src && src.endsWith('.m3u8')
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" title="Video Preview">
      <div className="p-4 flex items-center justify-center min-h-[500px] bg-slate-900">
        {src ? (
          isHls ? (
            <HlsVideoPlayer
              src={src}
              poster={poster}
              className="max-w-full max-h-[80vh] rounded-lg shadow-lg"
            />
          ) : (
            <video
              src={src}
              poster={poster}
              controls
              className="max-w-full max-h-[80vh] rounded-lg shadow-lg"
            >
              Your browser does not support the video tag.
            </video>
          )
        ) : (
          <p className="text-slate-400">No video available</p>
        )}
      </div>
    </Modal>
  )
}
