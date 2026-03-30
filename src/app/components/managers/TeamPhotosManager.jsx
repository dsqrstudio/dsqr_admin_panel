// admin/components/managers/TeamPhotosManager.jsx
'use client'
import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DragDropUploadManager from './DragDropUploadManager'
import { useToast } from '@/components/ui/toast'

const API_CATEGORY = 'team_photos'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function TeamPhotosManager() {
  const queryClient = useQueryClient()
  const [items, setItems] = useState([])
  const { showToast, ToastComponent } = useToast()

  // --- React Query Fetch ---
  const { data: serverData, isLoading, isFetching } = useQuery({
    queryKey: ['admin-media-items', API_CATEGORY],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/admin/media-items/category/${API_CATEGORY}?_t=${Date.now()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json()
      if (data?.success && Array.isArray(data.data)) return data.data
      return []
    },
    onError: () => showToast('Failed to load team photos', 'error'),
  })

  // Synchronize server cache neatly into the UI local buckets
  useEffect(() => {
    if (serverData) setItems(serverData)
  }, [serverData])

  const triggerRefresh = () => {
    queryClient.invalidateQueries(['admin-media-items', API_CATEGORY])
  }

  const handleOrderChange = (newItems) => {
    setItems(newItems)
    triggerRefresh()
  }

  return (
    <div className="max-w-7xl mx-auto">
      {ToastComponent}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-slate-900">
          Team Photos Manager
        </h2>
        <button
          onClick={triggerRefresh}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors duration-150 shadow-sm"
          title="Refresh data"
          disabled={isLoading || isFetching}
        >
          {isLoading || isFetching ? 'Refreshing...' : '⟳ Refresh'}
        </button>
      </div>

      <div className="mb-4 text-sm text-slate-600">
        Manage team member photos. Upload, reorder, or delete team photos.
      </div>

      {isLoading && items.length === 0 ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : (
        <DragDropUploadManager
          mode="image"
          category={API_CATEGORY}
          items={items}
          onUploadSuccess={triggerRefresh}
          onDeleteSuccess={triggerRefresh}
          onChange={handleOrderChange}
        />
      )}
    </div>
  )
}
