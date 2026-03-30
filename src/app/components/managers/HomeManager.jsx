'use client'
import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DragDropUploadManager from './DragDropUploadManager'
import { useToast } from '@/components/ui/toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function TabBar({ sections, selected, onSelect }) {
  return (
    <div className="flex gap-2 mb-6">
      {sections.map((s) => (
        <button
          key={s}
          className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
            selected === s
              ? 'bg-[#cff000] text-black shadow'
              : 'bg-slate-100 text-slate-700 hover:bg-white/70'
          }`}
          onClick={() => onSelect(s)}
          aria-pressed={selected === s}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

function PrimaryGraphicsSection() {
  const queryClient = useQueryClient()
  
  // Local state arrays for DragDropUploadManager to perform optimistic reordering
  const [primaryItems, setPrimaryItems] = useState([])
  const [stepsItems, setStepsItems] = useState([])
  const [galleryItems, setGalleryItems] = useState([])

  const PRIMARY_SUBS = ['Primary Images', 'Steps Animation Graphics', 'Image Gallery']
  const [selectedSub, setSelectedSub] = useState(PRIMARY_SUBS[0])
  const { showToast, ToastComponent } = useToast()

  // --- React Query Fetch ---
  const { data: serverData, isLoading: primaryLoading, isFetching: primaryRefetching } = useQuery({
    queryKey: ['admin-media-items', 'home-page'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/admin/media-items/category/home-page?v=${Date.now()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Fetch failed')
      const result = await res.json()
      if (result.success && Array.isArray(result.data)) {
        return result.data
      }
      return []
    },
  })

  // Synchronize perfectly into local bucket states anytime the server fetch succeeds
  useEffect(() => {
    if (serverData) {
      setPrimaryItems(serverData.filter((item) => item.subsection === 'hero-section'))
      setStepsItems(serverData.filter((item) => item.subsection === '123'))
      setGalleryItems(serverData.filter((item) => item.subsection === 'gallery-section'))
    }
  }, [serverData])

  // Triggers a true background refresh
  const triggerRefresh = () => {
    queryClient.invalidateQueries(['admin-media-items', 'home-page'])
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <div className="rounded-2xl bg-linear-to-br from-white to-slate-50/70 p-4 shadow-sm">
        <TabBar sections={PRIMARY_SUBS} selected={selectedSub} onSelect={setSelectedSub} />
      </div>

      {selectedSub === 'Primary Images' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Primary Images</h3>
            <button
              className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold border border-slate-300 transition"
              onClick={triggerRefresh}
              disabled={primaryLoading || primaryRefetching}
              style={{
                minWidth: 100,
                width: 120,
                height: 40,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ width: 80, textAlign: 'center', display: 'inline-block' }}>
                {primaryLoading || primaryRefetching ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Upload key images used in the primary hero/graphics. Drag to reorder.
          </p>
          {primaryLoading ? (
            <div>Loading...</div>
          ) : (
            <DragDropUploadManager
              mode="image"
              items={primaryItems}
              onChange={setPrimaryItems}
              onUploadSuccess={triggerRefresh}
              onDeleteSuccess={triggerRefresh}
              category="home-page"
              subsection="hero-section"
              allowAdd
              allowEdit
              allowDelete
              allowMultiSelect
              allowBulkDelete
            />
          )}
        </div>
      )}

      {selectedSub === 'Steps Animation Graphics' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Steps Animation Graphics</h3>
            <button
              className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold border border-slate-300 transition"
              onClick={triggerRefresh}
              disabled={primaryLoading || primaryRefetching}
              style={{
                minWidth: 100,
                width: 120,
                height: 40,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ width: 80, textAlign: 'center', display: 'inline-block' }}>
                {primaryLoading || primaryRefetching ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Upload images used for the steps animation section. Drag to reorder.
          </p>
          {primaryLoading ? (
            <div>Loading...</div>
          ) : (
            <DragDropUploadManager
              mode="image"
              items={stepsItems}
              onChange={setStepsItems}
              onUploadSuccess={triggerRefresh}
              onDeleteSuccess={triggerRefresh}
              category="home-page"
              subsection="123"
              allowAdd
              allowEdit
              allowDelete
              allowMultiSelect
              allowBulkDelete
            />
          )}
        </div>
      )}

      {selectedSub === 'Image Gallery' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Image Gallery</h3>
            <button
              className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold border border-slate-300 transition"
              onClick={triggerRefresh}
              disabled={primaryLoading || primaryRefetching}
              style={{
                minWidth: 100,
                width: 120,
                height: 40,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ width: 80, textAlign: 'center', display: 'inline-block' }}>
                {primaryLoading || primaryRefetching ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Upload images for the homepage gallery. Drag to reorder.
          </p>
          {primaryLoading ? (
            <div>Loading...</div>
          ) : (
            <DragDropUploadManager
              mode="image"
              items={galleryItems}
              onChange={setGalleryItems}
              onUploadSuccess={triggerRefresh}
              onDeleteSuccess={triggerRefresh}
              category="home-page"
              subsection="gallery-section"
              allowAdd
              allowEdit
              allowDelete
              allowMultiSelect
              allowBulkDelete
            />
          )}
        </div>
      )}
    </div>
  )
}

function PortfolioVideoSection() {
  const queryClient = useQueryClient()
  const [items, setItems] = useState([])

  const { data: serverData, isLoading: loading, isFetching: refreshing } = useQuery({
    queryKey: ['admin-media-items', 'home_portfolio_video'],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/media-items/category/home_portfolio_video?subsection=home-portfolio&_=${Date.now()}`,
        { credentials: 'include' }
      )
      if (!res.ok) throw new Error('Fetch failed')
      const result = await res.json()
      if (result.success && Array.isArray(result.data)) return result.data
      return []
    },
  })

  useEffect(() => {
    if (serverData) setItems(serverData)
  }, [serverData])

  const triggerRefresh = () => {
    queryClient.invalidateQueries(['admin-media-items', 'home_portfolio_video'])
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Portfolio Video</h3>
        <button
          className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold border border-slate-300 transition"
          onClick={triggerRefresh}
          disabled={loading || refreshing}
          style={{
            minWidth: 100,
            width: 120,
            height: 40,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ width: 80, textAlign: 'center', display: 'inline-block' }}>
            {loading || refreshing ? 'Refreshing...' : 'Refresh'}
          </span>
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Upload the main homepage video. Only one video can be set.
      </p>
      <DragDropUploadManager
        mode="video"
        category="home_portfolio_video"
        subsection="home-portfolio"
        items={items}
        onChange={setItems}
        onUploadSuccess={triggerRefresh}
        onDeleteSuccess={triggerRefresh}
        maxItems={1}
        endpoint="/api/admin/home-content/portfolio_video"
      />
      {loading && <div className="text-gray-500">Loading...</div>}
    </div>
  )
}

