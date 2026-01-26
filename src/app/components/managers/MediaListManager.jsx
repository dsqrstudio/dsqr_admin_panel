// admin/components/common/MediaListManager.jsx
'use client'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { FiTrash2, FiEdit2, FiCopy, FiPlus, FiCheck } from 'react-icons/fi'

/**
 MediaListManager (polished + refinements)
 - mode: "image" | "video" | "mixed"
 - Enter key adds item (when focus on main input; Shift+Enter allowed for newline in textarea)
 - Edit dialog: if no changes -> toast "No changes detected" and close dialog
 - Removed top-right overlay copy icon (copy is available in actions)
 - Delete toast shows trash icon
 - Improved card UI / preview styling
 - storageKey persists to localStorage if provided
*/

const DEFAULT_PRIMARY = '#cff000'

function isValidUrl(s) {
  if (!s || typeof s !== 'string') return false
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
function isProbablyVideo(src) {
  if (!src) return false
  const s = src.toLowerCase()
  if (/\.(mp4|webm|m3u8|mov|ogg)(\?|$)/.test(s)) return true
  if (
    s.includes('youtube.com') ||
    s.includes('youtu.be') ||
    s.includes('vimeo') ||
    s.includes('mediadelivery') ||
    s.includes('<iframe')
  )
    return true
  return false
}
function truncate(s, n = 80) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n - 3) + '...' : s
}

/* Toasts hook */
function useToasts() {
  const [stack, setStack] = useState([])
  useEffect(() => {
    if (!stack.length) return
    const timers = stack.map((t) =>
      setTimeout(() => setStack((s) => s.filter((x) => x.id !== t.id)), 3000),
    )
    return () => timers.forEach((t) => clearTimeout(t))
  }, [stack])
  function push(type, msg) {
    const id = Date.now() + Math.random()
    setStack((s) => [{ id, type, msg }, ...s])
  }
  return { stack, push }
}

