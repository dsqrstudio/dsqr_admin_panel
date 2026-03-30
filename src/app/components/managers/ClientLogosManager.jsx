'use client'
import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DragDropUploadManager from './DragDropUploadManager'
import { useToast } from '@/components/ui/toast'

const CLIENT_LOGOS_CATEGORY = 'client_logos'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function ClientLogosManager({ title = 'Client Logos' }) {
  const queryClient = useQueryClient()
  const [items, setItems] = useState([])
  const { showToast, ToastComponent } = useToast()

  // --- React Query Fetch ---
  const { data: serverData, isLoading, isFetching } = useQuery({
    queryKey: ['admin-media-items', CLIENT_LOGOS_CATEGORY],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/media-items/category/${CLIENT_LOGOS_CATEGORY}?_t=${Date.now()}`,
        { credentials: 'include' },
      )
      if (!response.ok) throw new Error('Fetch failed')
      const data = await response.json()
      if (data?.success && Array.isArray(data.data)) return data.data
      return []
    },
    onError: () => showToast('Failed to load client logos', 'error'),
  })

  // Synchronize server cache neatly into the UI local buckets
  useEffect(() => {
    if (serverData) setItems(serverData)
  }, [serverData])

  const triggerRefresh = () => {
    queryClient.invalidateQueries(['admin-media-items', CLIENT_LOGOS_CATEGORY])
  }

  const handleOrderChange = (newItems) => {
    setItems(newItems)
    triggerRefresh()
  }

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const allIds = items.map((item) => item._id || item.id)

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return
    if (!window.confirm('Delete selected items?')) return
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          await fetch(`${API_BASE_URL}/api/admin/media-items/${id}?_t=${Date.now()}`, {
            method: 'DELETE',
            credentials: 'include',
          })
        }),
      )
      showToast('Items deleted successfully', 'success')
      setSelectedIds([])
      setSelectMode(false)
      triggerRefresh()
    } catch (err) {
      showToast('Error deleting items', 'error')
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {ToastComponent}
      
      {/* Header Section */}
      <div className="rounded-2xl bg-linear-to-br from-white to-slate-50/70 p-6 shadow-sm flex items-center mb-4">
        <h2 className="text-3xl font-bold text-slate-900 mb-2 mr-4">{title}</h2>
        
        {/* Selection Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSelectMode(!selectMode)}
            className="px-3 py-1 text-xs bg-slate-200 rounded"
          >
            {selectMode ? 'Cancel' : 'Select'}
          </button>
          {selectMode && (
            <>
              <span className="text-sm">Select All</span>
              <input 
                type="checkbox" 
                onChange={(e) => setSelectedIds(e.target.checked ? allIds : [])}
                checked={allIds.length > 0 && selectedIds.length === allIds.length}
              />
              <button
                className="ml-2 px-2 py-1 rounded bg-red-500 text-white text-xs"
                onClick={handleDeleteSelected}
                disabled={!selectedIds.length}
              >
                Delete
              </button>
            </>
          )}
          <button
            onClick={triggerRefresh}
            disabled={isLoading || isFetching}
            className="ml-auto px-4 py-2 rounded-lg bg-[#cff000] text-black font-medium text-sm shadow hover:bg-[#b8dc00] transition-colors"
          >
            {isLoading || isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Upload and manage client logos. Images will be stored in the
        Client_logos folder.
      </p>

      {/* Content Section */}
      <div className="bg-white rounded-lg shadow p-6">
        {isLoading && items.length === 0 ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <DragDropUploadManager
            mode="image"
            category={CLIENT_LOGOS_CATEGORY}
            subsection="logos"
            items={items}
            onChange={handleOrderChange}
            onUploadSuccess={triggerRefresh}
            onDeleteSuccess={triggerRefresh}
            allowAdd
            allowEdit
            allowDelete
            renderItemExtra={
              selectMode
                ? (item) => (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item._id || item.id)}
                      onChange={() => handleSelect(item._id || item.id)}
                      className="mr-2"
                    />
                  )
                : undefined
            }
          />
        )}
      </div>
    </div>
  )
}