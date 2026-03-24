// admin/components/managers/MediaManager.jsx
'use client'
import React, { useEffect, useState, useRef } from 'react'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const [uploading, setUploading] = useState(false)
const [uploadProgress, setUploadProgress] = useState(0)
const fileInputRef = useRef(null)
const beforeFileInputRef = useRef(null)
const afterFileInputRef = useRef(null)
const beforePosterFileInputRef = useRef(null)
const afterPosterFileInputRef = useRef(null)
// Direct upload handler for Bunny Storage/Stream
// admin/components/managers/MediaManager.jsx
'use client'
import React, { useEffect, useState, useRef } from 'react'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const [uploading, setUploading] = useState(false)
const [uploadProgress, setUploadProgress] = useState(0)
const fileInputRef = useRef(null)
const beforeFileInputRef = useRef(null)
const afterFileInputRef = useRef(null)
const beforePosterFileInputRef = useRef(null)
const afterPosterFileInputRef = useRef(null)
// Direct upload handler for Bunny Storage/Stream
async function handleDirectUpload(file, type, onUrl) {
  setUploading(true)
  setUploadProgress(0)
  try {
    // Step 1: Get Bunny config (libraryId, apiKey)
    const configRes = await fetch(`${API_BASE_URL}/api/admin/media-items/config?_t=${Date.now()}`, {
      method: 'GET',
      credentials: 'include',
    })
    const config = await configRes.json()
    if (!config.success || !config.libraryId || !config.apiKey) {
      throw new Error('Failed to get Bunny config')
    }
    // Step 2: Create video (POST to Bunny)
    if (type === 'video') {
      const createRes = await fetch(`https://video.bunnycdn.com/library/${config.libraryId}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          AccessKey: config.apiKey,
        },
        body: JSON.stringify({ title: file.name }),
      })
      if (!createRes.ok) {
        setUploading(false)
        setUploadProgress(0)
        const errText = await createRes.text().catch(() => '')
        pushToast('error', `Bunny create error: ${errText || createRes.status}`)
        return
      }
      const videoData = await createRes.json()
      if (!videoData.guid) {
        setUploading(false)
        setUploadProgress(0)
        pushToast('error', 'No GUID returned from Bunny')
        return
      }
      // Step 3: PUT raw file to Bunny (to /videos/{guid})
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
          // Step 4: Save metadata in backend
          const metaRes = await fetch(`${API_BASE_URL}/api/admin/media-items/save?_t=${Date.now()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              guid: videoData.guid,
              category: title.toLowerCase().replace(/ /g, '_'),
              description: file.name,
            }),
          })
          const meta = await metaRes.json()
          if (meta.success && meta.data && meta.data.src) {
            onUrl(meta.data.src, meta.data.poster)
            pushToast('success', 'Video uploaded')
          } else {
            pushToast('error', meta.error || 'Failed to save video')
          }
        } else {
          let errMsg = 'Video upload failed'
          try {
            errMsg = xhr.responseText || errMsg
          } catch {}
          pushToast('error', errMsg)
        }
      }
      xhr.onerror = function () {
        setUploading(false)
        setUploadProgress(0)
        let errMsg = 'Video upload failed'
        try {
          errMsg = xhr.responseText || errMsg
        } catch {}
        pushToast('error', errMsg)
      }
      xhr.send(file)
    } else {
      // Bunny Storage: (unchanged, legacy flow)
      const res = await fetch(
        `${API_BASE_URL}/api/admin/media-items/generate-upload-url?_t=${Date.now()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            category: title.toLowerCase().replace(/ /g, '_'),
            originalName: file.name,
            type,
          }),
        },
      )
      const uploadInfo = await res.json()
      if (!uploadInfo.uploadUrl || !uploadInfo.uploadHeaders)
        throw new Error('Failed to get upload URL')
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
            `${API_BASE_URL}/api/admin/media-items/save-metadata?_t=${Date.now()}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                type: 'image',
                src: uploadInfo.cdnUrl,
                category: title.toLowerCase().replace(/ /g, '_'),
              }),
            },
          )
          const meta = await metaRes.json()
          if (meta.success && meta.data && meta.data.src) {
            onUrl(meta.data.src)
            pushToast('success', 'Image uploaded')
          } else {
            pushToast('error', meta.error || 'Failed to save image')
          }
        } else {
          pushToast('error', 'Image upload failed')
        }
      }
      xhr.onerror = function () {
        setUploading(false)
        setUploadProgress(0)
        pushToast('error', 'Image upload failed')
      }
      xhr.send(file)
    }
  } catch (error) {
    setUploading(false)
    setUploadProgress(0)
    pushToast('error', error.message || 'Upload failed')
  }
}
import { FiCheck, FiCopy, FiTrash2, FiInfo } from 'react-icons/fi'

const PRIMARY = '#cff000'

function isValidUrl(s) {
  if (!s || typeof s !== 'string') return false
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// helper to truncate long URLs for display
function truncate(s, n = 48) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n - 3) + '...' : s
}

