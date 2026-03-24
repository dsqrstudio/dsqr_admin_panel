// admin/components/managers/AboutUsManager.jsx
'use client'
import React, { useState, useEffect } from 'react'
import { ConfirmModal } from '@/components/ui/modal'
import AboutUsExtraGraphicSection from './AboutUsExtraGraphicSection'
import HlsVideoPlayer from './HlsVideoPlayer'
import MediaListManager from './MediaListManager'
import { useToast } from '@/components/ui/toast'

export default function AboutUsManager() {
  const [videos, setVideos] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, pairId }
  const [loading, setLoading] = useState(false)
  const [uploadingId, setUploadingId] = useState(null) // id or 'before'
  const [uploadingType, setUploadingType] = useState(null) // 'before' or 'after'
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  const { showToast, ToastComponent } = useToast()

  // Delete a before/after pair (common delete button)
  const handleDeletePair = (pair) => {
    // Prefer before._id, fallback to after._id
    setDeleteTarget({
      id: pair.before?._id || pair.after?._id,
      pairId: pair.before?.pairId || pair.after?.pairId,
    })
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/${deleteTarget.id}?_t=${Date.now()}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      )
      if (res.ok) {
        showToast('Video deleted successfully', 'success')
      } else {
        showToast('Failed to delete video pair', 'error')
      }
    } catch {
      showToast('Failed to delete video pair', 'error')
    }
    setDeleteTarget(null)
    fetchVideos()
  }

  // Delete after video (removes only after, keeps before)
  const handleDeleteAfter = async (id) => {
    if (!window.confirm('Remove the after video?')) return
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/${id}?_t=${Date.now()}`,
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
    fetchVideos()
  }

  // Replace before/after video
  const handleReplace = async (file, id, type) => {
    if (!file) return
    setReplaceId(id)
    setReplaceType(type)
    const formData = new FormData()
    formData.append('file', file)
    let endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/${id}/replace?_t=${Date.now()}`
    if (type === 'after') {
      endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/${id}/replace-after?_t=${Date.now()}`
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/category/about_us_before_after?subsection=About%20Us%20Before%2FAfter%20Video&_t=${Date.now()}`,
        { credentials: 'include' },
      )
      const data = await res.json()
      // Group by pairId, role
      const items = Array.isArray(data.data) ? data.data : []
      const pairs = {}
      for (const item of items) {
        if (!item.pairId) continue
        if (!pairs[item.pairId])
          pairs[item.pairId] = { before: null, after: null }
        if (item.role === 'before') pairs[item.pairId].before = item
        if (item.role === 'after') pairs[item.pairId].after = item
      }
      setVideos(Object.values(pairs))
    } catch {
      setVideos([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchVideos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Upload before video (same as OurWorkManager)
  const handleBeforeUpload = async (file) => {
    setUploadingId('before')
    setUploadingType('before')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'video')
    formData.append('category', 'about_us_before_after')
    formData.append('subsection', 'About Us Before/After Video')
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/media-items/upload?_t=${Date.now()}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        showToast('Before video uploaded!', 'success')
        fetchVideos()
      } else {
        showToast(data.error || 'Upload failed', 'error')
      }
    } finally {
      setUploadingId(null)
      setUploadingType(null)
    }
  }

  // Upload after video for a given before video (same as OurWorkManager)
  const handleAfterUpload = async (file, beforeId) => {
    setUploadingId(beforeId)
    setUploadingType('after')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'video')
    formData.append('category', 'about_us_before_after')
    formData.append('subsection', 'About Us Before/After Video')
    formData.append('beforeId', beforeId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/media-items/upload?_t=${Date.now()}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        showToast('After video uploaded!', 'success')
        fetchVideos()
      } else {
        showToast(data.error || 'Upload failed', 'error')
      }
    } finally {
      setUploadingId(null)
      setUploadingType(null)
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
          About Us — Before / After Videos
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
                    onClick={() => handleDeletePair(pair)}
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
      {/* About Us Extra Graphic Section (single image, modern UI) */}
      <div className="mt-10">
        <AboutUsExtraGraphicSection />
      </div>
    </div>
  )
}
