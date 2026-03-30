'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ConfirmModal } from '@/components/ui/modal'
import DragDropUploadManager from './DragDropUploadManager'
import HlsVideoPlayer from './HlsVideoPlayer'
import { useToast } from '@/components/ui/toast'

const FEATURED_PROJECTS_STRUCTURE = {
  Graphics: [
    'Ad creatives',
    'Ai generated graphics',
    'App graphic',
    'Blog thumbnails',
    'Brand Kits & Assets',
    'Custom Icons',
    'Ebook graphics for website',
    'Infographics',
    'Pdfs',
    'Presentations',
    'Slide decks',
    'Social media graphics',
    'Web graphic',
  ],
  Videos: [
    'Montage style',
    'Spanish Videos',
    'Animation AI videos',
    'Gym & Fitness',
    'Text Based',
    'Talking Heads',
    'Product Showcase',
    'Podcast Intro',
    'Long form edits',
    'Digital Course VSL',
  ],
  'AI Lab': [
    'Ai Assets',
    'AI generated images',
    'Product Placement',
    'AI B-rolls',
    'AI Voiceover',
    'AI Clone Creation',
    'AI-Powered Video',
    'AI Videos Ad Creation',
    'AI UGC Ads/Content',
  ],
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function BeforeAfterVideoManager() {
  const queryClient = useQueryClient()
  const [videos, setVideos] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [uploadingId, setUploadingId] = useState(null)
  const [uploadingType, setUploadingType] = useState(null)
  const { showToast, ToastComponent } = useToast()

  const { data: serverData, isLoading, isFetching } = useQuery({
    queryKey: ['admin-media-items', 'test', 'Before/After Video'],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/media-items/category/test?subsection=Before/After Video&_t=${Date.now()}`,
        { credentials: 'include' }
      )
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json()
      const items = Array.isArray(data.data) ? data.data : []
      const pairs = {}
      for (const item of items) {
        if (!item.pairId) continue
        if (!pairs[item.pairId]) pairs[item.pairId] = { before: null, after: null }
        if (item.role === 'before') pairs[item.pairId].before = item
        if (item.role === 'after') pairs[item.pairId].after = item
      }
      return Object.values(pairs)
    },
    onError: () => showToast('Failed to load videos', 'error'),
  })

  useEffect(() => {
    if (serverData) setVideos(serverData)
  }, [serverData])

  const triggerRefresh = () => queryClient.invalidateQueries(['admin-media-items', 'test', 'Before/After Video'])

  const handleDeleteBefore = (id, pair) => setDeleteTarget({ type: 'before', id, pair })
  const handleDeleteAfter = (id) => setDeleteTarget({ type: 'after', id })

  const confirmDelete = async () => {
    if (!deleteTarget) return
    if (deleteTarget.type === 'before') {
      let beforeId = deleteTarget.pair?.before?._id || deleteTarget.id
      let afterId = deleteTarget.pair?.after?._id
      let success = true
      try {
        if (beforeId) {
          const res = await fetch(`${API_BASE_URL}/api/admin/media-items/${beforeId}`, { method: 'DELETE', credentials: 'include' })
          if (!res.ok) success = false
        }
        if (afterId) {
          const res2 = await fetch(`${API_BASE_URL}/api/admin/media-items/${afterId}`, { method: 'DELETE', credentials: 'include' })
          if (!res2.ok) success = false
        }
        showToast(success ? 'Pair deleted successfully' : 'Failed to delete pair', success ? 'success' : 'error')
      } catch {
        showToast('Failed to delete pair', 'error')
      }
    } else if (deleteTarget.type === 'after') {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/media-items/${deleteTarget.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ after: '', afterPoster: '' }),
        })
        if (res.ok) showToast('After video removed', 'success')
        else showToast('Failed to remove after video', 'error')
      } catch {
        showToast('Failed to remove after video', 'error')
      }
    }
    setDeleteTarget(null)
    triggerRefresh()
  }

  const handleBeforeUpload = async (file) => {
    setUploadingId('before')
    setUploadingType('before')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'video')
    formData.append('category', 'test')
    formData.append('subsection', 'Before/After Video')
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/media-items/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const data = await res.json()
      if (data && data.success) {
        showToast('Before video uploaded!', 'success')
      } else {
        showToast((data && data.error) || 'Upload failed', 'error')
      }
    } catch {
      showToast('Before video upload failed', 'error')
    } finally {
      setUploadingId(null)
      setUploadingType(null)
      triggerRefresh()
    }
  }

  const handleAfterUpload = async (file, beforeId) => {
    setUploadingId(beforeId)
    setUploadingType('after')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'video')
    formData.append('category', 'test')
    formData.append('subsection', 'Before/After Video')
    formData.append('beforeId', beforeId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/media-items/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const data = await res.json()
      if (data && data.success) {
        showToast('After video uploaded!', 'success')
      } else {
        showToast((data && data.error) || 'Upload failed', 'error')
      }
    } catch {
      showToast('After video upload failed', 'error')
    } finally {
      setUploadingId(null)
      setUploadingType(null)
      triggerRefresh()
    }
  }

  return (
    <div className="mt-2">
      {ToastComponent}
      <h3 className="text-2xl font-bold mb-4 text-slate-800">
        Before / After Videos
      </h3>
      <p className="text-sm text-slate-600 mb-6">
        Upload a before video, then add its after video.
      </p>

      <div className="flex items-center gap-4 mb-6">
        <label className="block font-semibold mb-2 text-slate-800">
          Upload New Before Video
        </label>
        <input
          type="file"
          accept="video/*"
          disabled={uploadingId === 'before' && uploadingType === 'before'}
          className="w-full max-w-sm text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#cff000] file:text-slate-900 hover:file:bg-[#b8dc00] transition"
          onChange={(e) => e.target.files && handleBeforeUpload(e.target.files[0])}
        />
        {uploadingId === 'before' && uploadingType === 'before' && (
          <span className="text-blue-600 text-sm font-medium">Uploading...</span>
        )}
        <button
          onClick={triggerRefresh}
          disabled={isLoading || isFetching}
          className="ml-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded text-sm font-semibold transition disabled:opacity-50"
        >
          {isLoading || isFetching ? 'Refeshing...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {videos.map((pair, idx) => (
          <div key={idx} className="border p-4 rounded-xl shadow-sm bg-slate-50 relative">
            <div className="flex gap-4">
              {/* Before side */}
              <div className="flex-1 flex flex-col bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-700">Before</span>
                  <button
                    onClick={() => handleDeleteBefore(pair.before?._id, pair)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Delete Pair
                  </button>
                </div>
                {pair.before ? (
                  <HlsVideoPlayer src={pair.before.src} poster={pair.before.poster} style={{ width: '100%', borderRadius: 8 }} />
                ) : (
                  <div className="text-xs text-slate-400">Missing before video</div>
                )}
              </div>
              
              {/* After side */}
              <div className="flex-1 flex flex-col bg-white p-3 rounded-lg shadow-sm border border-slate-100 justify-center">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-700">After</span>
                  {/* {pair.after && (
                    <button
                      onClick={() => handleDeleteAfter(pair.after._id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove After
                    </button>
                  )} */}
                </div>
                {pair.after ? (
                  <HlsVideoPlayer src={pair.after.src} poster={pair.after.poster} style={{ width: '100%', borderRadius: 8 }} />
                ) : pair.before && !pair.after ? (
                  <div className="w-full flex flex-col items-center">
                    <label className="text-xs font-semibold mb-1">Add After Video</label>
                    <input
                      type="file"
                      accept="video/*"
                      disabled={uploadingId === pair.before._id && uploadingType === 'after'}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-200 file:text-black"
                      onChange={(e) => e.target.files && handleAfterUpload(e.target.files[0], pair.before._id)}
                    />
                    {uploadingId === pair.before._id && uploadingType === 'after' && (
                      <span className="text-blue-500 text-xs mt-1">Uploading...</span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">N/A</div>
                )}
              </div>
            </div>
          </div>
        ))}
        {videos.length === 0 && !isLoading && (
          <div className="col-span-2 text-center text-slate-500 py-6">No videos found.</div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Video?"
        message="Are you sure you want to delete this content? This cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}

export default function OurWorkManager({ activeSub }) {
  const queryClient = useQueryClient()
  const active = activeSub || 'Featured Projects'
  const [selectedSection, setSelectedSection] = useState('Graphics')
  const [selectedSubsection, setSelectedSubsection] = useState('Ad creatives')
  const [items, setItems] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const sections = Object.keys(FEATURED_PROJECTS_STRUCTURE)
  const subsections = FEATURED_PROJECTS_STRUCTURE[selectedSection] || []

  const getCategory = useCallback(() => {
    if (selectedSection === 'Videos') return 'test'
    if (selectedSection === 'Graphics') return 'graphics'
    if (selectedSection === 'AI Lab') return 'ai_lab'
    return selectedSection.toLowerCase()
  }, [selectedSection])

  const currentCategory = getCategory()

  // --- React Query Fetch ---
  const { data: serverData, isLoading, isFetching } = useQuery({
    queryKey: ['admin-media-items', currentCategory, selectedSubsection],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/media-items/category/${currentCategory}?subsection=${encodeURIComponent(
          selectedSubsection
        )}&_t=${Date.now()}`,
        { credentials: 'include' }
      )
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json()
      if (data?.success && Array.isArray(data.data)) return data.data
      return []
    },
    onError: () => showToast('Failed to load items', 'error')
  })

  useEffect(() => {
    if (serverData) setItems(serverData)
  }, [serverData])

  const triggerRefresh = () => {
    queryClient.invalidateQueries(['admin-media-items', currentCategory, selectedSubsection])
  }

  const handleDragChange = (newItems) => {
    setItems(newItems)
    triggerRefresh()
  }

  const handleSelectAll = (checked) => {
    setSelectAll(checked)
    if (checked) setSelectedIds(items.map((item) => item._id || item.id))
    else setSelectedIds([])
  }

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    if (!window.confirm(`Delete ${selectedIds.length} selected item(s)?`)) return
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          await fetch(`${API_BASE_URL}/api/admin/media-items/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          })
        })
      )
      showToast('Selected items deleted', 'success')
      setSelectedIds([])
      setSelectAll(false)
      triggerRefresh()
    } catch {
      showToast('Failed to delete selected items', 'error')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {ToastComponent}
      
      {active === 'Featured Projects' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Featured Projects</h2>
              <p className="text-sm text-slate-500">
                Manage category grid items.
              </p>
            </div>
            <button
              onClick={triggerRefresh}
              disabled={isLoading || isFetching}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-medium transition"
            >
              {isLoading || isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value)
                  setSelectedSubsection(FEATURED_PROJECTS_STRUCTURE[e.target.value][0]) // reset
                  setSelectedIds([])
                  setSelectAll(false)
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              >
                {sections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sub Section
              </label>
              <select
                value={selectedSubsection}
                onChange={(e) => {
                  setSelectedSubsection(e.target.value)
                  setSelectedIds([])
                  setSelectAll(false)
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              >
                {subsections.map((subsec) => (
                  <option key={subsec} value={subsec}>
                    {subsec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="mb-4 flex items-center gap-3 bg-red-50 p-3 rounded-lg border border-red-100">
              <span className="text-sm font-medium text-red-800">
                {selectedIds.length} items selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shrink-0"
              >
                Delete Selected
              </button>
            </div>
          )}

          {isLoading && items.length === 0 ? (
            <div className="text-center py-10 text-slate-500">Loading items...</div>
          ) : (
            <DragDropUploadManager
              mode={selectedSection === 'Graphics' ? 'image' : 'video'}
              category={currentCategory}
              subsection={selectedSubsection}
              items={items}
              onChange={handleDragChange}
              onUploadSuccess={triggerRefresh}
              onDeleteSuccess={triggerRefresh}
              allowAdd
              allowEdit
              allowDelete
              renderItemExtra={(item) => (
                <div className="absolute top-2 left-2 z-20">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item._id || item.id)}
                    onChange={() => handleSelect(item._id || item.id)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>
              )}
            />
          )}

          {/* Render the Before/After manager below the main grid only if Videos is selected */}
          {/* {selectedSection === 'Videos' && <BeforeAfterVideoManager />} */}
        </div>
      )}
      {/* --- BEFORE/AFTER VIEW --- */}
    {active === 'Before/After Video' && (
      <div className="mt-4">
        <BeforeAfterVideoManager />
      </div>
    )}
    </div>
  )
}
