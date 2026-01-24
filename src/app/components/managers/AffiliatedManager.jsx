// admin/components/managers/AffiliatedManager.jsx
'use client'
import React, { useState, useEffect } from 'react'
import DragDropUploadManager from './DragDropUploadManager'
import MediaListManager from './MediaListManager'
import AffiliateExtraGraphicSection from './AffiliateExtraGraphicSection'
import { useToast } from '@/components/ui/toast'

const AFFILIATES_CATEGORY = 'affiliated'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function AffiliatedManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch items on mount
  useEffect(() => {
    console.log('🤝 AffiliatedManager: Fetching items from API...')
    fetch(
      `${API_BASE_URL}/api/admin/media-items/category/${AFFILIATES_CATEGORY}`,
      {
        credentials: 'include',
      }
    )
      .then((res) => res.json())
      .then((data) => {
        console.log('📦 AffiliatedManager: API Response:', data)
        if (data.success && Array.isArray(data.data)) {
          console.log('✅ Affiliate items found:', data.data.length, data.data)
          setItems(data.data)
        } else {
          console.error('❌ AffiliatedManager: Invalid response format', data)
        }
      })
      .catch((err) => {
        console.error(
          '❌ AffiliatedManager: Failed to fetch affiliate items:',
          err
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Save handler
  const handleSave = async (newItems) => {
    setItems(newItems)
  }

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const allIds = items.map((item) => item._id || item.id)
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
    } catch (err) {
      // Optionally show error toast
    }
    setSelectedIds([])
    setSelectMode(false)
    setLoading(true)
    fetch(
      `${API_BASE_URL}/api/admin/media-items/category/${AFFILIATES_CATEGORY}`,
      { credentials: 'include' }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setItems(data.data)
        } else {
          setItems([])
        }
      })
      .catch(() => setItems([]))
      .finally(() => {
        setLoading(false)
        setTimeout(() => setRefreshing(false), 800)
      })
  }

  const [refreshing, setRefreshing] = useState(false)
  const handleRefresh = () => {
    setRefreshing(true)
    // Re-run the fetch logic
    setLoading(true)
    fetch(
      `${API_BASE_URL}/api/admin/media-items/category/${AFFILIATES_CATEGORY}`,
      { credentials: 'include' }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setItems(data.data)
        } else {
          setItems([])
        }
      })
      .catch(() => setItems([]))
      .finally(() => {
        setLoading(false)
        setTimeout(() => setRefreshing(false), 800)
      })
  }
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-semibold mr-4">
          Affiliates — Promotional Modal Images
        </h2>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors duration-150 shadow-sm"
          title="Refresh data"
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : '⟳ Refresh'}
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
      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : (
        <DragDropUploadManager
          mode="image"
          category={AFFILIATES_CATEGORY}
          subsection="default"
          items={items}
          onChange={handleSave}
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
