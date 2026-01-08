// admin/components/managers/AiManager.jsx
'use client'
import React, { useState, useEffect } from 'react'
import DragDropUploadManager from './DragDropUploadManager'
import { useToast } from '@/components/ui/toast'

const API_CATEGORY = 'ai_lab'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

/**
 * AiManager
 * - Shows either "Service Offered" (images/videos) or "Primary Graphics" block based on `activeSub` prop.
 * - Both blocks use DragDropUploadManager in image or video mode with drag-and-drop reordering.
 * - Usage: <AiManager activeSub={mappedSub} />
 *
 * Make sure your sidebar menu sub labels match exactly:
 *  - "Service Offered"
 *  - "Primary Graphics"
 */

export default function AiManager({ activeSub }) {
  const active = activeSub || 'Primary Graphics'
  const [allItems, setAllItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { showToast, ToastComponent } = useToast()

  // Fetch all AI Lab items
  const fetchItems = () => {
    setLoading(true)
    fetch(`${API_BASE_URL}/api/admin/media-items/category/${API_CATEGORY}`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setAllItems(data.data)
        } else {
          showToast('Failed to load AI Lab items', 'error')
          setAllItems([])
        }
      })
      .catch(() => {
        showToast('Failed to load AI Lab items', 'error')
        setAllItems([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchItems()
  }, [])

  // Filter items by subsection and type
  const serviceOfferedImageItems = allItems.filter(
    (item) => item.subsection === 'service_offered' && item.type !== 'video'
  )
  const serviceOfferedVideoItems = allItems.filter(
    (item) => item.subsection === 'service_offered' && item.type === 'video'
  )
  const primaryGraphicsItems = allItems.filter(
    (item) => item.subsection === 'primary_graphics'
  )

  // Save handler (local update only)
  const handleSave = async (newItems) => {
    setAllItems(newItems)
    showToast('Saved successfully!', 'success')
    fetchItems()
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
          await fetch(`${API_BASE_URL}/api/admin/media-items/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          })
        })
      )
      showToast('Deleted selected items', 'success')
    } catch (err) {
      showToast('Failed to delete some items', 'error')
    }
    setSelectedIds([])
    setSelectMode(false)
    fetchItems()
  }

  if (loading) {
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
          onClick={() => {
            setRefreshing(true)
            fetchItems()
            setTimeout(() => setRefreshing(false), 800)
          }}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors duration-150 shadow-sm"
          title="Refresh data"
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : '⟳ Refresh'}
        </button>
      </div>
      {ToastComponent}

      {/* Service Offered Video Only (when active === "Service Offered Images") */}
      <div className={active === 'Service Offered Images' ? 'block' : 'hidden'}>
        <div className="mb-4 text-sm text-slate-600">
          <b>Service Offered Video</b> — Upload and manage videos for
          AI-generated service demos or showcases.
        </div>
        <div className="mb-6">
          <div className="font-semibold mb-2 flex items-center gap-2">
            Videos
            <button
              className="ml-2 px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-xs border border-slate-300"
              onClick={() => {
                setRefreshing(true)
                fetchItems()
                setTimeout(() => setRefreshing(false), 800)
              }}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <DragDropUploadManager
            mode="video"
            category="ai_lab"
            subsection="service_offered"
            items={serviceOfferedVideoItems}
            onChange={handleSave}
            allowAdd={true}
            onUploadSuccess={fetchItems}
            onDeleteSuccess={fetchItems}
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
          <button
            className="ml-0 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors duration-150 shadow-sm"
            onClick={() => setSelectMode((m) => !m)}
          >
            {selectMode ? 'Cancel Multi-Select' : 'Select Multiple'}
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
        <DragDropUploadManager
          mode="image"
          category="ai_lab"
          subsection="primary_graphics"
          items={primaryGraphicsItems}
          onChange={handleSave}
          onUploadSuccess={fetchItems}
          onDeleteSuccess={fetchItems}
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
