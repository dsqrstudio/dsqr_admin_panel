'use client'
import React, { useState, useEffect, useRef } from 'react'
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

export default function OurWorkManager({ activeSub }) {
  const active = activeSub || 'Featured Projects'
  const [selectedSection, setSelectedSection] = useState('Graphics')
  const [selectedSubsection, setSelectedSubsection] = useState('Ad creatives')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const sections = Object.keys(FEATURED_PROJECTS_STRUCTURE)
  const subsections = FEATURED_PROJECTS_STRUCTURE[selectedSection] || []

  // Helper to get correct category value
  const getCategory = () => {
    if (selectedSection === 'Videos') return 'test'
    if (selectedSection === 'Graphics') return 'graphics'
    if (selectedSection === 'AI Lab') return 'ai_lab'
    return selectedSection.toLowerCase()
  }

  // Fetch items when section/subsection changes
  useEffect(() => {
    async function fetchItems() {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/admin/media-items/category/${getCategory()}?subsection=${encodeURIComponent(
            selectedSubsection
          )}`
        )
        const data = await res.json()
        setItems(data?.data || [])
        setSelectedIds([])
        setSelectAll(false)
      } catch (err) {
        setItems([])
        setSelectedIds([])
        setSelectAll(false)
      }
      setLoading(false)
    }
    fetchItems()
  }, [selectedSection, selectedSubsection])

  // Refresh after upload/delete
  const handleRefresh = () => {
    setLoading(true)
    fetch(
      `/api/admin/media-items/category/${getCategory()}?subsection=${encodeURIComponent(
        selectedSubsection
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        setItems(data?.data || [])
        setSelectedIds([])
        setSelectAll(false)
        showToast('Data refreshed!', 'success')
      })
      .catch(() => showToast('Failed to refresh data', 'error'))
      .finally(() => setLoading(false))
  }

  // Select all logic
  const handleSelectAll = (checked) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedIds(items.map((item) => item._id))
    } else {
      setSelectedIds([])
    }
  }

  // Individual select
  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    )
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    if (!window.confirm(`Delete ${selectedIds.length} selected item(s)?`))
      return
    setDeleting(true)
    try {
      for (const id of selectedIds) {
        await fetch(`/api/admin/media-items/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      }
      showToast('Selected items deleted', 'success')
      handleRefresh()
    } catch {
      showToast('Failed to delete selected items', 'error')
    }
    setDeleting(false)
  }

  // --- INTERNAL COMPONENT MOVED OUTSIDE OF RETURN ---
  function BeforeAfterVideoManager() {
    const [before, setBefore] = useState(null)
    const [after, setAfter] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [pairs, setPairs] = useState([])
    const [loadingPairs, setLoadingPairs] = useState(false)
    const refreshTimer = useRef()

    const fetchPairs = async () => {
      setLoadingPairs(true)
      try {
        const res = await fetch('/api/admin/before-after-pairs')
        const data = await res.json()
        setPairs(data?.data || [])
      } catch {
        setPairs([])
      }
      // Keep 'Refreshing...' for 1s for better UX
      setTimeout(() => setLoadingPairs(false), 1000)
    }

    useEffect(() => {
      fetchPairs()
      refreshTimer.current = setInterval(fetchPairs, 60000)
      return () => clearInterval(refreshTimer.current)
    }, [])

    const handleUpload = async (file, which) => {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'video')
      formData.append('category', 'test')
      formData.append('subsection', 'Before/After Video')
      try {
        const res = await fetch('/api/admin/media-items/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })
        const data = await res.json()
        if (data.success && data.data) {
          const { videoId, hlsUrl, poster, _id } = data.data
          const videoObj = {
            videoId: videoId || _id,
            hlsUrl: hlsUrl || data.data.src,
            poster: poster || '',
          }
          if (which === 'before') setBefore(videoObj)
          else setAfter(videoObj)
        }
      } finally {
        setUploading(false)
      }
    }

    const handleSavePair = async () => {
      if (!before || !after) return
      setUploading(true)
      try {
        const res = await fetch('/api/admin/before-after-pairs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ before, after }),
        })
        const data = await res.json()
        if (data.success) {
          setBefore(null)
          setAfter(null)
          fetchPairs()
        }
      } finally {
        setUploading(false)
      }
    }

    const handleDeletePair = async (id) => {
      if (!window.confirm('Delete this before/after pair?')) return
      setUploading(true)
      try {
        await fetch(`/api/admin/before-after-pairs/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        fetchPairs()
      } finally {
        setUploading(false)
      }
    }

    return (
      <div className="rounded-xl border bg-white p-8 shadow-md">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
          <span role="img" aria-label="before-after">
            🎬
          </span>{' '}
          Before / After Videos
        </h2>
        <p className="text-base text-slate-600 mb-6">
          Upload and manage before/after video pairs for your portfolio.
          Showcase your transformations with side-by-side video comparison.
        </p>
        {/* Upload section always at top */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1 bg-gray-50 rounded-lg p-4 border">
            <label className="block font-semibold mb-2 text-slate-800">
              Before Video
            </label>
            <input
              type="file"
              accept="video/*"
              disabled={uploading}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#cff000] file:text-slate-900 hover:file:bg-lime-200"
              onChange={(e) =>
                e.target.files && handleUpload(e.target.files[0], 'before')
              }
            />
            {before && (
              <div className="mt-3 flex flex-col items-center">
                <HlsVideoPlayer
                  src={before.hlsUrl}
                  poster={before.poster}
                  style={{ maxWidth: 220, borderRadius: 8 }}
                />
                <div className="text-center text-xs mt-2 font-medium text-slate-700">
                  Before
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-4 border">
            <label className="block font-semibold mb-2 text-slate-800">
              After Video
            </label>
            <input
              type="file"
              accept="video/*"
              disabled={uploading}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#cff000] file:text-slate-900 hover:file:bg-lime-200"
              onChange={(e) =>
                e.target.files && handleUpload(e.target.files[0], 'after')
              }
            />
            {after && (
              <div className="mt-3 flex flex-col items-center">
                <HlsVideoPlayer
                  src={after.hlsUrl}
                  poster={after.poster}
                  style={{ maxWidth: 220, borderRadius: 8 }}
                />
                <div className="text-center text-xs mt-2 font-medium text-slate-700">
                  After
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-end items-center min-w-[120px]">
            <button
              className="w-full px-5 py-2 bg-[#cff000] text-slate-900 rounded-lg font-bold text-base shadow-sm disabled:opacity-50 transition"
              disabled={!before || !after || uploading}
              onClick={handleSavePair}
            >
              {uploading ? 'Saving...' : 'Save Pair'}
            </button>
          </div>
        </div>
        <button
          className="mb-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-base font-medium text-slate-800 transition disabled:opacity-60"
          onClick={fetchPairs}
          disabled={loadingPairs}
        >
          {loadingPairs ? 'Refreshing...' : 'Refresh'}
        </button>
        {/* Preview grid always below upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pairs.map((pair) => (
            <div
              key={pair._id}
              className="border rounded-xl p-5 flex flex-col items-center bg-gray-50 shadow-sm"
            >
              <div className="flex gap-6 mb-2">
                <div>
                  <div className="text-center font-semibold mb-2 text-slate-800">
                    Before
                  </div>
                  <HlsVideoPlayer
                    src={pair.before.hlsUrl}
                    poster={pair.before.poster}
                    style={{ maxWidth: 220, borderRadius: 8 }}
                  />
                </div>
                <div>
                  <div className="text-center font-semibold mb-2 text-slate-800">
                    After
                  </div>
                  <HlsVideoPlayer
                    src={pair.after.hlsUrl}
                    poster={pair.after.poster}
                    style={{ maxWidth: 220, borderRadius: 8 }}
                  />
                </div>
              </div>
              <button
                className="mt-2 px-4 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-semibold transition"
                onClick={() => handleDeletePair(pair._id)}
                disabled={uploading}
              >
                Delete Pair
              </button>
            </div>
          ))}
          {pairs.length === 0 && !loadingPairs && (
            <div className="col-span-2 text-center text-slate-500 py-8 text-lg">
              No before/after pairs found.
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Featured Projects View */}
      <div className={active !== 'Before/After Video' ? 'block' : 'hidden'}>
        <div className="flex items-center mb-6">
          <h2 className="text-3xl font-bold text-slate-900 mr-4">
            Our Work — Featured Projects
          </h2>
          <button
            onClick={() => {
              handleRefresh()
              showToast('Refreshing data...', 'info')
            }}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors duration-150 shadow-sm"
            title="Refresh data"
            disabled={loading}
          >
            &#x21bb; Refresh
          </button>
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => {
                setSelectedSection(sec)
                setSelectedSubsection(FEATURED_PROJECTS_STRUCTURE[sec][0])
              }}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedSection === sec
                  ? 'bg-[#cff000] text-slate-900 font-semibold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={selectedSubsection}
            onChange={(e) => setSelectedSubsection(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg"
          >
            {subsections.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-2">
            {selectedSection} — {selectedSubsection}
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Upload {selectedSection === 'Videos' ? 'videos' : 'images'} for this
            category. Drag and drop to reorder.
          </p>
          {ToastComponent}
          {/* Select All, Delete, and Count UI */}
          <div className="flex items-center mb-4 gap-4">
            <label className="flex items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                disabled={loading || !items.length}
              />
              <span className="text-sm">Select All</span>
            </label>
            <button
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 transition disabled:opacity-50"
              onClick={handleBulkDelete}
              disabled={!selectedIds.length || deleting}
            >
              Delete Selected
            </button>
            {selectedIds.length > 0 && (
              <span className="text-xs text-slate-600">
                {selectedIds.length} selected
              </span>
            )}
          </div>
          <DragDropUploadManager
            mode={
              selectedSection === 'Videos'
                ? 'video'
                : selectedSection === 'AI Lab'
                ? [
                    'Ai Assets',
                    'AI generated images',
                    'Product Placement',
                  ].includes(selectedSubsection)
                  ? 'image'
                  : 'video'
                : 'image'
            }
            category={
              selectedSection === 'Videos'
                ? 'test'
                : selectedSection === 'Graphics'
                ? 'graphics'
                : selectedSection === 'AI Lab'
                ? 'ai_lab'
                : selectedSection.toLowerCase()
            }
            section={selectedSection}
            subsection={selectedSubsection}
            items={items.map((item) => ({
              ...item,
              _selected: selectedIds.includes(item._id),
            }))}
            onUploadSuccess={handleRefresh}
            onDeleteSuccess={handleRefresh}
            // Pass select handlers to DragDropUploadManager if needed
            renderItem={(item) => (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item._id)}
                  onChange={() => handleSelect(item._id)}
                />
                {/* Render the default item UI here, or let DragDropUploadManager handle it */}
                {/* ...existing item rendering... */}
              </div>
            )}
          />
        </div>
      </div>

      {/* Before/After View */}
      <div
        className={active === 'Before/After Video' ? 'block mt-4' : 'hidden'}
      >
        <BeforeAfterVideoManager />
      </div>
    </div>
  )
}
