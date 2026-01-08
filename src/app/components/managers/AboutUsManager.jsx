// admin/components/managers/AboutUsManager.jsx
'use client'
import React, { useState, useEffect } from 'react'
import HlsVideoPlayer from './HlsVideoPlayer'
import MediaListManager from './MediaListManager'

export default function AboutUsManager() {
  const [refreshing, setRefreshing] = useState(false)
  const [beforeVideo, setBeforeVideo] = useState(null)
  const [afterVideo, setAfterVideo] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [pairs, setPairs] = useState([])

  // Fetch pairs from backend
  const fetchPairs = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/about-us-video-pairs', {
        credentials: 'include',
      })
      const data = await res.json()
      setPairs(data?.data || [])
    } catch {
      setPairs([])
    }
    setRefreshing(false)
  }

  useEffect(() => {
    fetchPairs()
  }, [])

  // Upload before video
  const handleBeforeUpload = async (file) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'video')
    formData.append('category', 'about_us_before_after')
    formData.append('pairType', 'before')
    try {
      const res = await fetch('/api/admin/media-items/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success && data.data) {
        setBeforeVideo(data.data)
      }
    } finally {
      setUploading(false)
    }
  }

  // Upload after video
  const handleAfterUpload = async (file) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'video')
    formData.append('category', 'about_us_before_after')
    formData.append('pairType', 'after')
    try {
      const res = await fetch('/api/admin/media-items/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success && data.data) {
        setAfterVideo(data.data)
        fetchPairs()
      }
    } finally {
      setUploading(false)
    }
  }

  // UI
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-semibold mr-4">
          About Us — Before / After Videos
        </h2>
        <button
          onClick={fetchPairs}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors duration-150 shadow-sm"
          title="Refresh data"
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : '⟳ Refresh'}
        </button>
      </div>
      <p className="text-sm text-slate-600 mb-4">
        Upload before/after video pairs. First upload the <b>Before</b> video,
        then the <b>After</b> video.
      </p>
      <div className="bg-white rounded-lg border p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block font-semibold mb-2 text-slate-800">
              Before Video
            </label>
            <input
              type="file"
              accept="video/*"
              disabled={uploading || beforeVideo}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#cff000] file:text-slate-900 hover:file:bg-lime-200"
              onChange={(e) =>
                e.target.files && handleBeforeUpload(e.target.files[0])
              }
            />
            {beforeVideo && (
              <div className="mt-3 flex flex-col items-center">
                <HlsVideoPlayer
                  src={beforeVideo.hlsUrl || beforeVideo.src}
                  poster={beforeVideo.poster}
                  style={{ maxWidth: 220, borderRadius: 8 }}
                />
                <div className="text-center text-xs mt-2 font-medium text-slate-700">
                  Before
                </div>
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-2 text-slate-800">
              After Video
            </label>
            <input
              type="file"
              accept="video/*"
              disabled={uploading || !beforeVideo || afterVideo}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#cff000] file:text-slate-900 hover:file:bg-lime-200"
              onChange={(e) =>
                e.target.files && handleAfterUpload(e.target.files[0])
              }
            />
            {afterVideo && (
              <div className="mt-3 flex flex-col items-center">
                <HlsVideoPlayer
                  src={afterVideo.hlsUrl || afterVideo.src}
                  poster={afterVideo.poster}
                  style={{ maxWidth: 220, borderRadius: 8 }}
                />
                <div className="text-center text-xs mt-2 font-medium text-slate-700">
                  After
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Saved Before/After Pairs</h3>
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
                    src={pair.before.hlsUrl || pair.before.src}
                    poster={pair.before.poster}
                    style={{ maxWidth: 220, borderRadius: 8 }}
                  />
                </div>
                <div>
                  <div className="text-center font-semibold mb-2 text-slate-800">
                    After
                  </div>
                  <HlsVideoPlayer
                    src={pair.after.hlsUrl || pair.after.src}
                    poster={pair.after.poster}
                    style={{ maxWidth: 220, borderRadius: 8 }}
                  />
                </div>
              </div>
            </div>
          ))}
          {pairs.length === 0 && !refreshing && (
            <div className="col-span-2 text-center text-slate-500 py-8 text-lg">
              No before/after pairs found.
            </div>
          )}
        </div>
      </div>
      {/* ...existing extra graphics section... */}
      <div className="mt-10">
        <div className="flex items-center mb-2">
          <h3 className="text-xl font-semibold mr-4">
            About Us — Extra Graphics
          </h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Manage extra graphics used on the About Us page (labels appear on
          preview if set).
        </p>
        <MediaListManager
          mode="image"
          category="extras"
          subsection="about_us"
        />
      </div>
    </div>
  )
}
