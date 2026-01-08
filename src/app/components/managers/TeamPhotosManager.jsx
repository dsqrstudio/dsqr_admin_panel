// admin/components/managers/TeamPhotosManager.jsx
'use client'
import React, { useState, useEffect } from 'react'
import DragDropUploadManager from './DragDropUploadManager'

const API_CATEGORY = 'team_photos'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function TeamPhotosManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch items function
  const fetchItems = () => {
    setLoading(true)
    fetch(`${API_BASE_URL}/api/admin/media-items/category/${API_CATEGORY}`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setItems(data.data)
        } else {
          setItems([])
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  // Fetch items on mount
  useEffect(() => {
    fetchItems()
  }, [])

  // Refresh handler
  const handleRefresh = () => {
    fetchItems()
  }

  // Save handler
  const handleSave = async (newItems) => {
    setItems(newItems)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-slate-900">
          Team Photos Manager
        </h2>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors duration-150 shadow-sm"
          title="Refresh data"
          disabled={loading}
        >
          &#x21bb; Refresh
        </button>
      </div>

      <div className="mb-4 text-sm text-slate-600">
        Manage team member photos. Upload, reorder, or delete team photos.
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : (
        <DragDropUploadManager
          mode="image"
          category={API_CATEGORY}
          subsection="default"
          items={items}
          onChange={handleSave}
        />
      )}
    </div>
  )
}