export default function MediaManager({
  title = 'Media',
  placeholder = 'Paste CDN link here',
  initial = [],
  beforeAfter = false, // if true, manager expects before+after pairs
  onSave = async (items) => {
    console.log('save', items)
  },
}) {
  // items: if beforeAfter === false -> [{id, src, ...}]
  // if beforeAfter === true -> [{ id, before, after, beforePoster, afterPoster, ... }]
  const [items, setItems] = useState(initial || [])
  const [input, setInput] = useState('') // for single mode

  // UPDATED: Added dedicated state for Before/After poster inputs
  const [beforeInput, setBeforeInput] = useState('') // for BA video link
  const [afterInput, setAfterInput] = useState('') // for BA video link
  const [beforePosterInput, setBeforePosterInput] = useState('') // for BA image link
  const [afterPosterInput, setAfterPosterInput] = useState('') // for BA image link

  const [editing, setEditing] = useState(null) // {id, type: "single"|"ba", ...}
  const [toastStack, setToastStack] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)

  // FIX: Synchronize internal state with parent prop updates (Crucial for OurWorkManager)
  useEffect(() => {
    if (initial) {
      setItems(initial)
    }
  }, [initial])

  useEffect(() => {
    // auto-dismiss toasts
    if (!toastStack.length) return
    const timers = toastStack.map((t) =>
      setTimeout(() => removeToast(t.id), 3000),
    )
    return () => timers.forEach((t) => clearTimeout(t))
  }, [toastStack.length])

  function pushToast(type, msg) {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToastStack((s) => [{ id, type, msg }, ...s])
  }
  function removeToast(id) {
    setToastStack((s) => s.filter((t) => t.id !== id))
  }

  /* ---- Add / Save / Delete logic ---- */

  function addItem() {
    if (beforeAfter) {
      if (
        !beforeInput ||
        !afterInput ||
        !beforePosterInput ||
        !afterPosterInput
      ) {
        pushToast(
          'error',
          'All four links (Before/After Video and Posters) are required.',
        )
        return
      }
      if (
        !isValidUrl(beforeInput) ||
        !isValidUrl(afterInput) ||
        !isValidUrl(beforePosterInput) ||
        !isValidUrl(afterPosterInput)
      ) {
        pushToast('error', 'Enter valid http/https links for all fields.')
        return
      }
      const newItem = {
        id: Date.now(),
        before: beforeInput.trim(),
        after: afterInput.trim(),
        beforePoster: beforePosterInput.trim(),
        afterPoster: afterPosterInput.trim(),
      }
      setItems((s) => [newItem, ...s])
      setBeforeInput('')
      setAfterInput('')
      setBeforePosterInput('')
      setAfterPosterInput('')
      pushToast('success', 'Pair added')
      return
    }

    // Single item logic (unchanged)
    if (!input) {
      pushToast('error', 'Please enter a link.')
      return
    }
    if (!isValidUrl(input)) {
      pushToast('error', 'Enter a valid http/https link.')
      return
    }
    const newItem = { id: Date.now(), src: input.trim() }
    setItems((s) => [newItem, ...s])
    setInput('')
    pushToast('success', 'Item added')
  }

  // Enter key handlers (accessibility)
  function handleInputKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addItem()
    }
  }
  function handleBeforeAfterKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addItem()
    }
  }

  function startEdit(item) {
    if (beforeAfter) {
      // Initialize editing state for BA with the four fields
      setEditing({
        type: 'ba',
        ...item,
        before: item.before,
        after: item.after,
        beforePoster: item.beforePoster || '',
        afterPoster: item.afterPoster || '',
      })
    } else {
      setEditing({ type: 'single', ...item })
    }
  }

  function saveEditSingle(id, newSrc) {
    const old = items.find((it) => it.id === id)
    const clean = newSrc ? newSrc.trim() : ''
    if (!clean) {
      pushToast('error', 'Please enter a link.')
      return
    }
    if (!isValidUrl(clean)) {
      pushToast('error', 'Enter a valid http/https link.')
      return
    }
    if (old && old.src === clean) {
      pushToast('info', 'No changes detected')
      setEditing(null)
      return
    }
    setItems((s) => s.map((it) => (it.id === id ? { ...it, src: clean } : it)))
    setEditing(null)
    pushToast('success', 'Item updated')
  }

  // UPDATED: BA Save function now takes all four fields
  function saveEditBA(id, before, after, beforePoster, afterPoster) {
    const old = items.find((it) => it.id === id)
    const b = before ? before.trim() : ''
    const a = after ? after.trim() : ''
    const bp = beforePoster ? beforePoster.trim() : ''
    const ap = afterPoster ? afterPoster.trim() : ''

    if (!b || !a || !bp || !ap) {
      pushToast('error', 'All four links required.')
      return
    }
    if (
      !isValidUrl(b) ||
      !isValidUrl(a) ||
      !isValidUrl(bp) ||
      !isValidUrl(ap)
    ) {
      pushToast('error', 'Enter valid http/https links for all fields.')
      return
    }
    if (
      old &&
      old.before === b &&
      old.after === a &&
      old.beforePoster === bp &&
      old.afterPoster === ap
    ) {
      pushToast('info', 'No changes detected')
      setEditing(null)
      return
    }
    setItems((s) =>
      s.map((it) =>
        it.id === id
          ? { ...it, before: b, after: a, beforePoster: bp, afterPoster: ap }
          : it,
      ),
    )
    setEditing(null)
    pushToast('success', 'Pair updated')
  }

  function requestDelete(id) {
    setConfirmDelete(id)
  }
  function cancelDelete() {
    setConfirmDelete(null)
  }
  function doDelete() {
    if (!confirmDelete) return
    setItems((s) => s.filter((it) => it.id !== confirmDelete))
    setConfirmDelete(null)
    pushToast('deleted', 'Deleted')
  }

  async function handleSaveAll() {
    try {
      await onSave(items)
      pushToast('success', 'Saved')
    } catch (err) {
      console.error(err)
      pushToast('error', 'Save failed')
    }
  }

  /* ---- UI rendering ---- */

  // toast visuals (neutral / accessible)
  function Toast({ t }) {
    const isError = t.type === 'error'
    const isSuccess = t.type === 'success'
    const isDeleted = t.type === 'deleted'
    const bg = isError
      ? 'bg-rose-50'
      : isSuccess
        ? 'bg-emerald-50'
        : isDeleted
          ? 'bg-rose-50'
          : 'bg-slate-900'
    const border = isError
      ? 'border-rose-200'
      : isSuccess
        ? 'border-emerald-200'
        : isDeleted
          ? 'border-rose-200'
          : 'border-slate-900'
    const txt = isError
      ? 'text-rose-700'
      : isSuccess
        ? 'text-emerald-900'
        : isDeleted
          ? 'text-rose-700'
          : 'text-white'

    const Icon = isError
      ? FiTrash2
      : isSuccess
        ? FiCheck
        : isDeleted
          ? FiTrash2
          : FiInfo

    return (
      <div
        className={`min-w-[220px] max-w-sm rounded-md px-4 py-2 shadow-md border ${bg} ${border}`}
      >
        <div className="flex items-center gap-3">
          <div className={`${txt}`}>
            <Icon />
          </div>
          <div className={`${txt} text-sm font-medium`}>{t.msg}</div>
        </div>
      </div>
    )
  }

  /* before/after preview card styling improved */
  function BeforeAfterCard({ item }) {
    // FIX: Use Poster images for preview, fallback to video links
    const srcBefore = item.beforePoster || item.before
    const srcAfter = item.afterPoster || item.after

    return (
      <div className="rounded-lg overflow-hidden border bg-white shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 p-2 pb-0">
          <div className="relative aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={srcBefore}
              alt="Before"
              className="object-cover w-full h-full"
            />
            <div className="absolute left-2 bottom-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              Before
            </div>
          </div>
          <div className="relative aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={srcAfter}
              alt="After"
              className="object-cover w-full h-full"
            />
            <div className="absolute left-2 bottom-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              After
            </div>
          </div>
        </div>

        <div className="p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {/* Truncate the combined URL display */}
            <div
              className="text-sm font-medium truncate"
              title={`Before: ${item.before} | After: ${item.after}`}
            >
              {truncate(item.before + ' — ' + item.after, 80)}
            </div>
            <div className="text-xs text-slate-400">Pair preview</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => startEdit(item)}
              className="rounded px-3 py-1 border text-xs bg-white hover:bg-slate-50"
              aria-label="Edit pair"
            >
              Edit
            </button>

            <button
              onClick={() => requestDelete(item.id)}
              className="rounded px-3 py-1 border text-xs text-rose-600 bg-white hover:bg-rose-50"
              aria-label="Delete pair"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* single preview card */
  function SingleCard({ it }) {
    return (
      <div className="rounded-lg overflow-hidden border bg-white shadow-sm">
        <div className="relative aspect-square bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.src} alt="" className="object-cover w-full h-full" />
          <div className="absolute left-2 bottom-2 bg-white/90 text-slate-800 text-xs px-2 py-1 rounded">
            Image
          </div>
        </div>

        <div className="p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" title={it.src}>
              {truncate(it.src, 80)}
            </div>
            <div className="text-xs text-slate-400">Image URL</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => startEdit(it)}
              className="rounded px-3 py-1 border text-xs bg-white hover:bg-slate-50"
              aria-label="Edit image"
            >
              Edit
            </button>
            <button
              onClick={() => requestDelete(it.id)}
              className="rounded px-3 py-1 border text-xs text-rose-600 bg-white hover:bg-rose-50"
              aria-label="Delete image"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm max-w-7xl mx-auto">
      {/* Toasts top-right */}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2 items-end">
        {toastStack.map((t) => (
          <Toast key={t.id} t={t} />
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-sm text-slate-500">
            Manage media —{' '}
            {beforeAfter ? 'Before / After pairs' : 'Single media items'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveAll}
            className="rounded bg-[#cff000] px-3 py-1 text-sm font-semibold"
          >
            Save All
          </button>
        </div>
      </div>

      {/* Add inputs with file upload */}
      <div className="mb-6">
        {beforeAfter ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
            {/* Input 1: Before Video Link */}
            <div>
              <label className="text-xs text-slate-600 block mb-1">
                Before Video link
              </label>
              <div className="flex gap-2">
                <input
                  value={beforeInput}
                  onChange={(e) => setBeforeInput(e.target.value)}
                  onKeyDown={handleBeforeAfterKeyDown}
                  placeholder="https://cdn.example.com/before.m3u8"
                  className="w-full rounded border px-3 py-2"
                  aria-label="Before link"
                />
                <input
                  type="file"
                  accept="video/*"
                  ref={beforeFileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file)
                      handleDirectUpload(file, 'video', (url, poster) => {
                        setBeforeInput(url)
                      })
                  }}
                />
                <button
                  type="button"
                  className="rounded bg-[#cff000] px-2 py-1 font-semibold"
                  onClick={() => beforeFileInputRef.current?.click()}
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Input 2: After Video Link */}
            <div>
              <label className="text-xs text-slate-600 block mb-1">
                After Video link
              </label>
              <div className="flex gap-2">
                <input
                  value={afterInput}
                  onChange={(e) => setAfterInput(e.target.value)}
                  onKeyDown={handleBeforeAfterKeyDown}
                  placeholder="https://cdn.example.com/after.m3u8"
                  className="w-full rounded border px-3 py-2"
                  aria-label="After link"
                />
                <input
                  type="file"
                  accept="video/*"
                  ref={afterFileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file)
                      handleDirectUpload(file, 'video', (url, poster) => {
                        setAfterInput(url)
                      })
                  }}
                />
                <button
                  type="button"
                  className="rounded bg-[#cff000] px-2 py-1 font-semibold"
                  onClick={() => afterFileInputRef.current?.click()}
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Input 3: Before Poster Link */}
            <div>
              <label className="text-xs text-slate-600 block mb-1">
                Before Poster link
              </label>
              <div className="flex gap-2">
                <input
                  value={beforePosterInput}
                  onChange={(e) => setBeforePosterInput(e.target.value)}
                  onKeyDown={handleBeforeAfterKeyDown}
                  placeholder="https://cdn.example.com/before_thumb.jpg"
                  className="w-full rounded border px-3 py-2"
                  aria-label="Before Poster link"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={beforePosterFileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file)
                      handleDirectUpload(file, 'image', (url) => {
                        setBeforePosterInput(url)
                      })
                  }}
                />
                <button
                  type="button"
                  className="rounded bg-[#cff000] px-2 py-1 font-semibold"
                  onClick={() => beforePosterFileInputRef.current?.click()}
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Input 4: After Poster Link */}
            <div>
              <label className="text-xs text-slate-600 block mb-1">
                After Poster link
              </label>
              <div className="flex gap-2">
                <input
                  value={afterPosterInput}
                  onChange={(e) => setAfterPosterInput(e.target.value)}
                  onKeyDown={handleBeforeAfterKeyDown}
                  placeholder="https://cdn.example.com/after_thumb.jpg"
                  className="w-full rounded border px-3 py-2"
                  aria-label="After Poster link"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={afterPosterFileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file)
                      handleDirectUpload(file, 'image', (url) => {
                        setAfterPosterInput(url)
                      })
                  }}
                />
                <button
                  type="button"
                  className="rounded bg-[#cff000] px-2 py-1 font-semibold"
                  onClick={() => afterPosterFileInputRef.current?.click()}
                >
                  Upload
                </button>
              </div>
            </div>

            <div className="md:col-span-4 flex gap-2 justify-end">
              <button
                onClick={addItem}
                className="rounded bg-[#cff000] px-4 py-2 font-semibold"
              >
                Add Pair
              </button>
              <button
                onClick={() => {
                  setBeforeInput('')
                  setAfterInput('')
                  setBeforePosterInput('')
                  setAfterPosterInput('')
                  pushToast('success', 'Cleared')
                }}
                className="rounded border px-4 py-2"
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1">
              <label className="text-xs text-slate-600 block mb-1">
                CDN link
              </label>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={placeholder}
                  className="w-full rounded border px-3 py-2"
                  aria-label="Media link input"
                />
                <input
                  type="file"
                  accept="image/*,video/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const isVideo = file.type.startsWith('video/')
                      handleDirectUpload(
                        file,
                        isVideo ? 'video' : 'image',
                        (url) => {
                          setInput(url)
                        },
                      )
                    }
                  }}
                />
                <button
                  type="button"
                  className="rounded bg-[#cff000] px-2 py-1 font-semibold"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={addItem}
                className="rounded bg-[#cff000] px-4 py-2 font-semibold"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setInput('')
                  pushToast('success', 'Cleared')
                }}
                className="rounded border px-4 py-2"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Items grid */}
      {beforeAfter ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.length === 0 && (
            <div className="text-sm text-slate-500">No pairs yet.</div>
          )}
          {items.map((it) => (
            <BeforeAfterCard key={it.id} item={it} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.length === 0 && (
            <div className="text-sm text-slate-500">No items yet.</div>
          )}
          {items.map((it) => (
            <SingleCard key={it.id} it={it} />
          ))}
        </div>
      )}

      {/* Edit modal for BA items */}
      {editing && editing.type === 'ba' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg overflow-hidden bg-white shadow-lg">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-900 text-white">
              <div className="text-lg font-semibold">Edit Before / After</div>
              <button
                onClick={() => setEditing(null)}
                className="rounded px-2 py-1 border border-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              {/* images row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="h-48 w-full overflow-hidden rounded bg-gray-100">
                    {/* Use the new beforePoster field for preview */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editing.beforePoster || editing.before}
                      alt="before"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-2 text-sm text-slate-700 font-semibold">
                    Before Preview
                  </div>
                </div>

                <div className="text-center">
                  <div className="h-48 w-full overflow-hidden rounded bg-gray-100">
                    {/* Use the new afterPoster field for preview */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editing.afterPoster || editing.after}
                      alt="after"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-2 text-sm text-slate-700 font-semibold">
                    After Preview
                  </div>
                </div>
              </div>

              {/* editable inputs below images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before Video Link */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Before Video Link (SRC)
                  </label>
                  <input
                    value={editing.before}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, before: e.target.value }))
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="e.g., video.m3u8"
                  />
                </div>

                {/* After Video Link */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    After Video Link (SRC)
                  </label>
                  <input
                    value={editing.after}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, after: e.target.value }))
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="e.g., video.m3u8"
                  />
                </div>

                {/* Before Poster Link */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Before Poster Link
                  </label>
                  <input
                    value={editing.beforePoster}
                    onChange={(e) =>
                      setEditing((p) => ({
                        ...p,
                        beforePoster: e.target.value,
                      }))
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="e.g., thumbnail.jpg"
                  />
                </div>

                {/* After Poster Link */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    After Poster Link
                  </label>
                  <input
                    value={editing.afterPoster}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, afterPoster: e.target.value }))
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="e.g., thumbnail.jpg"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => setEditing(null)}
                    className="rounded px-4 py-2 border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      saveEditBA(
                        editing.id,
                        editing.before,
                        editing.after,
                        editing.beforePoster,
                        editing.afterPoster,
                      )
                    }
                    className="rounded px-4 py-2 bg-[#cff000]"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded bg-white p-5 shadow">
            <div className="text-lg font-semibold mb-2">Delete item?</div>
            <div className="text-sm text-gray-600 mb-4">
              Are you sure you want to permanently delete this item? This cannot
              be undone.
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="rounded px-3 py-1 border"
              >
                Cancel
              </button>
              <button
                onClick={doDelete}
                className="rounded px-3 py-1 bg-rose-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { FiCheck, FiCopy, FiTrash2, FiInfo } from 'react-icons/fi'