export default function MediaListManager({
  mode = 'mixed',
  items: initial = [],
  onChange = () => {},
  allowAdd = true,
  onSave = null,
  allowEdit = true,
  allowDelete = true,
  primaryColor = DEFAULT_PRIMARY,
  storageKey = null,
  category = null,
  section = null,
  subsection = null,
  maxItems = Infinity,
}) {
  const LINK_INPUTS_ENABLED = false // Disable URL/iframe link-based add/edit UI
  const [items, setItems] = useState(initial || [])
  const [input, setInput] = useState('')
  const [posterInput, setPosterInput] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(null) // {id, type, src, poster}
  const [replaceFile, setReplaceFile] = useState(null)
  const [replacePosterFile, setReplacePosterFile] = useState(null)
  const [replacing, setReplacing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { stack: toasts, push } = useToasts()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  // load from backend or localStorage
  useEffect(() => {
    const loadItems = async () => {
      if (category) {
        let fetchUrl
        if (category === 'affiliated') {
          fetchUrl = `${API_BASE_URL}/api/admin/affiliates/`
        } else {
          fetchUrl = `${API_BASE_URL}/api/admin/media-items/category/${category}`
        }
        setLoading(true)
        try {
          const response = await fetch(fetchUrl, {
            credentials: 'include',
          })
          if (response.ok) {
            const result = await response.json()
            let dataArray = []
            if (category === 'affiliated') {
              if (result.ok && Array.isArray(result.items)) {
                dataArray = result.items.map((item) => ({
                  id: item._id,
                  type: 'image',
                  src: item.src,
                  poster: '',
                  before: '',
                  after: '',
                  section: item.section || section || category,
                  subsection: item.subsection || subsection || 'default',
                }))
              }
            } else {
              if (result.success && Array.isArray(result.data)) {
                // Only show items matching the current subsection (if set)
                dataArray = result.data
                  .filter(
                    (item) => !subsection || item.subsection === subsection,
                  )
                  .map((item) => ({
                    id: item._id,
                    type: item.type,
                    src: item.src,
                    poster: item.poster || '',
                    before: item.before || '',
                    after: item.after || '',
                    title: item.title || '',
                    section: item.section || section || category,
                    subsection: item.subsection || subsection || 'default',
                  }))
              }
            }
            setItems(dataArray)
            onChange(dataArray)
          }
        } catch (error) {
          console.error('Error loading media items:', error)
          push('error', 'Failed to load media items')
        } finally {
          setLoading(false)
        }
      } else if (storageKey) {
        // Fallback to localStorage
        const raw = localStorage.getItem(storageKey)
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            setItems(parsed)
            onChange(parsed)
          } catch {}
        }
      } else if (initial && initial.length) {
        setItems(initial)
      }
    }

    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subsection]) // <-- add subsection as dependency

  // persist and notify parent
  useEffect(() => {
    if (storageKey && !category) {
      // Only use localStorage if no category (backend) is specified
      localStorage.setItem(storageKey, JSON.stringify(items))
    }
    onChange(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  /* Add item */
  async function addItem() {
    const raw = input?.trim()
    if (!raw) {
      push('error', 'Please paste a link')
      return
    }
    const ex = extractSrc(raw)
    if (!isValidUrl(ex)) {
      push('error', 'Enter a valid http/https URL or iframe with src')
      return
    }
    const t = isProbablyVideo(ex) ? 'video' : 'image'
    if (mode === 'image' && t !== 'image') {
      push('error', 'This manager only accepts images')
      return
    }
    if (mode === 'video' && t !== 'video') {
      push('error', 'This manager only accepts videos')
      return
    }

    if (t === 'video') {
      if (!posterInput?.trim()) {
        push('error', 'Poster URL is required for videos')
        return
      }
      if (!isValidUrl(posterInput.trim())) {
        push('error', 'Enter a valid poster URL (http/https)')
        return
      }
    }

    if (category) {
      // Save to backend - use bulk save for consistency
      setSaving(true)
      try {
        const newItem = {
          id: Date.now() + Math.random(), // Temporary ID
          type: t,
          src: ex,
          poster: t === 'video' ? posterInput.trim() : '',
          order: items.length,
          active: true,
          subsection: subsection || 'default',
        }

        const updatedItems = [newItem, ...items]

        let response

        if (category === 'affiliated') {
          // Use affiliates bulk endpoint
          response = await fetch(`${API_BASE_URL}/api/admin/affiliates/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(
              updatedItems.map((item) => ({
                id: item.id,
                src: item.src,
                alt: item.alt || '',
                order: item.order || 0,
                active: item.active !== undefined ? item.active : true,
              })),
            ),
          })
        } else {
          // Use media items bulk endpoint with required subsection
          response = await fetch(
            `${API_BASE_URL}/api/admin/media-items/bulk/${category}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(
                updatedItems.map((item) => ({
                  type: item.type,
                  src: item.src,
                  poster: item.poster || '',
                  before: item.before || '',
                  after: item.after || '',
                  category: category,
                  subsection: subsection || 'default',
                  order: item.order || 0,
                  active: item.active !== undefined ? item.active : true,
                })),
              ),
            },
          )
        }

        if (response.ok) {
          const result = await response.json()

          if (category === 'affiliated') {
            // Handle affiliates response format
            if (result.ok && Array.isArray(result.items)) {
              const formattedItems = result.items.map((item) => ({
                id: item._id,
                type: 'image',
                src: item.src,
                poster: '',
                before: '',
                after: '',
              }))
              setItems(formattedItems)
              onChange(formattedItems)
            }
          } else {
            // Handle media items response format
            if (result.success && Array.isArray(result.data)) {
              const formattedItems = result.data.map((item) => ({
                id: item._id,
                type: item.type,
                src: item.src,
                poster: item.poster || '',
                before: item.before || '',
                after: item.after || '',
              }))
              setItems(formattedItems)
              onChange(formattedItems)
            }
          }

          setInput('')
          setPosterInput('')
          push('success', `${t === 'video' ? 'Video' : 'Image'} added`)
        } else {
          throw new Error('Failed to save')
        }
      } catch (error) {
        console.error('Error adding item:', error)
        push('error', 'Failed to add item')
      } finally {
        setSaving(false)
      }
    } else {
      // Fallback to local state
      const newItem = {
        id: Date.now(),
        type: t,
        src: ex,
        poster: t === 'video' ? posterInput.trim() : '',
      }
      setItems((s) => [newItem, ...s])
      setInput('')
      setPosterInput('')
      push('success', `${t === 'video' ? 'Video' : 'Image'} added`)
    }
  }

  /* Handle Enter key on input to add (accessibility) */
  function handleInputKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addItem()
    }
  }

  /* Edit flow */
  function startEdit(item) {
    setEditing({ ...item })
  }

  async function saveEdit(edited) {
    if (!edited || !edited.src) {
      push('error', 'Please enter a link')
      return
    }
    const ex = extractSrc(edited.src)
    if (!isValidUrl(ex)) {
      push('error', 'Enter a valid http/https link or iframe with src')
      return
    }
    if (edited.type === 'video' && mode === 'image') {
      push('error', 'Cannot save video in image-only manager')
      return
    }

    // poster requirement for video mode
    const nowVideo = isProbablyVideo(ex) || edited.type === 'video'
    if (nowVideo && mode === 'video') {
      if (!edited.poster || !edited.poster.trim()) {
        push('error', 'Poster URL is required for videos')
        return
      }
      if (!isValidUrl(edited.poster.trim())) {
        push('error', 'Enter a valid poster URL (http/https)')
        return
      }
    }

    const old = items.find((it) => it.id === edited.id)
    const oldSrc = old ? old.src : null
    const oldPoster = old ? old.poster || '' : ''
    const posterChanged = (edited.poster || '') !== (oldPoster || '')

    if (oldSrc === ex && !posterChanged) {
      // requested behaviour: show "No changes detected" toast and close dialog
      push('info', 'No changes detected')
      setEditing(null)
      return
    }

    if (category) {
      // Update in backend using bulk save
      setSaving(true)
      try {
        const updatedItems = items.map((it) =>
          it.id === edited.id
            ? {
                ...it,
                src: ex,
                poster: edited.poster || it.poster,
                subsection: subsection || 'default',
              }
            : it,
        )

        let response

        if (category === 'affiliated') {
          // Use affiliates bulk endpoint
          response = await fetch(`${API_BASE_URL}/api/admin/affiliates/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(
              updatedItems.map((item) => ({
                id: item.id,
                src: item.src,
                alt: item.alt || '',
                order: item.order || 0,
                active: item.active !== undefined ? item.active : true,
              })),
            ),
          })
        } else {
          // Use media items bulk endpoint with required subsection
          response = await fetch(
            `${API_BASE_URL}/api/admin/media-items/bulk/${category}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(
                updatedItems.map((item) => ({
                  type: item.type,
                  src: item.src,
                  poster: item.poster || '',
                  before: item.before || '',
                  after: item.after || '',
                  category: category,
                  subsection: subsection || 'default',
                  order: item.order || 0,
                  active: item.active !== undefined ? item.active : true,
                })),
              ),
            },
          )
        }

        if (response.ok) {
          const result = await response.json()

          if (category === 'affiliated') {
            // Handle affiliates response format
            if (result.ok && Array.isArray(result.items)) {
              const formattedItems = result.items.map((item) => ({
                id: item._id,
                type: 'image',
                src: item.src,
                poster: '',
                before: '',
                after: '',
              }))
              setItems(formattedItems)
              onChange(formattedItems)
            }
          } else {
            // Handle media items response format
            if (result.success && Array.isArray(result.data)) {
              const formattedItems = result.data.map((item) => ({
                id: item._id,
                type: item.type,
                src: item.src,
                poster: item.poster || '',
                before: item.before || '',
                after: item.after || '',
              }))
              setItems(formattedItems)
              onChange(formattedItems)
            }
          }

          setEditing(null)
          push('success', 'Saved')
        } else {
          throw new Error('Failed to update')
        }
      } catch (error) {
        console.error('Error updating item:', error)
        push('error', 'Failed to update item')
      } finally {
        setSaving(false)
      }
    } else {
      // Fallback to local state
      setItems((s) =>
        s.map((it) =>
          it.id === edited.id
            ? { ...it, src: ex, poster: edited.poster || it.poster }
            : it,
        ),
      )
      setEditing(null)
      push('success', 'Saved')
    }
  }

  /* Delete flow */
  function requestDelete(id) {
    setConfirmDelete(id)
  }
  async function doDelete() {
    const id = confirmDelete
    if (category) {
      // Delete from backend using bulk save
      setSaving(true)
      try {
        const updatedItems = items
          .filter((it) => it.id !== id)
          .map((item) => ({
            ...item,
            subsection: subsection || 'default',
          }))
        let response
        if (category === 'affiliated') {
          // Use affiliates bulk endpoint
          response = await fetch(`${API_BASE_URL}/api/admin/affiliates/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(
              updatedItems.map((item) => ({
                id: item.id,
                src: item.src,
                alt: item.alt || '',
                order: item.order || 0,
                active: item.active !== undefined ? item.active : true,
              })),
            ),
          })
        } else {
          response = await fetch(
            `${API_BASE_URL}/api/admin/media-items/bulk/${category}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(
                updatedItems.map((item) => ({
                  type: item.type,
                  src: item.src,
                  poster: item.poster || '',
                  before: item.before || '',
                  after: item.after || '',
                  category: category,
                  subsection: subsection || 'default',
                  order: item.order || 0,
                  active: item.active !== undefined ? item.active : true,
                })),
              ),
            },
          )
        }

        if (response.ok) {
          const result = await response.json()

          if (category === 'affiliated') {
            // Handle affiliates response format
            if (result.ok && Array.isArray(result.items)) {
              const formattedItems = result.items.map((item) => ({
                id: item._id,
                type: 'image',
                src: item.src,
                poster: '',
                before: '',
                after: '',
              }))
              setItems(formattedItems)
              onChange(formattedItems)
            }
          } else {
            // Handle media items response format
            if (result.success && Array.isArray(result.data)) {
              const formattedItems = result.data.map((item) => ({
                id: item._id,
                type: item.type,
                src: item.src,
                poster: item.poster || '',
                before: item.before || '',
                after: item.after || '',
              }))
              setItems(formattedItems)
              onChange(formattedItems)
            }
          }

          setConfirmDelete(null)
          push('deleted', 'Deleted')
        } else {
          throw new Error('Failed to delete')
        }
      } catch (error) {
        console.error('Error deleting item:', error)
        push('error', 'Failed to delete item')
      } finally {
        setSaving(false)
      }
    } else {
      // Fallback to local state
      setItems((s) => s.filter((it) => it.id !== id))
      setConfirmDelete(null)
      push('deleted', 'Deleted')
    }
  }

  /* Copy */
  function handleCopy(src) {
    if (!src) return push('error', 'No URL')
    navigator.clipboard
      ?.writeText(src)
      .then(() => push('info', 'Copied to clipboard'))
      .catch(() => push('error', 'Copy failed'))
  }

  function extractSrc(input) {
    if (!input) return ''
    const m = input.match(/src=(?:'|")([^'"]+)(?:'|")/i)
    if (m && m[1]) return m[1].trim()
    return input.trim()
  }

  const placeholder = ''

  /* Toast rendering helpers: map type -> icon/color */
  function renderToastIcon(type) {
    if (type === 'error') return <FiTrash2 className="text-rose-600" />
    if (type === 'success') return <FiCheck className="text-amber-900" />
    if (type === 'deleted') return <FiTrash2 className="text-rose-600" />
    // info or default
    return <FiCopy className="text-slate-800" />
  }

  return (
    <div className="w-full">
      {/* Toasts (top-right) */}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-3 items-end">
        {toasts.map((t) => {
          const isError = t.type === 'error'
          const isSuccess = t.type === 'success'
          const isDeleted = t.type === 'deleted'
          const bgClass = isError
            ? 'bg-rose-50'
            : isSuccess
              ? 'bg-amber-50'
              : isDeleted
                ? 'bg-rose-50'
                : 'bg-slate-900'
          const borderClass = isError
            ? 'border-rose-200'
            : isSuccess
              ? 'border-amber-200'
              : isDeleted
                ? 'border-rose-200'
                : 'border-slate-900'
          const textClass = isError
            ? 'text-rose-700'
            : isSuccess
              ? 'text-amber-900'
              : isDeleted
                ? 'text-rose-700'
                : 'text-white'

          return (
            <div
              key={t.id}
              className={`min-w-[220px] max-w-sm rounded-md px-4 py-2 shadow-md border ${bgClass} ${borderClass}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-none">{renderToastIcon(t.type)}</div>
                <div className={`${textClass} text-sm font-medium`}>
                  {t.msg}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Panel */}
      <div className="rounded-lg bg-white shadow-md border p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold">Media</h3>
            <div className="text-sm text-slate-500">
              Mode: <span className="font-medium text-slate-700">{mode}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {(onSave || category) && (
              <button
                onClick={async () => {
                  if (category) {
                    // Bulk save to backend
                    setSaving(true)
                    try {
                      let response

                      if (category === 'affiliated') {
                        // Use affiliates bulk endpoint
                        response = await fetch(
                          `${API_BASE_URL}/api/admin/affiliates/bulk`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify(
                              items.map((item) => ({
                                id: item.id,
                                src: item.src,
                                alt: item.alt || '',
                                order: item.order || 0,
                                active:
                                  item.active !== undefined
                                    ? item.active
                                    : true,
                              })),
                            ),
                          },
                        )
                      } else {
                        // Use media items bulk endpoint with required subsection
                        response = await fetch(
                          `${API_BASE_URL}/api/admin/media-items/bulk/${category}`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify(
                              items.map((item) => ({
                                type: item.type,
                                src: item.src,
                                poster: item.poster || '',
                                before: item.before || '',
                                after: item.after || '',
                                category: category,
                                subsection: subsection || 'default',
                                order: item.order || 0,
                                active:
                                  item.active !== undefined
                                    ? item.active
                                    : true,
                              })),
                            ),
                          },
                        )
                      }

                      if (response.ok) {
                        const result = await response.json()

                        if (category === 'affiliated') {
                          // Handle affiliates response format
                          if (result.ok && Array.isArray(result.items)) {
                            const formattedItems = result.items.map((item) => ({
                              id: item._id,
                              type: 'image',
                              src: item.src,
                              poster: '',
                              before: '',
                              after: '',
                            }))
                            setItems(formattedItems)
                            onChange(formattedItems)
                          }
                        } else {
                          // Handle media items response format
                          if (result.success && Array.isArray(result.data)) {
                            const formattedItems = result.data.map((item) => ({
                              id: item._id,
                              type: item.type,
                              src: item.src,
                              poster: item.poster || '',
                              before: item.before || '',
                              after: item.after || '',
                            }))
                            setItems(formattedItems)
                            onChange(formattedItems)
                          }
                        }

                        push('success', 'Saved')
                      } else {
                        throw new Error('Failed to save')
                      }
                    } catch (err) {
                      console.error('Bulk save error', err)
                      push('error', err?.message || 'Save failed')
                    } finally {
                      setSaving(false)
                    }
                  } else if (onSave) {
                    // Custom onSave function
                    setSaving(true)
                    try {
                      await onSave(items)
                      push('success', 'Saved')
                    } catch (err) {
                      console.error('onSave error', err)
                      push('error', err?.message || 'Save failed')
                    } finally {
                      setSaving(false)
                    }
                  }
                }}
                disabled={saving || loading}
                className="ml-2 rounded px-2 py-2 text-sm font-medium min-w-20"
                style={{
                  background: primaryColor,
                  opacity: saving || loading ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : loading ? 'Loading...' : 'Save All'}
              </button>
            )}

            {allowAdd && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                {/* Direct upload to Bunny */}
                {category && (
                  <div className="flex w-full sm:w-auto items-center gap-2">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) =>
                        setUploadFile(e.target.files?.[0] || null)
                      }
                      className="max-w-xs text-sm"
                    />
                    <Button
                      disabled={!uploadFile || uploading}
                      onClick={async () => {
                        if (!uploadFile) return
                        try {
                          setUploading(true)
                          const isVideo = uploadFile.type.startsWith('video/')
                          // 1. Request upload URL from backend (pass type)
                          const res = await fetch(
                            `${API_BASE_URL}/api/admin/media-items/generate-upload-url`,
                            {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({
                                category,
                                subsection,
                                originalName: uploadFile.name,
                                type: isVideo ? 'video' : 'image',
                              }),
                            },
                          )
                          const uploadInfo = await res.json()
                          if (
                            !uploadInfo.uploadUrl ||
                            !uploadInfo.uploadHeaders
                          )
                            throw new Error('Failed to get upload URL')

                          if (uploadInfo.isVideo) {
                            // Bunny Stream: POST file as FormData
                            const formData = new FormData()
                            formData.append('file', uploadFile)
                            formData.append('title', uploadFile.name)
                            let videoData = null
                            await new Promise((resolve, reject) => {
                              const xhr = new window.XMLHttpRequest()
                              xhr.open('POST', uploadInfo.uploadUrl, true)
                              Object.entries(uploadInfo.uploadHeaders).forEach(
                                ([k, v]) => xhr.setRequestHeader(k, v),
                              )
                              xhr.onload = function () {
                                if (xhr.status === 201 || xhr.status === 200) {
                                  try { videoData = JSON.parse(xhr.responseText) } catch {}
                                  resolve()
                                } else reject(new Error('Video upload failed'))
                              }
                              xhr.onerror = function () {
                                reject(new Error('Video upload failed'))
                              }
                              xhr.send(formData)
                            })
                            // Save metadata (send guid, backend will construct HLS and poster URLs)
                            const metaRes = await fetch(
                              `${API_BASE_URL}/api/admin/media-items/save-metadata`,
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
                                  description: videoData?.title || uploadFile.name,
                                }),
                              },
                            )
                            const meta = await metaRes.json()
                            if (meta.success && meta.data) {
                              const d = meta.data
                              const newItem = {
                                id: d._id,
                                type: d.type,
                                src: d.src,
                                poster: d.poster || '',
                                before: d.before || '',
                                after: d.after || '',
                                section: d.section || section || category,
                                subsection:
                                  d.subsection || subsection || 'default',
                              }
                              setItems((s) => [newItem, ...s])
                              setUploadFile(null)
                              const inp =
                                document.querySelector('input[type="file"]')
                              if (inp) inp.value = ''
                              push('success', 'Video uploaded to Bunny Stream')
                            } else {
                              throw new Error(meta.error || 'Upload failed')
                            }
                          } else {
                            // Bunny Storage: PUT file
                            await new Promise((resolve, reject) => {
                              const xhr = new window.XMLHttpRequest()
                              xhr.open('PUT', uploadInfo.uploadUrl, true)
                              Object.entries(uploadInfo.uploadHeaders).forEach(
                                ([k, v]) => xhr.setRequestHeader(k, v),
                              )
                              xhr.onload = function () {
                                if (xhr.status === 201 || xhr.status === 200)
                                  resolve()
                                else reject(new Error('Upload failed'))
                              }
                              xhr.onerror = function () {
                                reject(new Error('Upload failed'))
                              }
                              xhr.send(uploadFile)
                            })
                            // Save metadata in backend
                            const metaRes = await fetch(
                              `${API_BASE_URL}/api/admin/media-items/save-metadata`,
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
                              const d = meta.data
                              const newItem = {
                                id: d._id,
                                type: d.type,
                                src: d.src,
                                poster: d.poster || '',
                                before: d.before || '',
                                after: d.after || '',
                                section: d.section || section || category,
                                subsection:
                                  d.subsection || subsection || 'default',
                              }
                              setItems((s) => [newItem, ...s])
                              setUploadFile(null)
                              const inp =
                                document.querySelector('input[type="file"]')
                              if (inp) inp.value = ''
                              push('success', 'Uploaded to Bunny Storage')
                            } else {
                              throw new Error(meta.error || 'Upload failed')
                            }
                          }
                        } catch (err) {
                          console.error('Upload error', err)
                          push('error', err?.message || 'Upload failed')
                        } finally {
                          setUploading(false)
                        }
                      }}
                      className="bg-[#cff000]"
                    >
                      {uploading ? 'Uploading...' : 'Upload to Bunny'}
                    </Button>
                  </div>
                )}
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleInputKeyDown} // Enter adds
                  placeholder={placeholder}
                  className="min-w-0 flex-1 rounded border px-3 py-2 text-sm"
                  aria-label="Media source input"
                />
                {mode === 'video' && (
                  <input
                    value={posterInput}
                    onChange={(e) => setPosterInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        addItem()
                      }
                    }}
                    placeholder="Poster / thumbnail URL (required)"
                    className="min-w-[220px] rounded border px-3 py-2 text-sm"
                    aria-label="Poster url input"
                  />
                )}
                <Button
                  onClick={addItem}
                  className="inline-flex items-center gap-2 bg-[#cff000] hover:brightness-95"
                >
                  <FiPlus /> Add
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {items.length === 0 && (
          <div className="col-span-full py-10 text-center text-sm text-slate-500">
            No media yet. Use the Upload to Bunny control above.
          </div>
        )}

        {items.map((it) => {
          const isVideo = it.type === 'video' || isProbablyVideo(it.src)
          return (
            <div
              key={it.id}
              className="rounded-lg border overflow-hidden bg-white shadow-sm hover:shadow-lg transition-shadow transform hover:-translate-y-1"
            >
              <div className="relative h-44 w-full bg-gray-50">
                {isVideo ? (
                  it.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.poster}
                      alt="poster"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-b from-slate-800 to-slate-900 flex items-center justify-center text-white text-sm">
                      <div className="flex flex-col items-center gap-1">
                        <div className="px-3 py-1 rounded-full bg-black/40 text-xs">
                          VIDEO
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}

                <div className="absolute left-3 top-3">
                  <div
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      isVideo
                        ? 'bg-black/70 text-white'
                        : 'bg-white/90 text-slate-800'
                    }`}
                  >
                    {isVideo ? 'VIDEO' : 'IMAGE'}
                  </div>
                </div>
                {it.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                    {it.title}
                  </div>
                )}
              </div>

              <div className="p-3 flex-1 flex flex-col">
                <div
                  className="text-sm text-slate-700 font-medium truncate"
                  title={it.title || (isVideo ? it.poster || it.src : it.src)}
                >
                  {it.title ||
                    truncate(isVideo ? it.poster || it.src : it.src, 80)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {isVideo ? 'Poster shown; source saved' : 'Image URL'}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {allowEdit && (
                      <button
                        onClick={() => {
                          setEditing({ ...it })
                          setReplaceFile(null)
                          setReplacePosterFile(null)
                        }}
                        className="inline-flex items-center gap-2 rounded border px-2 py-1 text-xs"
                        aria-label="Replace media"
                      >
                        <FiEdit2 /> Replace
                      </button>
                    )}
                    <button
                      onClick={() => handleCopy(it.src)}
                      className="inline-flex items-center gap-2 rounded border px-2 py-1 text-xs"
                      aria-label="Copy URL"
                    >
                      <FiCopy /> Copy
                    </button>
                  </div>

                  {allowDelete && (
                    <button
                      onClick={() => requestDelete(it.id)}
                      className="inline-flex items-center gap-2 rounded border px-2 py-1 text-xs text-rose-600"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete confirm */}
      {/* Replace Dialog */}
      {editing && (
        <AlertDialog open={true} onOpenChange={() => setEditing(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Replace media</AlertDialogTitle>
              <AlertDialogDescription>
                Upload a new file to replace the current item. For videos, you
                can also update the poster.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!replaceFile && !replacePosterFile) return setEditing(null)
                try {
                  setReplacing(true)
                  let updated = editing
                  if (replaceFile) {
                    const form = new FormData()
                    form.append('file', replaceFile)
                    const resp = await fetch(
                      `${API_BASE_URL}/api/admin/media-items/${editing.id}/replace`,
                      { method: 'POST', credentials: 'include', body: form },
                    )
                    const json = await resp.json().catch(() => null)
                    if (!resp.ok || !json?.success)
                      throw new Error(json?.error || 'Replace failed')
                    updated = {
                      id: json.data._id,
                      type: json.data.type,
                      src: json.data.src,
                      poster: json.data.poster || '',
                      before: json.data.before || '',
                      after: json.data.after || '',
                      section: json.data.section || section || category,
                      subsection:
                        json.data.subsection || subsection || 'default',
                    }
                  }
                  if (
                    replacePosterFile &&
                    (editing.type === 'video' || isProbablyVideo(editing.src))
                  ) {
                    const form2 = new FormData()
                    form2.append('poster', replacePosterFile)
                    const resp2 = await fetch(
                      `${API_BASE_URL}/api/admin/media-items/${editing.id}/replace-poster`,
                      { method: 'POST', credentials: 'include', body: form2 },
                    )
                    const json2 = await resp2.json().catch(() => null)
                    if (!resp2.ok || !json2?.success)
                      throw new Error(json2?.error || 'Replace poster failed')
                    updated = {
                      ...updated,
                      poster: json2.data.poster || updated.poster || '',
                    }
                  }

                  setItems((list) =>
                    list.map((it) => (it.id === editing.id ? updated : it)),
                  )
                  setEditing(null)
                  setReplaceFile(null)
                  setReplacePosterFile(null)
                  push('success', 'Updated')
                } catch (err) {
                  console.error('Replace error', err)
                  push('error', err?.message || 'Update failed')
                } finally {
                  setReplacing(false)
                }
              }}
              className="mt-2 space-y-4"
            >
              <div>
                <label
                  className="text-sm text-slate-700 font-medium"
                  htmlFor="replace-file"
                >
                  New file (image or video)
                </label>
                <input
                  id="replace-file"
                  type="file"
                  accept="image/*,video/*"
                  className="mt-1 w-full text-sm"
                  onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                />
              </div>

              {(editing.type === 'video' || isProbablyVideo(editing.src)) && (
                <div>
                  <label
                    className="text-sm text-slate-700 font-medium"
                    htmlFor="replace-poster"
                  >
                    Poster image (optional)
                  </label>
                  <input
                    id="replace-poster"
                    type="file"
                    accept="image/*"
                    className="mt-1 w-full text-sm"
                    onChange={(e) =>
                      setReplacePosterFile(e.target.files?.[0] || null)
                    }
                  />
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <AlertDialogCancel asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    type="submit"
                    className="bg-[#cff000]"
                    disabled={replacing}
                  >
                    {replacing ? 'Saving...' : 'Save changes'}
                  </Button>
                </AlertDialogAction>
              </div>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {confirmDelete && (
        <AlertDialog open={true} onOpenChange={() => setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete item?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this media item?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="mt-4 flex justify-end gap-2">
              <AlertDialogCancel asChild>
                <Button
                  variant="outline"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </Button>
              </AlertDialogCancel>

              <AlertDialogAction asChild>
                <Button onClick={doDelete} className="bg-rose-600 text-white">
                  Delete
                </Button>
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
