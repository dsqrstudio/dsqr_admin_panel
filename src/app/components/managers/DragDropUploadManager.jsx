'use client'
import React, { useState, useRef, useCallback } from 'react'
import {
  FiUploadCloud,
  FiX,
  FiMenu,
  FiEdit2,
  FiImage,
  FiVideo,
  FiEye,
  FiTrash2,
} from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import {
  ConfirmModal,
  ImagePreviewModal,
  VideoPreviewModal,
} from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'

/**
 * DragDropUploadManager - Modern file upload with drag-and-drop reordering
 * Features:
 * - Drag zone for file upload
 * - Drag-and-drop to reorder items
 * - Order numbers visible
 * - Professional UI/UX
 * - Supports images and videos
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function DragDropUploadManager({
  mode = 'image', // 'image' | 'video'
  items = [],
  onChange = () => {},
  category,
  subsection,
  allowAdd = true,
  allowEdit = true,
  allowDelete = true,
  maxItems = Infinity,
  primaryColor = '#cff000',
  renderItemExtra, // function (item, index) => ReactNode
  modelDbName = 'media-items',
  onUploadSuccess,
  onDeleteSuccess,
}) {
  console.log('[DragDropUploadManager] items:', items)
  const toSafeUrl = useCallback((url) => (url ? encodeURI(url) : url), [])
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [previewModal, setPreviewModal] = useState(null)
  const [editingIndex, setEditingIndex] = useState(null)
  const fileInputRef = useRef(null)
  const editFileInputRef = useRef(null)
  const { showToast, ToastComponent } = useToast()

  // Handle file upload

  const handleFileSelect = async (files) => {
    console.log('[DragDropUploadManager] handleFileSelect called', {
      files,
      items,
      category,
      subsection,
      mode,
    })
    if (!files || files.length === 0) return
    if (items.length >= maxItems) {
      showToast(`Maximum ${maxItems} items allowed`, 'warning')
      return
    }

    const file = files[0]
    const isVideo = file.type.startsWith('video/')

    if (mode === 'image' && isVideo) {
      showToast('Please select an image file', 'error')
      return
    }
    if (mode === 'video' && !isVideo) {
      showToast('Please select a video file', 'error')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // 1. Request upload URL from backend (pass type)
      const res = await fetch(
        `${API_BASE_URL}/api/admin/media-items/generate-upload-url?_t=\${Date.now()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            category,
            subsection,
            originalName: file.name,
            type: isVideo ? 'video' : 'image',
          }),
        },
      )
      const uploadInfo = await res.json()
      if (!uploadInfo.uploadUrl || !uploadInfo.uploadHeaders)
        throw new Error('Failed to get upload URL')

      if (uploadInfo.isVideo) {
        // Bunny Stream: (1) POST JSON to create video, (2) PUT binary to upload file
        setUploadProgress(10)
        // 1. Create video entry (POST JSON)
        const configRes = await fetch(
          `${API_BASE_URL}/api/admin/media-items/config?_t=\${Date.now()}`,
          {
            method: 'GET',
            credentials: 'include',
          },
        )
        const config = await configRes.json()
        if (!config.success || !config.libraryId || !config.apiKey) {
          showToast('Failed to get Bunny config', 'error')
          setUploading(false)
          setUploadProgress(0)
          return
        }
        const createRes = await fetch(
          `https://video.bunnycdn.com/library/${config.libraryId}/videos`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              AccessKey: config.apiKey,
            },
            body: JSON.stringify({ title: file.name }),
          },
        )
        if (!createRes.ok) {
          setUploading(false)
          setUploadProgress(0)
          const errText = await createRes.text().catch(() => '')
          showToast(
            `Bunny create error: ${errText || createRes.status}`,
            'error',
          )
          return
        }
        const videoData = await createRes.json()
        if (!videoData.guid) {
          setUploading(false)
          setUploadProgress(0)
          showToast('No GUID returned from Bunny', 'error')
          return
        }
        // 2. PUT raw file to Bunny
        const uploadUrl = `https://video.bunnycdn.com/library/${config.libraryId}/videos/${videoData.guid}`
        const xhr = new window.XMLHttpRequest()
        xhr.open('PUT', uploadUrl, true)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.setRequestHeader('AccessKey', config.apiKey)
        xhr.upload.onprogress = function (event) {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(percent)
          }
        }
        xhr.onload = async function () {
          setUploading(false)
          setUploadProgress(0)
          if (xhr.status === 201 || xhr.status === 200) {
            // Save metadata with guid (backend will construct HLS and poster URLs)
            const metaRes = await fetch(
              `${API_BASE_URL}/api/admin/media-items/save-metadata?_t=\${Date.now()}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  type: 'video',
                  guid: videoData?.guid,
                  category,
                  subsection,
                  order: items.length,
                  description: videoData?.title || file.name,
                }),
              },
            )
            const meta = await metaRes.json()
            if (meta.success && meta.data) {
              showToast('Video upload successful!', 'success')
              if (typeof onUploadSuccess === 'function') onUploadSuccess()
            } else {
              showToast(meta.error || 'Failed to save metadata', 'error')
            }
          } else {
            let errMsg = 'Video upload failed'
            try {
              errMsg = xhr.responseText || errMsg
            } catch {}
            showToast(errMsg, 'error')
            console.error(
              '[BUNNY ERROR]',
              xhr.status,
              xhr.statusText,
              xhr.responseText,
            )
          }
        }
        xhr.onerror = function () {
          setUploading(false)
          setUploadProgress(0)
          let errMsg = 'Video upload failed'
          try {
            errMsg = xhr.responseText || errMsg
          } catch {}
          showToast(errMsg, 'error')
          console.error(
            '[BUNNY ERROR]',
            xhr.status,
            xhr.statusText,
            xhr.responseText,
          )
        }
        xhr.send(file)
      } else {
        // Bunny Storage: PUT file
        const xhr = new window.XMLHttpRequest()
        xhr.open('PUT', uploadInfo.uploadUrl, true)
        Object.entries(uploadInfo.uploadHeaders).forEach(([k, v]) =>
          xhr.setRequestHeader(k, v),
        )
        xhr.upload.onprogress = function (event) {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(percent)
          }
        }
        xhr.onload = async function () {
          setUploading(false)
          setUploadProgress(0)
          if (xhr.status === 201 || xhr.status === 200) {
            // Save metadata in backend
            const metaRes = await fetch(
              `${API_BASE_URL}/api/admin/media-items/save-metadata?_t=\${Date.now()}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  type: 'image',
                  src: uploadInfo.cdnUrl,
                  category,
                  subsection,
                  order: items.length,
                }),
              },
            )
            const meta = await metaRes.json()
            if (meta.success && meta.data) {
              showToast('Upload successful!', 'success')
              if (typeof onUploadSuccess === 'function') onUploadSuccess()
            } else {
              showToast(meta.error || 'Failed to save metadata', 'error')
            }
          } else {
            showToast('Upload failed', 'error')
          }
        }
        xhr.onerror = function () {
          setUploading(false)
          setUploadProgress(0)
          showToast('Upload failed', 'error')
        }
        xhr.send(file)
      }
    } catch (error) {
      setUploading(false)
      setUploadProgress(0)
      console.error('Upload error:', error)
      showToast('Upload failed', 'error')
    }
  }

  // Drag handlers for reordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newItems = [...items]
    const [draggedItem] = newItems.splice(draggedIndex, 1)
    newItems.splice(dropIndex, 0, draggedItem)

    // Update order field for all items
    const reorderedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx,
    }))

    onChange(reorderedItems)
    setDraggedIndex(null)
    setDragOverIndex(null)

    // Make API call to save order in the backend
    try {
      const orderIds = reorderedItems.map(item => item._id || item.id).filter(Boolean)
      console.log('[DragDropUploadManager] Reordering items with IDs:', orderIds)
      
      if (orderIds.length > 0) {
        console.log(`[DragDropUploadManager] Sending POST to ${API_BASE_URL}/api/admin/reorder/${modelDbName}?_t=\${Date.now()}`)
        const res = await fetch(`${API_BASE_URL}/api/admin/reorder/${modelDbName}?_t=\${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ order: orderIds }),
        })
        const data = await res.json()
        console.log('[DragDropUploadManager] Reorder API response:', data)
        
        if (data.success) {
          showToast('Reorder successful!', 'success')
          if (typeof onUploadSuccess === 'function') {
            setTimeout(() => onUploadSuccess(), 500)
          }
        } else {
          showToast(`Reorder failed: ${data.message || 'Unknown error'}`, 'error')
        }
      } else {
        console.warn('[DragDropUploadManager] No valid IDs found to reorder!')
        showToast('Error: No valid item IDs to reorder', 'error')
      }
    } catch (err) {
      console.error('[DragDropUploadManager] Reorder catch error:', err)
      showToast('Error saving order: Network or server failure', 'error')
    }
  }

  const handleDelete = async (index) => {
    const item = items[index]
    if (item._id || item.id) {
      try {
        const itemId = item._id || item.id
        {
          previewModal && previewModal.type === 'video' && (
            <VideoPreviewModal
              isOpen={!!previewModal}
              onClose={() => setPreviewModal(null)}
              src={previewModal.src}
              poster={previewModal.poster}
            />
          )
        }
        {
          previewModal && previewModal.type === 'image' && (
            <ImagePreviewModal
              isOpen={!!previewModal}
              onClose={() => setPreviewModal(null)}
              src={previewModal.src}
            />
          )
        }
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/${itemId}?_t=\${Date.now()}`,
          {
            method: 'DELETE',
            credentials: 'include',
          },
        )
      } catch (error) {
        console.error('Delete error:', error)
        showToast('Failed to delete item', 'error')
        return
      }
    }

    const newItems = items.filter((_, i) => i !== index)
    // Update order for remaining items
    const reorderedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx,
    }))
    onChange(reorderedItems)
    showToast('Item deleted successfully', 'success')
    if (typeof onUploadSuccess === 'function') {
      onUploadSuccess()
    }
  }

  // Handle replace/edit file
  const handleReplaceFile = async (index, file) => {
    if (!file) return

    const item = items[index]
    const itemId = item._id || item.id

    if (!itemId) {
      showToast('Cannot replace item without ID', 'error')
      return
    }

    const isVideo = file.type.startsWith('video/')

    if (mode === 'image' && isVideo) {
      showToast('Please select an image file', 'error')
      return
    }
    if (mode === 'video' && !isVideo) {
      showToast('Please select a video file', 'error')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Use XMLHttpRequest for progress
      const xhr = new window.XMLHttpRequest()
      xhr.open(
        'POST',
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/${itemId}/replace?_t=\${Date.now()}`,
        true,
      )
      xhr.withCredentials = true

      xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percent)
        }
      }

      xhr.onload = function () {
        setUploading(false)
        setUploadProgress(0)
        try {
          const result = JSON.parse(xhr.responseText)
          if (xhr.status === 200 && result.success && result.data) {
            const newItems = [...items]
            newItems[index] = { ...result.data, order: index }
            onChange(newItems)
            showToast('File replaced successfully!', 'success')
            setEditingIndex(null)
            if (typeof onUploadSuccess === 'function') {
              onUploadSuccess()
            }
          } else {
            showToast('Failed to replace file', 'error')
          }
        } catch (err) {
          showToast('Failed to replace file', 'error')
        }
      }

      xhr.onerror = function () {
        setUploading(false)
        setUploadProgress(0)
        showToast('Failed to replace file', 'error')
      }

      xhr.send(formData)
    } catch (error) {
      setUploading(false)
      setUploadProgress(0)
      console.error('Replace error:', error)
      showToast('Failed to replace file', 'error')
    }
  }

  // File drop zone handlers
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleFileDropZoneDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleFileDropZoneDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Hidden file input for editing - placed outside upload zone to prevent conflicts */}
      <input
        ref={editFileInputRef}
        type="file"
        accept={mode === 'image' ? 'image/*' : 'video/*'}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0] && editingIndex !== null) {
            handleReplaceFile(editingIndex, e.target.files[0])
            e.target.value = '' // Reset input
          }
        }}
      />

      {/* Upload Zone */}
      {allowAdd && items.length < maxItems && (
        <div
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 sm:p-8 lg:p-10 text-center hover:border-[#cff000] hover:bg-[#cff000]/5 transition-all duration-300 cursor-pointer bg-linear-to-br from-slate-50/80 to-white/80 backdrop-blur-sm group"
          onDragEnter={handleDragEnter}
          onDragOver={handleFileDropZoneDragOver}
          onDrop={handleFileDropZoneDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={mode === 'image' ? 'image/*' : 'video/*'}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-[#cff000]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <FiUploadCloud className="relative mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-400 group-hover:text-[#cff000] transition-colors duration-300" />
          </div>
          <p className="text-sm sm:text-base font-semibold text-slate-700 mb-1">
            {uploading ? 'Uploading...' : 'Drop file here or click to browse'}
          </p>
          <p className="text-xs sm:text-sm text-slate-500">
            {mode === 'image'
              ? 'Supported: JPG, PNG, GIF, WebP'
              : 'Supported: MP4, WebM, MOV'}
          </p>
          {uploading && (
            <div className="mt-4 w-full max-w-xs mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full transition-all duration-300 bg-linear-to-r from-[#cff000] to-[#b8dc00] shadow-sm"
                  style={{
                    width: `${uploadProgress}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Items List with Drag-and-Drop */}
      {/* Empty State */}
      {items.length === 0 && !uploading && (
        <div className="text-center py-8 sm:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 mb-3 sm:mb-4">
            {mode === 'video' ? (
              <FiVideo className="h-7 w-7 sm:h-9 sm:w-9 text-slate-400" />
            ) : (
              <FiImage className="h-7 w-7 sm:h-9 sm:w-9 text-slate-400" />
            )}
          </div>
          <p className="text-slate-500 text-sm sm:text-base font-medium">
            No items yet. Upload your first {mode} above.
          </p>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-2 sm:space-y-3">
        {items.map((item, index) => {
          const isVideo = item.type === 'video'
          // Always use HLS URL for video src if available
          const videoSrc = isVideo ? item.hlsUrl || item.src : item.src
          // Always use poster for video thumbnail if available
          const previewSrc = isVideo && item.poster ? item.poster : item.src
          const safeVideoSrc = toSafeUrl(videoSrc)
          const safePreviewSrc = toSafeUrl(previewSrc)
          const isDraggedOver = dragOverIndex === index

          return (
            <div
              key={item._id || item.id || index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`group flex items-center gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 transition-all duration-300 shadow-sm hover:shadow-md ${
                isDraggedOver
                  ? 'border-[#cff000] bg-[#cff000]/10 scale-[1.02]'
                  : 'border-slate-200 hover:border-slate-300'
              } ${
                draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100'
              }`}
            >
              {/* Drag Handle */}
              <div className="shrink-0 cursor-move text-slate-400 hover:text-[#cff000] transition-colors duration-200 p-1">
                <FiMenu className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>

              {/* Order Number */}
              <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-md bg-linear-to-br from-[#cff000] to-[#b8dc00]">
                {index + 1}
              </div>

              {/* Extra injected UI (e.g., checkbox) */}
              {typeof renderItemExtra === 'function' && (
                <div className="shrink-0 flex items-center mr-1">
                  {renderItemExtra(item, index)}
                </div>
              )}

              {/* Preview */}
              <div
                className="shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-slate-200 group-hover:border-[#cff000]/30 transition-all duration-300 shadow-sm relative cursor-pointer group/preview"
                style={
                  isVideo && item.poster
                    ? {
                        backgroundImage: `url('${item.poster}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : {}
                }
                onClick={() => {
                  if (isVideo) {
                    if (!videoSrc) {
                      showToast(
                        'Video is still processing. Please wait until preview is ready.',
                        'warning',
                      )
                      return
                    }
                    setPreviewModal({
                      src: safeVideoSrc,
                      type: 'video',
                      poster: safePreviewSrc,
                    })
                  } else if (previewSrc) {
                    setPreviewModal({
                      src:
                        safePreviewSrc + '?v=' + (item.updatedAt || Date.now()),
                      type: 'image',
                      poster: item.poster,
                    })
                  }
                }}
                title={
                  isVideo && !videoSrc ? 'Processing...' : 'Click to preview'
                }
              >
                {isVideo && !videoSrc ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <FiVideo className="h-6 w-6 sm:h-8 sm:w-8 animate-pulse" />
                    <span className="text-xs text-slate-500 mt-1">
                      Processing...
                    </span>
                  </div>
                ) : previewSrc ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={isVideo ? item.poster || '' : item.src || ''}
                      src={
                        safePreviewSrc +
                        '?v=' +
                        (item.updatedAt || item._id || 0)
                      }
                      alt=""
                      className="w-full h-full object-cover group-hover/preview:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.style.display = 'none'
                        // Only show fallback icon for videos
                        if (isVideo) {
                          const fallback = e.target.parentNode.querySelector(
                            '.video-fallback-icon',
                          )
                          if (fallback) fallback.style.display = 'flex'
                        }
                      }}
                    />
                    {/* Only show fallback icon for videos */}
                    {isVideo && (
                      <div
                        className="video-fallback-icon w-full h-full flex items-center justify-center text-slate-400"
                        style={{
                          display: 'none',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                        }}
                      >
                        <FiVideo className="h-6 w-6 sm:h-8 sm:w-8" />
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <FiEye className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    {/* Title overlay if available */}
                    {item.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] sm:text-xs px-1.5 py-1 truncate">
                        {item.title}
                      </div>
                    )}
                    {/* Show loading overlay if editing this video */}
                    {isVideo && uploading && editingIndex === index && (
                      <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center z-20 pointer-events-none">
                        <span
                          className="text-xs text-slate-700 mb-2"
                          style={{ textShadow: '0 1px 2px #fff' }}
                        >
                          Uploading...
                        </span>
                        <div className="w-2/3 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#cff000] transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    {isVideo ? (
                      <FiVideo className="h-6 w-6 sm:h-8 sm:w-8" />
                    ) : (
                      <FiImage className="h-6 w-6 sm:h-8 sm:w-8" />
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {item.title || `${isVideo ? 'Video' : 'Image'} #${index + 1}`}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate mt-0.5 sm:mt-1">
                  {videoSrc && videoSrc.startsWith('http')
                    ? new URL(videoSrc).pathname.split('/').pop()
                    : videoSrc || 'No source'}
                </p>
              </div>

              {/* Actions */}
              <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingIndex(index)
                    editFileInputRef.current?.click()
                  }}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 border border-blue-200 hover:border-blue-300"
                  aria-label="Replace"
                  title="Replace with new file"
                >
                  <FiEdit2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                {allowDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm(index)
                    }}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 border border-red-200 hover:border-red-300"
                    aria-label="Delete"
                    title="Delete item"
                  >
                    <FiTrash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {ToastComponent}

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm)}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {previewModal?.type === 'image' && (
        <ImagePreviewModal
          isOpen={!!previewModal}
          onClose={() => setPreviewModal(null)}
          src={previewModal.src}
        />
      )}

      {previewModal?.type === 'video' && (
        <VideoPreviewModal
          isOpen={!!previewModal}
          onClose={() => setPreviewModal(null)}
          src={previewModal.src}
          poster={previewModal.poster}
        />
      )}
    </div>
  )
}
