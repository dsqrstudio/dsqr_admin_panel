'use client'
import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DragDropUploadManager from './DragDropUploadManager'
import AffiliateExtraGraphicSection from './AffiliateExtraGraphicSection'
import { useToast } from '@/components/ui/toast'

const AFFILIATES_CATEGORY = 'affiliated'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function AffiliatedManager() {
  const queryClient = useQueryClient()
  const [items, setItems] = useState([])
  const { showToast, ToastComponent } = useToast()

  // --- React Query Fetch ---
  const { data: serverData, isLoading, isFetching } = useQuery({
    queryKey: ['admin-media-items', AFFILIATES_CATEGORY],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/admin/media-items/category/${AFFILIATES_CATEGORY}?_t=${Date.now()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json()
      if (data?.success && Array.isArray(data.data)) return data.data
      return []
    },
    onError: () => showToast('Failed to load affiliate items', 'error'),
  })

  // Synchronize server cache neatly into the UI local buckets
  useEffect(() => {
    if (serverData) setItems(serverData)
  }, [serverData])

  const triggerRefresh = () => {
    queryClient.invalidateQueries(['admin-media-items', AFFILIATES_CATEGORY])
  }

  const handleOrderChange = (newItems) => {
    setItems(newItems)
    triggerRefresh()
  }

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const allIds = items.map((item) => item._id || item.id)
  const isAllSelected = allIds.length > 0 && selectedIds.length === allIds.length

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(allIds)
    else setSelectedIds([])
  }
  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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
        })
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
    <div className="w-full max-w-7xl mx-auto">
      {ToastComponent}
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-semibold mr-4">
          Affiliates — Promotional Modal Images
        </h2>
        <button
          onClick={triggerRefresh}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors duration-150 shadow-sm"
          title="Refresh data"
          disabled={isLoading || isFetching}
        >
          {isLoading || isFetching ? 'Refreshing...' : '⟳ Refresh'}
        </button>
        {selectMode && (
          <div className="ml-8 flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
            />
            <span>Select All</span>
            <button
              className="ml-2 px-2 py-1 rounded bg-red-500 text-white text-xs"
              onClick={handleDeleteSelected}
              disabled={!selectedIds.length}
            >
              Delete
            </button>
          </div>
        )}
      </div>
      <p className="text-sm text-slate-600 mb-3">
        Manage images used in affiliate or promotional modals. Upload images
        directly with drag-and-drop reordering.
      </p>
      {isLoading && items.length === 0 ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : (
        <DragDropUploadManager
          mode="image"
          category={AFFILIATES_CATEGORY}
          subsection="default"
          items={items}
          onChange={handleOrderChange}
          onUploadSuccess={triggerRefresh}
          onDeleteSuccess={triggerRefresh}
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
      <AffiliateExtraGraphicSection />
    </div>
  )
}