function ServicesOfferedSection() {
  const queryClient = useQueryClient()
  const [items, setItems] = useState([])

  const { data: serverData, isLoading: loading, isFetching: refreshing } = useQuery({
    queryKey: ['admin-media-items', 'home-service-offered'],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/media-items/category/services_offered?subsection=home-service-offered&_t=${Date.now()}`,
        { credentials: 'include' }
      )
      if (!res.ok) throw new Error('Fetch failed')
      const result = await res.json()
      if (result.success && Array.isArray(result.data)) return result.data
      return []
    },
  })

  useEffect(() => {
    if (serverData) setItems(serverData)
  }, [serverData])

  const triggerRefresh = () => {
    queryClient.invalidateQueries(['admin-media-items', 'home-service-offered'])
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Services Offered</h3>
        <button
          className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold border border-slate-300 transition"
          onClick={triggerRefresh}
          disabled={loading || refreshing}
          style={{
            minWidth: 100,
            width: 120,
            height: 40,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ width: 80, textAlign: 'center', display: 'inline-block' }}>
            {loading || refreshing ? 'Refreshing...' : 'Refresh'}
          </span>
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Upload and manage Service Offered videos. All videos in Bunny (home-service-offered) will be shown below.
      </p>
      <DragDropUploadManager
        mode="video"
        category="services_offered"
        subsection="home-service-offered"
        items={items}
        onChange={setItems}
        onUploadSuccess={triggerRefresh}
        onDeleteSuccess={triggerRefresh}
        allowAdd={true}
        allowEdit={true}
        allowDelete={true}
        maxItems={20}
      />
      {loading && <div className="text-gray-500">Loading...</div>}
    </div>
  )
}

export default function HomeManager({ activeSub }) {
  const topSection = activeSub || 'Primary Graphics'
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="rounded-2xl bg-linear-to-br from-white to-slate-50/70 p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Home Content Manager
        </h2>
        <p className="text-sm text-slate-600">
          Manage homepage content by section. Use the sidebar to switch between sections.
        </p>
      </div>

      {topSection === 'Primary Graphics' && <PrimaryGraphicsSection />}
      {topSection === 'Portfolio Video' && <PortfolioVideoSection />}
      {topSection === 'Services Offered' && <ServicesOfferedSection />}
    </div>
  )
}
