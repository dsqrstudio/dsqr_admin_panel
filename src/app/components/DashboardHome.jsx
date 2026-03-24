'use client'
import React, { useState, useEffect } from 'react'
import {
  FiImage,
  FiVideo,
  FiUploadCloud,
  FiFolder,
  FiEdit2,
  FiX,
  FiCheck,
  FiTag,
} from 'react-icons/fi'
import { useToast } from '@/components/ui/toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function DashboardHome() {
  const { showToast, ToastComponent } = useToast()

  const [stats, setStats] = useState({
    totalItems: 0,
    totalVideos: 0,
    totalImages: 0,
    recentUploads: [],
    portfolioVideos: 0,
    beforeAfterVideos: 0,
  })

  const [ourWorkStats, setOurWorkStats] = useState({
    videosEdited: '...',
    clientTimeSaved: '...',
    organicViews: '...',
    timeSavedPerClient: '...',
  })

  const [editingStats, setEditingStats] = useState(false)
  const [tempStats, setTempStats] = useState(ourWorkStats)

  const [discount, setDiscount] = useState({
    enabled: false,
    percentage: 30,
    name: 'Black Friday Sale',
  })

  const [editingDiscount, setEditingDiscount] = useState(false)
  const [tempDiscount, setTempDiscount] = useState(discount)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/dashboard-stats?_t=\${Date.now()}`,
          {
            credentials: 'include',
          }
        )

        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchOurWorkStats = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/settings/ourWorkStats?_t=\${Date.now()}`,
          {
            credentials: 'include',
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setOurWorkStats(data.data)
            setTempStats(data.data)
          }
        }
      } catch (error) {
        console.error('Failed to load our work stats:', error)
      }
    }

    const fetchDiscount = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/settings/promotionalDiscount?_t=\${Date.now()}`,
          {
            credentials: 'include',
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setDiscount(data.data)
            setTempDiscount(data.data)
          }
        }
      } catch (error) {
        console.error('Failed to load promotional discount:', error)
      }
    }

    fetchStats()
    fetchOurWorkStats()
    fetchDiscount()
  }, [])

  const handleSaveStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/ourWorkStats?_t=\${Date.now()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ data: tempStats }),
        }
      )

      if (response.ok) {
        setOurWorkStats(tempStats)
        setEditingStats(false)
        showToast('Our Work stats saved successfully!', 'success')
      } else {
        showToast('Failed to save stats', 'error')
      }
    } catch (error) {
      console.error('Failed to save stats:', error)
      showToast('Failed to save stats', 'error')
    }
  }

  const handleCancelStats = () => {
    setTempStats(ourWorkStats)
    setEditingStats(false)
  }

  const handleSaveDiscount = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/promotionalDiscount?_t=\${Date.now()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ data: tempDiscount }),
        }
      )

      if (response.ok) {
        setDiscount(tempDiscount)
        setEditingDiscount(false)
        showToast('Promotional discount saved successfully!', 'success')
      } else {
        showToast('Failed to save discount', 'error')
      }
    } catch (error) {
      console.error('Failed to save discount:', error)
      showToast('Failed to save discount', 'error')
    }
  }

  const handleToggleDiscount = async (e) => {
    const newEnabledState = e.target.checked
    const updatedDiscount = { ...discount, enabled: newEnabledState }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/promotionalDiscount?_t=\${Date.now()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ data: updatedDiscount }),
        }
      )

      if (response.ok) {
        setDiscount(updatedDiscount)
        showToast(
          `Promotional discount ${newEnabledState ? 'enabled' : 'disabled'}`,
          'success'
        )
      } else {
        showToast('Failed to update discount status', 'error')
      }
    } catch (error) {
      console.error('Failed to toggle discount:', error)
      showToast('Failed to update discount status', 'error')
    }
  }

  const handleCancelDiscount = () => {
    setTempDiscount(discount)
    setEditingDiscount(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
      {ToastComponent}
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm lg:text-base">
          Welcome back! Here&apos;s an overview of your media content.
        </p>
      </div>

      {/* Don't Tips Box */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border-2 border-green-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">!</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-bold text-green-900 mb-2">
              Don&apos;t
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5">•</span>
                <span>
                  <strong>
                    Never delete files directly from Bunny Storage.
                  </strong>{' '}
                  Always use the admin panel delete button to ensure database
                  records are also removed and everything stays in sync.
                </span>
              </li>
              {/* Add more tips here in the future */}
            </ul>
          </div>
        </div>
      </div>

      {/* Our Work Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8 hover:shadow-md transition-shadow duration-300 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
              Our Work
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Performance metrics and achievements
            </p>
          </div>
          <button
            onClick={() => setEditingStats(true)}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#cff000] rounded-lg font-medium text-sm hover:bg-[#b8dc00] transition-colors duration-200"
          >
            <FiEdit2 className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
              {ourWorkStats.videosEdited}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-600 font-medium">
              Videos Edited
            </div>
          </div>

          <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
              {ourWorkStats.clientTimeSaved}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-600 font-medium">
              Client Time Saved
            </div>
          </div>

          <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
              {ourWorkStats.organicViews}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-600 font-medium">
              Organic Views
            </div>
          </div>

          <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
              {ourWorkStats.timeSavedPerClient}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-600 font-medium">
              Time Saved/Client
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Discount */}
      {/* <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-300 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-lg bg-slate-200">
              <FiTag className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Promotional Discount
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Special offers and deals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs sm:text-sm font-medium text-slate-700">
                Enable
              </span>
              <input
                type="checkbox"
                checked={discount.enabled}
                onChange={handleToggleDiscount}
                className="w-5 h-5 rounded border-slate-300 text-[#cff000] focus:ring-[#cff000]"
              />
            </label>
            <button
              onClick={() => setEditingDiscount(true)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#cff000] rounded-lg font-medium text-sm hover:bg-[#b8dc00] transition-colors duration-200"
            >
              <FiEdit2 className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          </div>
        </div>

        {discount.enabled && (
          <div className="bg-white rounded-lg p-4 sm:p-6 border border-slate-300 shadow-sm">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-slate-700 mb-2">
                {discount.percentage}% OFF
              </div>
              <div className="text-sm sm:text-base text-slate-600 font-semibold">
                {discount.name}
              </div>
            </div>
          </div>
        )}
      </div> */}

      {/* Media Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <FiFolder className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-slate-600 mb-1 font-medium">
              Total Items
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
              {loading ? '...' : stats.totalItems}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
              <FiVideo className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-slate-600 mb-1 font-medium">
              Total Videos
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
              {loading ? '...' : stats.totalVideos}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600">
              <FiImage className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-slate-600 mb-1 font-medium">
              Total Images
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
              {loading ? '...' : stats.totalImages}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600">
              <FiVideo className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-slate-600 mb-1 font-medium">
              Before/After
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
              {loading ? '...' : stats.beforeAfterVideos}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-red-600 to-rose-600">
              <FiVideo className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-slate-600 mb-1 font-medium">
              Portfolio
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
              {loading ? '...' : stats.portfolioVideos}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Recent Activity
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Latest uploads and changes
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#cff000] mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Loading...</p>
          </div>
        ) : stats.recentUploads && stats.recentUploads.length > 0 ? (
          <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {stats.recentUploads.slice(0, 10).map((upload, index) => (
              <div
                key={index}
                className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  {upload.type === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <FiVideo className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600" />
                    </div>
                  ) : (
                    <img
                      src={upload.src || upload.poster}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                    {upload.category || 'Unknown Category'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                    {upload.subsection || 'General'} • {upload.type}
                  </p>
                </div>
                <div className="shrink-0 text-[10px] sm:text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                  {new Date(upload.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiUploadCloud className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No recent uploads yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Upload some media to see recent activity here
            </p>
          </div>
        )}
      </div>

      {/* Edit Stats Modal */}
      {editingStats && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
              Edit Our Work Stats
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Videos Edited
                </label>
                <input
                  type="text"
                  value={tempStats.videosEdited}
                  onChange={(e) =>
                    setTempStats({ ...tempStats, videosEdited: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#cff000] focus:border-[#cff000] outline-none"
                  placeholder="e.g., 11,000+"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Client Time Saved
                </label>
                <input
                  type="text"
                  value={tempStats.clientTimeSaved}
                  onChange={(e) =>
                    setTempStats({
                      ...tempStats,
                      clientTimeSaved: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#cff000] focus:border-[#cff000] outline-none"
                  placeholder="e.g., 54k+"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Organic Views Generated
                </label>
                <input
                  type="text"
                  value={tempStats.organicViews}
                  onChange={(e) =>
                    setTempStats({ ...tempStats, organicViews: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#cff000] focus:border-[#cff000] outline-none"
                  placeholder="e.g., 22M+"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Time Saved Per Client
                </label>
                <input
                  type="text"
                  value={tempStats.timeSavedPerClient}
                  onChange={(e) =>
                    setTempStats({
                      ...tempStats,
                      timeSavedPerClient: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#cff000] focus:border-[#cff000] outline-none"
                  placeholder="e.g., 4h/Day"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSaveStats}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#cff000] rounded-lg font-semibold hover:bg-[#b8dc00] transition-colors"
              >
                <FiCheck className="h-5 w-5" />
                Save
              </button>
              <button
                onClick={handleCancelStats}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-200 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
              >
                <FiX className="h-5 w-5" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Discount Modal */}
      {editingDiscount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
              Edit Discount
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tempDiscount.percentage}
                  onChange={(e) =>
                    setTempDiscount({
                      ...tempDiscount,
                      percentage: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#cff000] focus:border-[#cff000] outline-none"
                  placeholder="e.g., 30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Promotion Name
                </label>
                <input
                  type="text"
                  value={tempDiscount.name}
                  onChange={(e) =>
                    setTempDiscount({ ...tempDiscount, name: e.target.value })
                  }
                  placeholder="e.g., Black Friday Sale"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#cff000] focus:border-[#cff000] outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSaveDiscount}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#cff000] rounded-lg font-semibold hover:bg-[#b8dc00] transition-colors"
              >
                <FiCheck className="h-5 w-5" />
                Save
              </button>
              <button
                onClick={handleCancelDiscount}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-200 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
              >
                <FiX className="h-5 w-5" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
