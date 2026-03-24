'use client'
import React, { useState, useEffect } from 'react'
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
  // Primary Images
  const [primaryItems, setPrimaryItems] = useState([])
  const [primaryLoading, setPrimaryLoading] = useState(true)
  // Steps Animation Graphics
  const [stepsItems, setStepsItems] = useState([])
  const [stepsLoading, setStepsLoading] = useState(true)
  // Image Gallery
  const [galleryItems, setGalleryItems] = useState([])
  const [galleryLoading, setGalleryLoading] = useState(true)
  // Local subcategory tabs within Primary Graphics
  const PRIMARY_SUBS = [
    'Primary Images',
    'Steps Animation Graphics',
    'Image Gallery',
  ]
  const [selectedSub, setSelectedSub] = useState(PRIMARY_SUBS[0])
  const { showToast, ToastComponent } = useToast()

  // Fetch function for refresh
  const fetchAll = () => {
    setPrimaryLoading(true)
    setStepsLoading(true)
    setGalleryLoading(true)
    // Add cache-busting param to always fetch fresh data
    fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/api/admin/media-items/category/home-page?v=${Date.now()}`,
      {
        credentials: 'include',
      }
    )
      .then((r) => r.json())
      .then((res) => {
        console.log('🏠 HomeManager: API Response:', res)
        if (res.success && Array.isArray(res.data)) {
          // Filter by subsection
          const primary = res.data.filter(
            (item) => item.subsection === 'hero-section'
          )
          const steps = res.data.filter((item) => item.subsection === '123')
          const gallery = res.data.filter(
            (item) => item.subsection === 'gallery-section'
          )

          setPrimaryItems(primary)
          setStepsItems(steps)
          setGalleryItems(gallery)
        }
      })
      .catch((err) => console.error('Failed to fetch home-page items:', err))
      .finally(() => {
        setPrimaryLoading(false)
        setStepsLoading(false)
        setGalleryLoading(false)
      })
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const saveSection = async (itemsSetter, items) => {
    // Just update local state - DragDropUploadManager handles API saves
    itemsSetter(items)
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      {/* Inner tabs for Primary Graphics */}
      <div className="rounded-2xl bg-linear-to-br from-white to-slate-50/70 p-4 shadow-sm">
        <TabBar
          sections={PRIMARY_SUBS}
          selected={selectedSub}
          onSelect={setSelectedSub}
        />
      </div>

      {selectedSub === 'Primary Images' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Primary Images</h3>
            <button
              className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold border border-slate-300 transition"
              onClick={fetchAll}
              disabled={primaryLoading}
              style={{
                minWidth: 100,
                width: 120,
                height: 40,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  width: 80,
                  textAlign: 'center',
                  display: 'inline-block',
                }}
              >
                {primaryLoading ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Upload key images used in the primary hero/graphics. Drag to
            reorder.
          </p>
          {primaryLoading ? (
            <div>Loading...</div>
          ) : (
            <DragDropUploadManager
              mode="image"
              items={primaryItems}
              onChange={setPrimaryItems}
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
              onClick={fetchAll}
              disabled={stepsLoading}
              style={{
                minWidth: 100,
                width: 120,
                height: 40,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  width: 80,
                  textAlign: 'center',
                  display: 'inline-block',
                }}
              >
                {stepsLoading ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Upload images used for the steps animation section. Drag to reorder.
          </p>
          {stepsLoading ? (
            <div>Loading...</div>
          ) : (
            <DragDropUploadManager
              mode="image"
              items={stepsItems}
              onChange={setStepsItems}
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
              onClick={fetchAll}
              disabled={galleryLoading}
              style={{
                minWidth: 100,
                width: 120,
                height: 40,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  width: 80,
                  textAlign: 'center',
                  display: 'inline-block',
                }}
              >
                {galleryLoading ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Upload images for the homepage gallery. Drag to reorder.
          </p>
          {galleryLoading ? (
            <div>Loading...</div>
          ) : (
            <DragDropUploadManager
              mode="image"
              items={galleryItems}
              onChange={setGalleryItems}
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
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  // Fetch videos for home-portfolio
  const fetchVideos = () => {
    setLoading(true)
    // Add cache-busting param to always fetch fresh data
    fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/api/admin/media-items/category/home_portfolio_video?subsection=home-portfolio&_=${Date.now()}`,
      {
        credentials: 'include',
      }
    )
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setItems(res.data)
        } else {
          setItems([])
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Portfolio Video</h3>
        <button
          className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold border border-slate-300 transition"
          onClick={fetchVideos}
          disabled={loading}
          style={{
            minWidth: 100,
            width: 120,
            height: 40,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{ width: 80, textAlign: 'center', display: 'inline-block' }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </span>
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Upload the main homepage video. Only file upload is allowed. Only one
        video can be set.
      </p>
      <DragDropUploadManager
        mode="video"
        category="home_portfolio_video"
        subsection="home-portfolio"
        items={items}
        onChange={setItems}
        onUploadSuccess={fetchVideos}
        maxItems={1}
        endpoint="/api/admin/home-content/portfolio_video"
      />
      {loading && <div className="text-gray-500">Loading...</div>}
    </div>
  )
}

function ServicesOfferedSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  // Fetch videos for home-service-offered
  const fetchVideos = () => {
    setLoading(true)
    setRefreshing(true)
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/category/services_offered?subsection=home-service-offered&_t=\${Date.now()}`,
      {
        credentials: 'include',
      }
    )
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setItems(res.data)
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

  useEffect(() => {
    fetchVideos()
  }, [])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Services Offered</h3>
        <button
          className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold border border-slate-300 transition"
          onClick={fetchVideos}
          disabled={loading}
          style={{
            minWidth: 100,
            width: 120,
            height: 40,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{ width: 80, textAlign: 'center', display: 'inline-block' }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </span>
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Upload and manage Service Offered videos. All videos in Bunny
        (home-service-offered) will be shown below.
      </p>
      <DragDropUploadManager
        mode="video"
        category="services_offered"
        subsection="home-service-offered"
        items={items}
        onChange={setItems}
        onUploadSuccess={fetchVideos}
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
  // Decide which top-level section to render based on sidebar selection
  const topSection = activeSub || 'Primary Graphics'
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="rounded-2xl bg-linear-to-br from-white to-slate-50/70 p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Home Content Manager
        </h2>
        <p className="text-sm text-slate-600">
          Manage homepage content by section. Use the sidebar to switch between
          sections.
        </p>
      </div>

      {topSection === 'Primary Graphics' && <PrimaryGraphicsSection />}
      {topSection === 'Portfolio Video' && <PortfolioVideoSection />}
      {topSection === 'Services Offered' && <ServicesOfferedSection />}
    </div>
  )
}
