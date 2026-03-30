// admin/components/managers/GraphicsManager.jsx
'use client'
import React, { useState, useEffect } from 'react'
import DragDropUploadManager from './DragDropUploadManager'
import { ConfirmModal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const API_CATEGORY = 'graphics'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function GraphicsManager({ activeSub }) {
  const queryClient = useQueryClient()
  const active = activeSub || 'Primary Images'
  const { showToast, ToastComponent } = useToast()

  // Local state arrays for optimistic UI handling
  const [primaryItems, setPrimaryItems] = useState([])
  const [serviceItems, setServiceItems] = useState([])

  // Fetch graphics items using strictly typed TanStack Query
  const {
    data: serverData,
    isLoading,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ['admin-media-items', API_CATEGORY],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/media-items/category/${API_CATEGORY}?_t=${Date.now()}`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json()
      if (!data.success || !Array.isArray(data.data)) throw new Error('Failed to load graphics items')
      return data.data
    },
    onError: () => showToast('Failed to load graphics items', 'error')
  })

  // Synchronize server cache neatly into the UI local buckets
  useEffect(() => {
    if (serverData) {
      setPrimaryItems(serverData.filter((item) => item.subsection === 'primary-images'))
      setServiceItems(serverData.filter((item) => item.subsection === 'service-images'))
    }
  }, [serverData])

  const triggerRefresh = () => {
    queryClient.invalidateQueries(['admin-media-items', API_CATEGORY])
  }

  // Handler for optimistic drag-and-drop reordering
  const handleOrderChangePrimary = (newItems) => {
    setPrimaryItems(newItems)
    triggerRefresh() 
  }

  const handleOrderChangeService = (newItems) => {
    setServiceItems(newItems)
    triggerRefresh()
  }

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [multiDeleteConfirm, setMultiDeleteConfirm] = useState(false)
  const allItems = active === 'Primary Images' ? primaryItems : serviceItems
  const allIds = allItems.map((item) => item._id || item.id)
  const isAllSelected = allIds.length > 0 && selectedIds.length === allIds.length

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(allIds)
    else setSelectedIds([])
  }
  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleDeleteSelected = () => {
    if (!selectedIds.length) return
    setMultiDeleteConfirm(true)
  }

  const confirmDeleteSelected = async () => {
    setMultiDeleteConfirm(false)
    if (!selectedIds.length) return
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          await fetch(`${API_BASE_URL}/api/admin/media-items/${id}?_t=${Date.now()}`, {
            method: 'DELETE',
            credentials: 'include',
          })
        }),
      )
      showToast('Deleted selected items', 'success')
      setSelectedIds([])
      setSelectMode(false)
      triggerRefresh()
    } catch (err) {
      showToast('Failed to delete some items', 'error')
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-900 mr-4">
          Graphics Manager
        </h2>
        <button
          onClick={triggerRefresh}
          disabled={isLoading || isRefetching}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors duration-150 shadow-sm"
          title="Refresh data"
        >
          {isLoading || isRefetching ? 'Refreshing...' : '⟳ Refresh'}
        </button>
        {selectMode && (
          <div className="ml-8 flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
            />
            <span>Select All</span>
            <span className="ml-2 text-xs text-slate-600 font-semibold">
              Selected: {selectedIds.length}
            </span>
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
      {ToastComponent}
      <ConfirmModal
        isOpen={multiDeleteConfirm}
        onClose={() => setMultiDeleteConfirm(false)}
        onConfirm={confirmDeleteSelected}
        title="Delete Selected Items"
        message="Are you sure you want to delete the selected items? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Primary Images */}
      <div className={active === 'Primary Images' ? 'block' : 'hidden'}>
        <div className="mb-4 text-sm text-slate-600">
          Primary images used as hero / main banner.
        </div>
        {isLoading && primaryItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : isError ? (
          <div className="text-center py-8 text-red-500">
            Failed to load graphics items
          </div>
        ) : (
          <DragDropUploadManager
            mode="image"
            category={API_CATEGORY}
            subsection="primary-images"
            items={primaryItems}
            onUploadSuccess={triggerRefresh}
            onDeleteSuccess={triggerRefresh}
            onChange={handleOrderChangePrimary}
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

      {/* Service Offered Images */}
      <div className={active === 'Service Offered Images' ? 'block' : 'hidden'}>
        <div className="mb-3 text-sm text-slate-600">
          Images used in service cards and service-specific content.
        </div>
        {isLoading && serviceItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : isError ? (
          <div className="text-center py-8 text-red-500">
            Failed to load graphics items
          </div>
        ) : (
          <DragDropUploadManager
            mode="image"
            category={API_CATEGORY}
            subsection="service-images"
            items={serviceItems}
            onUploadSuccess={triggerRefresh}
            onDeleteSuccess={triggerRefresh}
            onChange={handleOrderChangeService}
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
