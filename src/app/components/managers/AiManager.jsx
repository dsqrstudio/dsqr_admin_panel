// admin/components/managers/AiManager.jsx
'use client'
import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DragDropUploadManager from './DragDropUploadManager'
import { useToast } from '@/components/ui/toast'

const API_CATEGORY = 'ai_lab'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function AiManager({ activeSub }) {
  const queryClient = useQueryClient()
  const active = activeSub || 'Primary Graphics'

  const [allItems, setAllItems] = useState([])
  const { showToast, ToastComponent } = useToast()

  // --- React Query Fetch ---
  const { data: serverData, isLoading: loading, isFetching: refreshing } = useQuery({
    queryKey: ['admin-media-items', API_CATEGORY],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/admin/media-items/category/${API_CATEGORY}?_t=${Date.now()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Fetch failed')
      const result = await res.json()
      if (result.success && Array.isArray(result.data)) return result.data
      return []
    },
    onError: () => showToast('Failed to load AI Lab items', 'error'),
  })

  // Sync server data naturally
  useEffect(() => {
    if (serverData) setAllItems(serverData)
  }, [serverData])

  const triggerRefresh = () => {
    queryClient.invalidateQueries(['admin-media-items', API_CATEGORY])
  }

  // Filter items by subsection and type
  const serviceOfferedVideoItems = allItems.filter(
    (item) => item.subsection === 'service_offered' && item.type === 'video'
  )
  const primaryGraphicsItems = allItems.filter(
    (item) => item.subsection === 'primary_graphics'
  )

  // Save handler (optimistic local update)
  const handleSave = async (newItems) => {
    if (newItems.length >= allItems.length) {
      showToast('Saved successfully!', 'success')
    }
    setAllItems(newItems)
    triggerRefresh()
  }

  // Multi-select state for primary graphics
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const allPrimaryIds = primaryGraphicsItems.map((item) => item._id || item.id)
  const isAllSelected =
    allPrimaryIds.length > 0 && selectedIds.length === allPrimaryIds.length

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(allPrimaryIds)
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
          await fetch(
            `${API_BASE_URL}/api/admin/media-items/${id}?_t=${Date.now()}`,
            {
              method: 'DELETE',
              credentials: 'include',
            }
          )
        })
      )
      showToast('Deleted selected items', 'success')
      setSelectedIds([])
      setSelectMode(false)
      triggerRefresh()
    } catch (err) {
      showToast('Failed to delete some items', 'error')
    }
  }

  if (loading && allItems.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-slate-900">
          AI Lab — Manager
        </h2>
        {ToastComponent}
        <div className="text-center py-8 text-slate-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-900 mr-4">
          AI Lab — Manager
        </h2>
        <button
          onClick={triggerRefresh}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors duration-150 shadow-sm"
          title="Refresh data"
          disabled={loading || refreshing}
        >
          {loading || refreshing ? 'Refreshing...' : '⟳ Refresh'}
        </button>
      </div>
      {ToastComponent}

      {/* Service Offered Video Only (when active === "Service Offered Videos") */}
      <div className={active === 'Service Offered Videos' ? 'block' : 'hidden'}>
        <div className="mb-4 text-sm text-slate-600">
          <b>Service Offered Video</b> — Upload and manage videos for
          AI-generated service showcases.
        </div>
        <div className="mb-6">
          <DragDropUploadManager
            mode="video"
            category="ai_lab"
            subsection="service_offered"
            items={serviceOfferedVideoItems}
            onChange={handleSave}
            allowAdd={true}
            onUploadSuccess={triggerRefresh}
            onDeleteSuccess={triggerRefresh}
          />
        </div>
      </div>

      {/* Primary Graphics (visible when active === "Primary Graphics") */}
      <div className={active === 'Primary Graphics' ? 'block' : 'hidden'}>
        <div className="mb-4 text-sm text-slate-600">
          Primary Graphics — images used by AI flows for hero/primary graphics
          generation and previews.
        </div>
        <div className="flex items-center mb-4">
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
        <DragDropUploadManager
          mode="image"
          category="ai_lab"
          subsection="primary_graphics"
          items={primaryGraphicsItems}
          onChange={handleSave}
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
      </div>
    </div>
  )
}
