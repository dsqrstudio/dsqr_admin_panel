'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DragDropUploadManager from './DragDropUploadManager'
import { useToast } from '@/components/ui/toast'

// --- CATEGORY/SUBSECTION MAPPING ---
const MENU_MAP = {
  // Home section
  'Portfolio Video': { category: 'home_portfolio_video', subsection: 'home-portfolio' },
  'Services Offered': { category: 'test', subsection: 'home-service-offered' },
  // Videos section
  'Videos Portfolio': { category: 'video_portfolio_video', subsection: 'video-portfolio' },
  'Videos Service Offered': { category: 'test', subsection: 'video-service-offered' },
  // Fallbacks for sidebar label
  'Service Offered': { category: 'test', subsection: 'video-service-offered' },
  // Our Work section
  'Our Work Portfolio': { category: 'test', subsection: 'ourwork-portfolio' },
  'Our Work Service Offered': { category: 'test', subsection: 'ourwork-service-offered' },
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const VideoManager = ({ activeSub }) => {
  const queryClient = useQueryClient()
  const active = activeSub || 'Home Service Offered Video'

  // Determine Category map
  let category = 'test'
  let subsection = 'service_offered'
  if (active === 'Videos Portfolio') {
    subsection = 'video-portfolio'
  } else if (['Portfolio Video', 'Home Portfolio Video', 'Home-Portfolio'].includes(active)) {
    subsection = 'home-portfolio'
  } else if (MENU_MAP[active]) {
    category = MENU_MAP[active].category
    subsection = MENU_MAP[active].subsection
  }

  const [videoItems, setVideoItems] = useState([])
  const { showToast, ToastComponent } = useToast()

  // --- React Query Fetch ---
  const { data: serverData, isLoading, isFetching } = useQuery({
    queryKey: ['admin-media-items', category, subsection],
    queryFn: async () => {
      if (!category) return []
      const res = await fetch(
        `${API_BASE_URL}/api/admin/media-items/category/${category}?subsection=${subsection}&_t=${Date.now()}`,
        { credentials: 'include' }
      )
      if (!res.ok) throw new Error('Fetch failed')
      const result = await res.json()
      if (result?.success && Array.isArray(result.data)) return result.data
      return []
    },
    onError: () => showToast('Failed to load videos', 'error'),
  })

  // Synchronize server state natively into UI bucket
  useEffect(() => {
    if (serverData) setVideoItems(serverData)
  }, [serverData])

  const triggerRefresh = () => {
    queryClient.invalidateQueries(['admin-media-items', category, subsection])
    showToast('Videos refreshed!', 'success')
  }

  const handleDragChange = (newItems) => {
    setVideoItems(newItems)
    queryClient.invalidateQueries(['admin-media-items', category, subsection])
  }

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
          onClick={triggerRefresh}
          disabled={isLoading || isFetching}
          style={{ minWidth: 100 }}
        >
          {isLoading || isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="text-sm text-slate-600 mb-3">
          {active}
        </div>

        <DragDropUploadManager
          mode="video"
          items={videoItems}
          category={category}
          subsection={subsection}
          maxItems={isPortfolioSection ? 1 : undefined}
          allowAdd={!(isPortfolioSection && videoItems.length >= 1)}
          onUploadSuccess={triggerRefresh}
          onDeleteSuccess={triggerRefresh}
          onChange={handleDragChange}
        />

        {isPortfolioSection && videoItems.length >= 1 && (
          <div className="text-slate-500 text-sm">
            Only one portfolio video is allowed.
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoManager
