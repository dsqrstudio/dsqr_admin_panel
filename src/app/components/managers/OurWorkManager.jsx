'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
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
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/api/admin/media-items/category/${getCategory()}?subsection=${encodeURIComponent(
            selectedSubsection,
          )}&_t=\${Date.now()}`,
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
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/api/admin/media-items/category/${getCategory()}?subsection=${encodeURIComponent(
        selectedSubsection,
      )}&_t=\${Date.now()}`,
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
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
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
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/${id}?_t=\${Date.now()}`,
          {
            method: 'DELETE',
            credentials: 'include',
          },
        )
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
    // Modal state for delete confirmation (common for both before/after)
    const [deleteTarget, setDeleteTarget] = useState(null) // { type: 'before'|'after', id: string }

    // Delete before video (deletes the whole pair)
    const handleDeleteBefore = (id, pair) => setDeleteTarget({ type: 'before', id, pair })
    // Delete after video (removes only after, keeps before)
    const handleDeleteAfter = (id) => setDeleteTarget({ type: 'after', id })

    // Confirm delete
    const confirmDelete = async () => {
      if (!deleteTarget) return
      if (deleteTarget.type === 'before') {
        let beforeId = deleteTarget.pair?.before?._id || deleteTarget.id
        let afterId = deleteTarget.pair?.after?._id
        let success = true
        try {
          // Delete before
          if (beforeId) {
            const res = await fetch(
              `${API_BASE_URL}/api/admin/media-items/${beforeId}?_t=\${Date.now()}`,
              {
                method: 'DELETE',
                credentials: 'include',
              },
            )
            if (!res.ok) success = false
          }
          // Delete after
          if (afterId) {
            const res2 = await fetch(
              `${API_BASE_URL}/api/admin/media-items/${afterId}?_t=\${Date.now()}`,
              {
                method: 'DELETE',
                credentials: 'include',
              },
            )
            if (!res2.ok) success = false
          }
          showToast(success ? 'Pair deleted successfully' : 'Failed to delete pair', success ? 'success' : 'error')
        } catch {
          showToast('Failed to delete pair', 'error')
        }
      } else if (deleteTarget.type === 'after') {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/admin/media-items/${deleteTarget.id}?_t=\${Date.now()}`,
            {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ after: '', afterPoster: '' }),
            },
          )
          if (res.ok) {
            showToast('After video removed', 'success')
          } else {
            showToast('Failed to remove after video', 'error')
          }
        } catch {
          showToast('Failed to remove after video', 'error')
        }
      }
      setDeleteTarget(null)
      fetchVideos()
    }

    // Replace before/after video
    const handleReplace = async (file, id, type) => {
      if (!file) return
      setReplaceId(id)
      setReplaceType(type)
      const formData = new FormData()
      formData.append('file', file)
      let endpoint = `${API_BASE_URL}/api/admin/media-items/${id}/replace?_t=\${Date.now()}`
      if (type === 'after') {
        endpoint = `${API_BASE_URL}/api/admin/media-items/${id}/replace-after?_t=\${Date.now()}`
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
            'success',
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

    // Fetch all before/after videos as separate docs, group by pairId
    const fetchVideos = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/admin/media-items/category/test?subsection=Before/After Video&_t=\${Date.now()}`,
          { credentials: 'include' },
        )
        const data = await res.json()
        // Group by pairId, role
        const items = Array.isArray(data.data) ? data.data : []
        console.log('[FRONTEND FETCHED ITEMS]', items)
        const pairs = {}
        for (const item of items) {
          if (!item.pairId) continue
          if (!pairs[item.pairId])
            pairs[item.pairId] = { before: null, after: null }
          if (item.role === 'before') pairs[item.pairId].before = item
          if (item.role === 'after') pairs[item.pairId].after = item
        }
        setVideos(Object.values(pairs))
      } catch (err) {
        console.error('[FRONTEND FETCH ERROR]', err)
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
          `${API_BASE_URL}/api/admin/media-items/upload?_t=\${Date.now()}`,
          {
            method: 'POST',
            body: formData,
            credentials: 'include',
          },
        )
        let data = null
        try {
          data = await res.json()
        } catch (e) {
          showToast('Upload failed: Invalid server response', 'error')
        }
        console.log('[FRONTEND UPLOAD BEFORE RESPONSE]', data)
        if (data && data.success) {
          showToast('Before video uploaded!', 'success')
        } else {
          showToast(
            (data && data.message) || 'Before video upload failed',
            'error',
          )
        }
      } catch (err) {
        showToast('Before video upload failed (network/server error)', 'error')
      } finally {
        setUploadingId(null)
        setUploadingType(null)
        fetchVideos()
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
          `${API_BASE_URL}/api/admin/media-items/upload?_t=\${Date.now()}`,
          {
            method: 'POST',
            body: formData,
            credentials: 'include',
          },
        )
        let data = null
        try {
          data = await res.json()
        } catch (e) {
          showToast('Upload failed: Invalid server response', 'error')
        }
        console.log('[FRONTEND UPLOAD AFTER RESPONSE]', data)
        if (data && data.success) {
          showToast('After video uploaded!', 'success')
        } else {
          showToast(
            (data && data.message) || 'After video upload failed',
            'error',
          )
        }
      } catch (err) {
        showToast('After video upload failed (network/server error)', 'error')
      } finally {
        setUploadingId(null)
        setUploadingType(null)
        fetchVideos()
      }
    }

    return (
     <div className="max-w-7xl mx-auto">
           <div className="rounded-xl border bg-white p-8 shadow-md mb-10">
             {ToastComponent}
             <h2 className="text-3xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
               <span role="img" aria-label="before-after">
                 🎬
               </span>{' '}
               Our Work — Before / After Videos
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
               {videos.map((pair, idx) => (
                 <div
                   key={pair.before?._id || pair.after?._id || idx}
                   className="border rounded-xl p-3 flex flex-col gap-1 bg-gray-50 shadow-sm w-full relative"
                 >
                   {/* Common delete button above both before/after */}
                   {(pair.before || pair.after) && (
                     <div className="flex justify-end mb-2">
                       <button
                         className="text-xs text-red-600 hover:underline font-semibold px-3 py-1 rounded"
                         onClick={() => handleDeleteBefore(pair.before?._id || pair.after?._id, pair)}
                       >
                         Delete
                       </button>
                     </div>
                   )}
                   <div className="flex flex-col md:flex-row gap-4 items-stretch">
                     {/* Before Video Card */}
                     <div className="flex-1 flex flex-col items-center bg-white rounded-lg p-4 shadow">
                       <div className="flex w-full justify-between items-center mb-2">
                         <span className="font-semibold text-slate-800">Before</span>
                       </div>
                       {pair.before ? (
                         <HlsVideoPlayer
                           src={pair.before.src}
                           poster={pair.before.poster}
                           style={{ width: '100%', borderRadius: 8, maxHeight: 220 }}
                         />
                       ) : (
                         <div className="text-xs text-slate-400 mt-2">
                           No before video
                         </div>
                       )}
                     </div>
                     {/* After Video Card */}
                     <div className="flex-1 flex flex-col items-center bg-white rounded-lg p-4 shadow justify-center">
                       <div className="flex w-full justify-between items-center mb-2">
                         <span className="font-semibold text-slate-800">After</span>
                       </div>
                       {pair.after ? (
                         <HlsVideoPlayer
                           src={pair.after.src}
                           poster={pair.after.poster}
                           style={{ width: '100%', borderRadius: 8, maxHeight: 220 }}
                         />
                       ) : pair.before && !pair.after ? (
                         <div className="w-full flex flex-col items-center">
                           <label className="block font-medium text-slate-700 mb-1">
                             Upload After Video
                           </label>
                           <input
                             type="file"
                             accept="video/*"
                             disabled={
                               uploadingId === pair.before._id &&
                               uploadingType === 'after'
                             }
                             className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#cff000] file:text-slate-900 hover:file:bg-lime-200"
                             onChange={(e) =>
                               e.target.files &&
                               handleAfterUpload(e.target.files[0], pair.before._id)
                             }
                           />
                           {uploadingId === pair.before._id &&
                           uploadingType === 'after' ? (
                             <span className="ml-4 text-blue-600 font-medium">
                               Uploading...
                             </span>
                           ) : null}
                         </div>
                       ) : (
                         <div className="text-xs text-slate-400 mt-2">
                           No after video
                         </div>
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
             <ConfirmModal
               isOpen={!!deleteTarget}
               onClose={() => setDeleteTarget(null)}
               onConfirm={confirmDelete}
               title="Delete Video Pair?"
               message="Are you sure you want to delete this before/after video pair? This cannot be undone."
               confirmText="Delete"
               cancelText="Cancel"
               variant="danger"
             />
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