const PRIMARY = '#cff000'

function isValidUrl(s) {
  if (!s || typeof s !== 'string') return false
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// helper to truncate long URLs for display
function truncate(s, n = 48) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n - 3) + '...' : s
}

export default function MediaManager({
  title = 'Media',
  placeholder = 'Paste CDN link here',
  initial = [],
  beforeAfter = false, // if true, manager expects before+after pairs
  onSave = async (items) => {
    console.log('save', items)
  },
}) {
  // items: if beforeAfter === false -> [{id, src, ...}]
  // if beforeAfter === true -> [{ id, before, after, beforePoster, afterPoster, ... }]
  const [items, setItems] = useState(initial || [])
  const [input, setInput] = useState('') // for single mode

  // UPDATED: Added dedicated state for Before/After poster inputs
  const [beforeInput, setBeforeInput] = useState('') // for BA video link
  const [afterInput, setAfterInput] = useState('') // for BA video link
  const [beforePosterInput, setBeforePosterInput] = useState('') // for BA image link
  const [afterPosterInput, setAfterPosterInput] = useState('') // for BA image link

  const [editing, setEditing] = useState(null) // {id, type: "single"|"ba", ...}
  const [toastStack, setToastStack] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)

  // FIX: Synchronize internal state with parent prop updates (Crucial for OurWorkManager)
  useEffect(() => {
    if (initial) {
      setItems(initial)
    }
  }, [initial])

  useEffect(() => {
    // auto-dismiss toasts
    if (!toastStack.length) return
    const timers = toastStack.map((t) =>
      setTimeout(() => removeToast(t.id), 3000),
    )
    return () => timers.forEach((t) => clearTimeout(t))
  }, [toastStack.length])

  function pushToast(type, msg) {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToastStack((s) => [{ id, type, msg }, ...s])
  }
  function removeToast(id) {
    setToastStack((s) => s.filter((t) => t.id !== id))
  }

  /* ---- Add / Save / Delete logic ---- */

  function addItem() {
    if (beforeAfter) {
      if (
        !beforeInput ||
        !afterInput ||
        !beforePosterInput ||
        !afterPosterInput
      ) {
        pushToast(
          'error',
          'All four links (Before/After Video and Posters) are required.',
        )
        return
      }
      if (
        !isValidUrl(beforeInput) ||
        !isValidUrl(afterInput) ||
        !isValidUrl(beforePosterInput) ||
        !isValidUrl(afterPosterInput)
      ) {
        pushToast('error', 'Enter valid http/https links for all fields.')
        return
      }
      const newItem = {
        id: Date.now(),
        before: beforeInput.trim(),
        after: afterInput.trim(),
        beforePoster: beforePosterInput.trim(),
        afterPoster: afterPosterInput.trim(),
      }
      setItems((s) => [newItem, ...s])
      setBeforeInput('')
      setAfterInput('')
      setBeforePosterInput('')
      setAfterPosterInput('')
      pushToast('success', 'Pair added')
      return
    }

    // Single item logic (unchanged)
    if (!input) {
      pushToast('error', 'Please enter a link.')
      return
    }
    if (!isValidUrl(input)) {
      pushToast('error', 'Enter a valid http/https link.')
      return
    }
    const newItem = { id: Date.now(), src: input.trim() }
    setItems((s) => [newItem, ...s])
    setInput('')
    pushToast('success', 'Item added')
  }

  // Enter key handlers (accessibility)
  function handleInputKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addItem()
    }
  }
  function handleBeforeAfterKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addItem()
    }
  }

  function startEdit(item) {
    if (beforeAfter) {
      // Initialize editing state for BA with the four fields
      setEditing({
        type: 'ba',
        ...item,
        before: item.before,
        after: item.after,
        beforePoster: item.beforePoster || '',
        afterPoster: item.afterPoster || '',
      })
    } else {
      setEditing({ type: 'single', ...item })
    }
  }

  function saveEditSingle(id, newSrc) {
    const old = items.find((it) => it.id === id)
    const clean = newSrc ? newSrc.trim() : ''
    if (!clean) {
      pushToast('error', 'Please enter a link.')
      return
    }
    if (!isValidUrl(clean)) {
      pushToast('error', 'Enter a valid http/https link.')
      return
    }
    if (old && old.src === clean) {
      pushToast('info', 'No changes detected')
      setEditing(null)
      return
    }
    setItems((s) => s.map((it) => (it.id === id ? { ...it, src: clean } : it)))
    setEditing(null)
    pushToast('success', 'Item updated')
  }

  // UPDATED: BA Save function now takes all four fields
  function saveEditBA(id, before, after, beforePoster, afterPoster) {
    const old = items.find((it) => it.id === id)
    const b = before ? before.trim() : ''
    const a = after ? after.trim() : ''
    const bp = beforePoster ? beforePoster.trim() : ''
    const ap = afterPoster ? afterPoster.trim() : ''

    if (!b || !a || !bp || !ap) {
      pushToast('error', 'All four links required.')
      return
    }
    if (
      !isValidUrl(b) ||
      !isValidUrl(a) ||
      !isValidUrl(bp) ||
      !isValidUrl(ap)
    ) {
      pushToast('error', 'Enter valid http/https links for all fields.')
      return
    }
    if (
      old &&
      old.before === b &&
      old.after === a &&
      old.beforePoster === bp &&
      old.afterPoster === ap
    ) {
      pushToast('info', 'No changes detected')
      setEditing(null)
      return
    }
    setItems((s) =>
      s.map((it) =>
        it.id === id
          ? { ...it, before: b, after: a, beforePoster: bp, afterPoster: ap }
          : it,
      ),
    )
    setEditing(null)
    pushToast('success', 'Pair updated')
  }

  function requestDelete(id) {
    setConfirmDelete(id)
  }
  function cancelDelete() {
    setConfirmDelete(null)
  }
  function doDelete() {
    if (!confirmDelete) return
    setItems((s) => s.filter((it) => it.id !== confirmDelete))
    setConfirmDelete(null)
    pushToast('deleted', 'Deleted')
  }

  async function handleSaveAll() {
    try {
      await onSave(items)
      pushToast('success', 'Saved')
    } catch (err) {
      console.error(err)
      pushToast('error', 'Save failed')
    }
  }

  /* ---- UI rendering ---- */

  // toast visuals (neutral / accessible)
  function Toast({ t }) {
    const isError = t.type === 'error'
    const isSuccess = t.type === 'success'
    const isDeleted = t.type === 'deleted'
    const bg = isError
      ? 'bg-rose-50'
      : isSuccess
        ? 'bg-emerald-50'
        : isDeleted
          ? 'bg-rose-50'
          : 'bg-slate-900'
    const border = isError
      ? 'border-rose-200'
      : isSuccess
        ? 'border-emerald-200'
        : isDeleted
          ? 'border-rose-200'
          : 'border-slate-900'
    const txt = isError
      ? 'text-rose-700'
      : isSuccess
        ? 'text-emerald-900'
        : isDeleted
          ? 'text-rose-700'
          : 'text-white'

    const Icon = isError
      ? FiTrash2
      : isSuccess
        ? FiCheck
        : isDeleted
          ? FiTrash2
          : FiInfo

    return (
      <div
        className={`min-w-[220px] max-w-sm rounded-md px-4 py-2 shadow-md border ${bg} ${border}`}
      >
        <div className="flex items-center gap-3">
          <div className={`${txt}`}>
            <Icon />
          </div>
          <div className={`${txt} text-sm font-medium`}>{t.msg}</div>
        </div>
      </div>
    )
  }

  /* before/after preview card styling improved */
  function BeforeAfterCard({ item }) {
    // FIX: Use Poster images for preview, fallback to video links
    const srcBefore = item.beforePoster || item.before
    const srcAfter = item.afterPoster || item.after

    return (
      <div className="rounded-lg overflow-hidden border bg-white shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 p-2 pb-0">
          <div className="relative aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={srcBefore}
              alt="Before"
              className="object-cover w-full h-full"
            />
            <div className="absolute left-2 bottom-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              Before
            </div>
          </div>
          <div className="relative aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={srcAfter}
              alt="After"
              className="object-cover w-full h-full"
            />
            <div className="absolute left-2 bottom-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              After
            </div>
          </div>
        </div>

        <div className="p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {/* Truncate the combined URL display */}
            <div
              className="text-sm font-medium truncate"
              title={`Before: ${item.before} | After: ${item.after}`}
            >
              {truncate(item.before + ' — ' + item.after, 80)}
            </div>
            <div className="text-xs text-slate-400">Pair preview</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => startEdit(item)}
              className="rounded px-3 py-1 border text-xs bg-white hover:bg-slate-50"
              aria-label="Edit pair"
            >
              Edit
            </button>

            <button
              onClick={() => requestDelete(item.id)}
              className="rounded px-3 py-1 border text-xs text-rose-600 bg-white hover:bg-rose-50"
              aria-label="Delete pair"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* single preview card */
  function SingleCard({ it }) {
    return (
      <div className="rounded-lg overflow-hidden border bg-white shadow-sm">
        <div className="relative aspect-square bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.src} alt="" className="object-cover w-full h-full" />
          <div className="absolute left-2 bottom-2 bg-white/90 text-slate-800 text-xs px-2 py-1 rounded">
            Image
          </div>
        </div>

        <div className="p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" title={it.src}>
              {truncate(it.src, 80)}
            </div>
            <div className="text-xs text-slate-400">Image URL</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => startEdit(it)}
              className="rounded px-3 py-1 border text-xs bg-white hover:bg-slate-50"
              aria-label="Edit image"
            >
              Edit
            </button>
            <button
              onClick={() => requestDelete(it.id)}
              className="rounded px-3 py-1 border text-xs text-rose-600 bg-white hover:bg-rose-50"
              aria-label="Delete image"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm max-w-7xl mx-auto">
      {/* Toasts top-right */}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2 items-end">
        {toastStack.map((t) => (
          <Toast key={t.id} t={t} />
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-sm text-slate-500">
            Manage media —{' '}
            {beforeAfter ? 'Before / After pairs' : 'Single media items'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveAll}
            className="rounded bg-[#cff000] px-3 py-1 text-sm font-semibold"
          >
            Save All
          </button>
        </div>
      </div>

      {/* Add inputs with file upload */}
      <div className="mb-6">
        {beforeAfter ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
            {/* Input 1: Before Video Link */}
            <div>
              <label className="text-xs text-slate-600 block mb-1">
                Before Video link
              </label>
              <div className="flex gap-2">
                <input
                  value={beforeInput}
                  onChange={(e) => setBeforeInput(e.target.value)}
                  onKeyDown={handleBeforeAfterKeyDown}
                  placeholder="https://cdn.example.com/before.m3u8"
                  className="w-full rounded border px-3 py-2"
                  aria-label="Before link"
                />
                <input
                  type="file"
                  accept="video/*"
                  ref={beforeFileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file)
                      handleDirectUpload(file, 'video', (url, poster) => {
                        setBeforeInput(url)
                      })
                  }}
                />
                <button
                  type="button"
                  className="rounded bg-[#cff000] px-2 py-1 font-semibold"
                  onClick={() => beforeFileInputRef.current?.click()}
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Input 2: After Video Link */}
            <div>
              <label className="text-xs text-slate-600 block mb-1">
                After Video link
              </label>
              <div className="flex gap-2">
                <input
                  value={afterInput}
                  onChange={(e) => setAfterInput(e.target.value)}
                  onKeyDown={handleBeforeAfterKeyDown}
                  placeholder="https://cdn.example.com/after.m3u8"
                  className="w-full rounded border px-3 py-2"
                  aria-label="After link"
                />
                <input
                  type="file"
                  accept="video/*"
                  ref={afterFileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file)
                      handleDirectUpload(file, 'video', (url, poster) => {
                        setAfterInput(url)
                      })
                  }}
                />
                <button
                  type="button"
                  className="rounded bg-[#cff000] px-2 py-1 font-semibold"
                  onClick={() => afterFileInputRef.current?.click()}
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Input 3: Before Poster Link */}
            <div>
              <label className="text-xs text-slate-600 block mb-1">
                Before Poster link
              </label>
              <div className="flex gap-2">
                <input
                  value={beforePosterInput}
                  onChange={(e) => setBeforePosterInput(e.target.value)}
                  onKeyDown={handleBeforeAfterKeyDown}
                  placeholder="https://cdn.example.com/before_thumb.jpg"
                  className="w-full rounded border px-3 py-2"
                  aria-label="Before Poster link"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={beforePosterFileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file)
                      handleDirectUpload(file, 'image', (url) => {
                        setBeforePosterInput(url)
                      })
                  }}
                />
                <button
                  type="button"
                  className="rounded bg-[#cff000] px-2 py-1 font-semibold"
                  onClick={() => beforePosterFileInputRef.current?.click()}
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Input 4: After Poster Link */}
            <div>
              <label className="text-xs text-slate-600 block mb-1">
                After Poster link
              </label>
              <div className="flex gap-2">
                <input
                  value={afterPosterInput}
                  onChange={(e) => setAfterPosterInput(e.target.value)}
                  onKeyDown={handleBeforeAfterKeyDown}
                  placeholder="https://cdn.example.com/after_thumb.jpg"
                  className="w-full rounded border px-3 py-2"
                  aria-label="After Poster link"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={afterPosterFileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file)
                      handleDirectUpload(file, 'image', (url) => {
                        setAfterPosterInput(url)
                      })
                  }}
                />
                <button
                  type="button"
                  className="rounded bg-[#cff000] px-2 py-1 font-semibold"
                  onClick={() => afterPosterFileInputRef.current?.click()}
                >
                  Upload
                </button>
              </div>
            </div>

            <div className="md:col-span-4 flex gap-2 justify-end">
              <button
                onClick={addItem}
                className="rounded bg-[#cff000] px-4 py-2 font-semibold"
              >
                Add Pair
              </button>
              <button
                onClick={() => {
                  setBeforeInput('')
                  setAfterInput('')
                  setBeforePosterInput('')
                  setAfterPosterInput('')
                  pushToast('success', 'Cleared')
                }}
                className="rounded border px-4 py-2"
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1">
              <label className="text-xs text-slate-600 block mb-1">
                CDN link
              </label>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={placeholder}
                  className="w-full rounded border px-3 py-2"
                  aria-label="Media link input"
                />
                <input
                  type="file"
                  accept="image/*,video/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const isVideo = file.type.startsWith('video/')
                      handleDirectUpload(
                        file,
                        isVideo ? 'video' : 'image',
                        (url) => {
                          setInput(url)
                        },
                      )
                    }
                  }}
                />
                <button
                  type="button"
                  className="rounded bg-[#cff000] px-2 py-1 font-semibold"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={addItem}
                className="rounded bg-[#cff000] px-4 py-2 font-semibold"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setInput('')
                  pushToast('success', 'Cleared')
                }}
                className="rounded border px-4 py-2"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Items grid */}
      {beforeAfter ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.length === 0 && (
            <div className="text-sm text-slate-500">No pairs yet.</div>
          )}
          {items.map((it) => (
            <BeforeAfterCard key={it.id} item={it} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.length === 0 && (
            <div className="text-sm text-slate-500">No items yet.</div>
          )}
          {items.map((it) => (
            <SingleCard key={it.id} it={it} />
          ))}
        </div>
      )}

      {/* Edit modal for BA items */}
      {editing && editing.type === 'ba' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg overflow-hidden bg-white shadow-lg">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-900 text-white">
              <div className="text-lg font-semibold">Edit Before / After</div>
              <button
                onClick={() => setEditing(null)}
                className="rounded px-2 py-1 border border-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              {/* images row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="h-48 w-full overflow-hidden rounded bg-gray-100">
                    {/* Use the new beforePoster field for preview */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editing.beforePoster || editing.before}
                      alt="before"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-2 text-sm text-slate-700 font-semibold">
                    Before Preview
                  </div>
                </div>

                <div className="text-center">
                  <div className="h-48 w-full overflow-hidden rounded bg-gray-100">
                    {/* Use the new afterPoster field for preview */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editing.afterPoster || editing.after}
                      alt="after"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-2 text-sm text-slate-700 font-semibold">
                    After Preview
                  </div>
                </div>
              </div>

              {/* editable inputs below images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before Video Link */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Before Video Link (SRC)
                  </label>
                  <input
                    value={editing.before}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, before: e.target.value }))
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="e.g., video.m3u8"
                  />
                </div>

                {/* After Video Link */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    After Video Link (SRC)
                  </label>
                  <input
                    value={editing.after}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, after: e.target.value }))
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="e.g., video.m3u8"
                  />
                </div>

                {/* Before Poster Link */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Before Poster Link
                  </label>
                  <input
                    value={editing.beforePoster}
                    onChange={(e) =>
                      setEditing((p) => ({
                        ...p,
                        beforePoster: e.target.value,
                      }))
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="e.g., thumbnail.jpg"
                  />
                </div>

                {/* After Poster Link */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    After Poster Link
                  </label>
                  <input
                    value={editing.afterPoster}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, afterPoster: e.target.value }))
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="e.g., thumbnail.jpg"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => setEditing(null)}
                    className="rounded px-4 py-2 border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      saveEditBA(
                        editing.id,
                        editing.before,
                        editing.after,
                        editing.beforePoster,
                        editing.afterPoster,
                      )
                    }
                    className="rounded px-4 py-2 bg-[#cff000]"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded bg-white p-5 shadow">
            <div className="text-lg font-semibold mb-2">Delete item?</div>
            <div className="text-sm text-gray-600 mb-4">
              Are you sure you want to permanently delete this item? This cannot
              be undone.
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="rounded px-3 py-1 border"
              >
                Cancel
              </button>
              <button
                onClick={doDelete}
                className="rounded px-3 py-1 bg-rose-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
