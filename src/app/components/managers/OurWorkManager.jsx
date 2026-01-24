'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  const getCategory = useCallback(() => {
    if (selectedSection === 'Videos') return 'test'
    if (selectedSection === 'Graphics') return 'graphics'
    if (selectedSection === 'AI Lab') return 'ai_lab'
    return selectedSection.toLowerCase()
  }, [selectedSection])

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
  }, [selectedSection, selectedSubsection, getCategory])

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

  // --- BEFORE/AFTER VIDEO: NORMAL UPLOAD + AFTER BUTTON ---
  function BeforeAfterVideoManager() {
    const [videos, setVideos] = useState([])
    const [loading, setLoading] = useState(false)
    const [uploadingId, setUploadingId] = useState(null) // id or 'before'
    const [uploadingType, setUploadingType] = useState(null) // 'before' or 'after'
    const [replaceId, setReplaceId] = useState(null)
    const [replaceType, setReplaceType] = useState(null) // 'before' or 'after'
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const { showToast, ToastComponent } = useToast()
    // Delete before video (deletes the whole pair)
    const handleDeleteBefore = async (id) => {
      if (!window.confirm('Delete this before/after video pair?')) return
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/media-items/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        if (res.ok) {
          showToast('Pair deleted successfully', 'success')
        } else {
          showToast('Failed to delete pair', 'error')
        }
      } catch {
        showToast('Failed to delete pair', 'error')
      }
      fetchVideos()
    }

    // Delete after video (removes only after, keeps before)
    const handleDeleteAfter = async (id) => {
      if (!window.confirm('Remove the after video?')) return
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/media-items/${id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ after: '', afterPoster: '' }),
        })
        if (res.ok) {
          showToast('After video removed', 'success')
        } else {
          showToast('Failed to remove after video', 'error')
        }
      } catch {
        showToast('Failed to remove after video', 'error')
      }
      fetchVideos()
    }

    // Replace before/after video
    const handleReplace = async (file, id, type) => {
      if (!file) return
      setReplaceId(id)
      setReplaceType(type)
      const formData = new FormData()
      formData.append('file', file)
      let endpoint = `${API_BASE_URL}/api/admin/media-items/${id}/replace`
      if (type === 'after') {
        endpoint = `${API_BASE_URL}/api/admin/media-items/${id}/replace-after`
      }
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })
        if (res.ok) {
          showToast(
            `${type === 'after' ? 'After' : 'Before'} video replaced!`,
            'success'
          )
        } else {
          showToast('Failed to replace video', 'error')
        }
      } catch {
        showToast('Failed to replace video', 'error')
      }
      setReplaceId(null)
      setReplaceType(null)
      fetchVideos()
    }

    // Fetch all before/after videos (category: 'test', subsection: 'Before/After Video')
    const fetchVideos = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/admin/media-items/category/test?subsection=Before/After Video`,
          { credentials: 'include' }
        )
        const data = await res.json()
        setVideos(
          Array.isArray(data.data)
            ? data.data.map((v) => ({
                ...v,
                afterSrc: v.after, // map backend 'after' to frontend 'afterSrc'
                afterPoster: v.afterPoster,
              }))
            : []
        )
      } catch {
        setVideos([])
      }
      setLoading(false)
    }

    useEffect(() => {
      fetchVideos()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Upload before video
    const handleBeforeUpload = async (file) => {
      setUploadingId('before')
      setUploadingType('before')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'video')
      formData.append('category', 'test')
      formData.append('subsection', 'Before/After Video')
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/admin/media-items/upload`,
          {
            method: 'POST',
            body: formData,
            credentials: 'include',
          }
        )
        const data = await res.json()
        if (data.success) {
          showToast('Before video uploaded!', 'success')
          fetchVideos()
        }
      } finally {
        setUploadingId(null)
        setUploadingType(null)
      }
    }

    // Upload after video for a given before video
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
        const res = await fetch(
          `${API_BASE_URL}/api/admin/media-items/upload`,
          {
            method: 'POST',
            body: formData,
            credentials: 'include',
          }
        )
        const data = await res.json()
        if (data.success) {
          showToast('After video uploaded!', 'success')
          fetchVideos()
        }
      } finally {
        setUploadingId(null)
        setUploadingType(null)
      }
    }

    return (
      <div className="rounded-xl border bg-white p-8 shadow-md">
        {ToastComponent}
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
          <span role="img" aria-label="before-after">
            🎬
          </span>{' '}
          Before / After Videos
        </h2>
        <p className="text-base text-slate-600 mb-6">
          <b>Step 1:</b> Add Before Video first.
          <br />
          <b>Step 2:</b> For each video, use the &#39;Upload After Video&#39;
          button to add the after video.
          <br />
          Both videos will be shown side by side after upload. You can also
          replace or delete videos.
        </p>
        <div className="flex items-center gap-4 mb-6">
          <label className="block font-semibold mb-2 text-slate-800">
            Upload Before Video
          </label>
          <input
            type="file"
            accept="video/*"
            disabled={uploadingId === 'before' && uploadingType === 'before'}
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#cff000] file:text-slate-900 hover:file:bg-lime-200"
            onChange={(e) =>
              e.target.files && handleBeforeUpload(e.target.files[0])
            }
          />
          {uploadingId === 'before' && uploadingType === 'before' ? (
            <span className="ml-4 text-blue-600 font-medium">Uploading...</span>
          ) : null}
          <button
            className="ml-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-base font-medium text-slate-800 transition disabled:opacity-60"
            onClick={fetchVideos}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {videos.map((video) => (
            <div
              key={video._id}
              className="border rounded-xl p-3 flex flex-col gap-1 bg-gray-50 shadow-sm w-full relative"
            >
              {/* Dustbin Delete Icon for the pair, outside the before/after but inside the card */}
              <div className="flex justify-end mb-1">
                <button
                  className="text-red-500 hover:text-red-700 p-1 rounded-full transition-colors"
                  onClick={() => handleDeleteBefore(video._id)}
                  title="Delete pair"
                  aria-label="Delete pair"
                  style={{ zIndex: 2 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Delete pair</title>
                    <path
                      d="M3 6h18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <rect
                      x="5"
                      y="6"
                      width="14"
                      height="14"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M9 10v6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M15 10v6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-stretch">
                {/* Before Video Card */}
                <div className="flex-1 flex flex-col items-center bg-white rounded-lg p-4 shadow">
                  <div className="flex w-full justify-between items-center mb-2">
                    <span className="font-semibold text-slate-800">Before</span>
                    <div className="flex gap-2">
                      <label className="cursor-pointer text-blue-600 hover:underline text-xs">
                        <input
                          type="file"
                          accept="video/*"
                          style={{ display: 'none' }}
                          onChange={(e) =>
                            e.target.files &&
                            handleReplace(
                              e.target.files[0],
                              video._id,
                              'before'
                            )
                          }
                          disabled={
                            replaceId === video._id && replaceType === 'before'
                          }
                        />
                        {replaceId === video._id && replaceType === 'before'
                          ? 'Replacing...'
                          : 'Replace'}
                      </label>
                    </div>
                  </div>
                  <HlsVideoPlayer
                    src={video.src}
                    poster={video.poster}
                    style={{ width: '100%', borderRadius: 8, maxHeight: 220 }}
                  />
                </div>
                {/* After Video Card or Upload */}
                <div className="flex-1 flex flex-col items-center bg-white rounded-lg p-4 shadow min-h-[220px] justify-center">
                  <div className="flex w-full justify-between items-center mb-2">
                    <span className="font-semibold text-slate-800">After</span>
                    {video.afterSrc && (
                      <div className="flex gap-2">
                        <label className="cursor-pointer text-blue-600 hover:underline text-xs">
                          <input
                            type="file"
                            accept="video/*"
                            style={{ display: 'none' }}
                            onChange={(e) =>
                              e.target.files &&
                              handleReplace(
                                e.target.files[0],
                                video._id,
                                'after'
                              )
                            }
                            disabled={
                              replaceId === video._id && replaceType === 'after'
                            }
                          />
                          {replaceId === video._id && replaceType === 'after'
                            ? 'Replacing...'
                            : 'Replace'}
                        </label>
                      </div>
                    )}
                  </div>
                  {video.afterSrc ? (
                    <HlsVideoPlayer
                      src={video.afterSrc}
                      poster={video.afterPoster}
                      style={{ width: '100%', borderRadius: 8, maxHeight: 220 }}
                    />
                  ) : (
                    <>
                      <button
                        className="mb-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm font-semibold transition"
                        disabled={
                          uploadingId === video._id && uploadingType === 'after'
                        }
                        onClick={() =>
                          document
                            .getElementById(`after-upload-${video._id}`)
                            .click()
                        }
                      >
                        {uploadingId === video._id && uploadingType === 'after'
                          ? 'Uploading...'
                          : 'Upload After Video'}
                      </button>
                      <input
                        id={`after-upload-${video._id}`}
                        type="file"
                        accept="video/*"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          e.target.files &&
                          handleAfterUpload(e.target.files[0], video._id)
                        }
                      />
                      <div className="text-xs text-slate-400 mt-2">
                        No after video uploaded yet.
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {videos.length === 0 && !loading && (
            <div className="col-span-2 text-center text-slate-500 py-8 text-lg">
              No before/after videos found.
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
