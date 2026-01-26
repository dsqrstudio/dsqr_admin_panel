// admin/components/managers/GraphicsManager.jsx
'use client'
import React, { useState } from 'react'
import DragDropUploadManager from './DragDropUploadManager'
import { ConfirmModal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { useQuery } from '@tanstack/react-query'

const API_CATEGORY = 'graphics'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function GraphicsManager({ activeSub }) {
  const active = activeSub || 'Primary Images'
  const { showToast, ToastComponent } = useToast()

  // Map active subsection to API subsection value
  const getSubsection = () => {
    switch (active) {
      case 'Primary Images':
        return 'primary-images'
      case 'Service Offered Images':
        return 'service-images'
      default:
        return 'primary-images'
    }
  }

  // Fetch graphics items using TanStack Query
  const {
    data: graphicsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['graphics-items'],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/category/${API_CATEGORY}`,
        {
          credentials: 'include',
        }
      )
      const data = await res.json()
      console.log('[GraphicsManager] Fetched data:', data)
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('Failed to load graphics items')
      }
      return data.data
    },
  })

  // Wait for backend to update before refetching
  const wait = (ms) => new Promise((res) => setTimeout(res, ms))

  // Save handler for Primary Images
  const handleSavePrimary = async () => {
    console.log('[GraphicsManager] handleSavePrimary called')
    await wait(1200)
    console.log('[GraphicsManager] About to call refetch (Primary)')
    const result = await refetch()
    console.log('[GraphicsManager] After refetch (Primary):', result.data)
    showToast('Saved successfully!', 'success')
  }

  // Save handler for Service Images
  const handleSaveService = async () => {
    console.log('[GraphicsManager] handleSaveService called')
    await wait(1200)
    console.log('[GraphicsManager] About to call refetch (Service)')
    const result = await refetch()
    console.log('[GraphicsManager] After refetch (Service):', result.data)
    showToast('Saved successfully!', 'success')
  }

  // Split graphicsData into primary and service items
  const primaryItems =
    graphicsData?.filter((item) => item.subsection === 'primary-images') || []
  const serviceItems =
    graphicsData?.filter((item) => item.subsection === 'service-images') || []

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [multiDeleteConfirm, setMultiDeleteConfirm] = useState(false)
  const allItems = active === 'Primary Images' ? primaryItems : serviceItems
  const allIds = allItems.map((item) => item._id || item.id)
  const isAllSelected =
    allIds.length > 0 && selectedIds.length === allIds.length

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
    setMultiDeleteConfirm(true)
  }

  const confirmDeleteSelected = async () => {
    setMultiDeleteConfirm(false)
    if (!selectedIds.length) return
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/${id}`,
            {
              method: 'DELETE',
              credentials: 'include',
            }
          )
        })
      )
      showToast('Deleted selected items', 'success')
    } catch (err) {
      showToast('Failed to delete some items', 'error')
    }
    await wait(800)
    refetch()
    setSelectedIds([])
    setSelectMode(false)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-900 mr-4">
          Graphics Manager
        </h2>
        <button
          onClick={() => {
            refetch()
            showToast('Refreshing data...', 'info')
          }}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors duration-150 shadow-sm"
          title="Refresh data"
        >
          &#x21bb; Refresh
        </button>
        {/*
        <button
          className="ml-4 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors duration-150 shadow-sm"
          onClick={() => setSelectMode((m) => !m)}
        >
          {selectMode ? 'Cancel Multi-Select' : 'Select Multiple'}
        </button>
        */}
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
          Primary images used as hero / main banners across the site.
        </div>
        {isLoading ? (
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
            onUploadSuccess={handleSavePrimary}
            onDeleteSuccess={handleSavePrimary}
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
        {isLoading ? (
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
            onUploadSuccess={handleSaveService}
            onDeleteSuccess={handleSaveService}
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
