'use client'
import React, { useEffect, useState, useCallback } from 'react'
import DragDropUploadManager from './DragDropUploadManager'
import { useToast } from '@/components/ui/toast'

// --- CATEGORY/SUBSECTION MAPPING ---
const MENU_MAP = {
  // Home section
  'Portfolio Video': {
    category: 'home_portfolio_video',
    subsection: 'home-portfolio',
  },
  'Services Offered': { category: 'test', subsection: 'home-service-offered' },
  // Videos section
  'Videos Portfolio': {
    category: 'video_portfolio_video',
    subsection: 'video-portfolio',
  },
  'Videos Service Offered': {
    category: 'test',
    subsection: 'video-service-offered',
  },
  // Fallbacks for sidebar label
  'Service Offered': { category: 'test', subsection: 'video-service-offered' },
  // Our Work section
  'Our Work Portfolio': { category: 'test', subsection: 'ourwork-portfolio' },
  'Our Work Service Offered': {
    category: 'test',
    subsection: 'ourwork-service-offered',
  },
}

const VideoManager = ({ activeSub }) => {
  console.log('[VideoManager] activeSub:', activeSub)
  const active = activeSub || 'Home Service Offered Video'
  console.log('[VideoManager] active:', active)

  // Only allow correct mapping for each menu
  let category = 'test'
  let subsection = 'service_offered'
  if (active === 'Videos Portfolio') {
    subsection = 'video-portfolio'
  } else if (
    active === 'Portfolio Video' ||
    active === 'Home Portfolio Video' ||
    active === 'Home-Portfolio'
  ) {
    subsection = 'home-portfolio'
  } else if (MENU_MAP[active]) {
    category = MENU_MAP[active].category
    subsection = MENU_MAP[active].subsection
  }

  const [videoItems, setVideoItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const fetchVideos = useCallback(() => {
    if (!category) return
    setLoading(true)
    setRefreshing(true)
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/category/${category}?subsection=${subsection}`,
      {
        credentials: 'include',
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) {
          setVideoItems(data.data)
          showToast('Videos refreshed!', 'success')
        } else {
          setVideoItems([])
          showToast('Failed to load videos', 'error')
        }
      })
      .catch(() => {
        setVideoItems([])
        showToast('Failed to load videos', 'error')
      })
      .finally(() => {
        setLoading(false)
        setTimeout(() => setRefreshing(false), 800)
      })
  }, [category, subsection, showToast])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  // Helper to check if we are in a single-video restricted section
  const isPortfolioSection = [
    'Videos Portfolio',
    'Portfolio Video',
    'Home Portfolio Video',
    'Home-Portfolio',
  ].includes(active)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {ToastComponent}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-slate-900">Video Manager</h2>
        <button
          className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold border border-slate-300 transition"
          onClick={fetchVideos}
          disabled={loading}
          style={{ minWidth: 100 }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="text-sm text-slate-600 mb-3">
          {active} — add thumbnails for each video (poster required).
        </div>

        <DragDropUploadManager
          mode="video"
          items={videoItems}
          category={category}
          subsection={subsection}
          maxItems={isPortfolioSection ? 1 : undefined}
          allowAdd={!(isPortfolioSection && videoItems.length >= 1)}
          onUploadSuccess={fetchVideos}
          onDeleteSuccess={fetchVideos}
        />

        {/* FIX: Wrapped the condition in curly braces */}
        {isPortfolioSection && videoItems.length >= 1 && (
          <div className="text-slate-500 text-sm">
            Only one portfolio video is allowed. Delete the existing video to
            upload a new one.
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoManager
