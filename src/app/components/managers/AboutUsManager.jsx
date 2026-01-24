// admin/components/managers/AboutUsManager.jsx
'use client'
import React, { useState, useEffect } from 'react'
import AboutUsExtraGraphicSection from './AboutUsExtraGraphicSection'
import HlsVideoPlayer from './HlsVideoPlayer'
import MediaListManager from './MediaListManager'
import { useToast } from '@/components/ui/toast'

export default function AboutUsManager() {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/${id}`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/${id}`, {
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
    let endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/${id}/replace`
    if (type === 'after') {
      endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/${id}/replace-after`
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

  // Fetch all before/after videos (category: 'about_us_before_after', subsection: 'About Us Before/After Video')
  const fetchVideos = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/category/about_us_before_after?subsection=About%20Us%20Before%2FAfter%20Video`,
        { credentials: 'include' }
      )
      const data = await res.json()
      setVideos(
        Array.isArray(data.data)
          ? data.data.map((v) => ({
              ...v,
              afterSrc: v.after,
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
    formData.append('category', 'about_us_before_after')
    formData.append('subsection', 'About Us Before/After Video')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
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
    formData.append('category', 'about_us_before_after')
    formData.append('subsection', 'About Us Before/After Video')
    formData.append('beforeId', beforeId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
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
                <div className="flex-1 flex flex-col items-center bg-white rounded-lg p-4 shadow justify-center">
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
      {/* About Us Extra Graphic Section (single image, modern UI) */}
      <div className="mt-10">
        <AboutUsExtraGraphicSection />
      </div>
    </div>
  )
}
