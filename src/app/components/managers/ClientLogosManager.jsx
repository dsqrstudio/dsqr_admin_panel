'use client'
import React, { useState, useEffect } from 'react'
import DragDropUploadManager from './DragDropUploadManager'
import { useToast } from '@/components/ui/toast'

const CLIENT_LOGOS_CATEGORY = 'client_logos'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function ClientLogosManager({ title = 'Client Logos' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { showToast, ToastComponent } = useToast()
  const [refreshing, setRefreshing] = useState(false)

  const fetchLogos = async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/media-items/category/${CLIENT_LOGOS_CATEGORY}`,
        {
          credentials: 'include',
        },
      )
      if (response.ok) {
        const data = await response.json()
        setItems(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load client logos:', error)
      showToast('Failed to load client logos', 'error')
    } finally {
      setLoading(false)
      setTimeout(() => setRefreshing(false), 800)
    }
  }

  const handleOrderChange = async (newOrder) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/reorder/media-items`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ order: newOrder }),
        },
      )
      if (res.ok) {
        showToast('Order updated!', 'success')
        fetchLogos()
      } else {
        showToast('Failed to update order', 'error')
      }
    } catch (err) {
      showToast('Error updating order', 'error')
    }
  }

  useEffect(() => {
    fetchLogos()
  }, []) // Removed showToast from dependency to prevent infinite loops

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
          await fetch(
            `${API_BASE_URL}/api/admin/media-items/${id}`,
            {
              method: 'DELETE',
              credentials: 'include',
            },
          )
        }),
      )
      showToast('Items deleted successfully', 'success')
    } catch (err) {
      showToast('Error deleting items', 'error')
    }
    setSelectedIds([])
    setSelectMode(false)
    fetchLogos()
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
            onClick={fetchLogos}
            className="ml-auto px-4 py-2 rounded-lg bg-[#cff000] text-black font-medium text-sm shadow hover:bg-[#b8dc00] transition-colors"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Upload and manage client logos. Images will be stored in the
        Client_logos folder.
      </p>

      {/* Content Section */}
      <div className="bg-white rounded-lg shadow p-6">
        {loading && !refreshing ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <DragDropUploadManager
            mode="image"
            category={CLIENT_LOGOS_CATEGORY}
            subsection="logos"
            items={items}
            onChange={handleOrderChange}
            onUploadSuccess={fetchLogos}
            onDeleteSuccess={fetchLogos}
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