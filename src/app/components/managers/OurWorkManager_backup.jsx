// admin/components/managers/OurWorkManager.jsx
'use client'
import React, { useEffect, useState } from 'react'
import MediaManager from './MediaManager'

/**
 * OurWorkManager (Final Version with Data Flow Fix)
 * - Fetches all 'our_work' media items from the backend on mount.
 * - Manages state for sections, subsections, and items.
 * - Dynamically filters the fetched data to separate 'Featured Projects' from
 * 'Before/After Video' content, passing only the relevant set to the UI.
 */

const PRIMARY = '#cff000'

// --- START: Hardcoded Featured Projects Structure (Used for Initial Keys) ---

const INITIAL_FEATURED_PROJECTS_STRUCTURE = {
  Graphics: {
    categories: {
      'Ad creatives': [],
      'Ai generated graphics': [],
      'App graphic': [],
      'Blog thumbnails': [],
      'Brand Kits & Assets': [],
      'Custom Icons': [],
      'Ebook graphics for website': [],
      Infographics: [],
      Pdfs: [],
      Presentations: [],
      'Slide decks': [],
      'Social media graphics': [],
      'Web graphic': [],
    },
  },
  Videos: {
    categories: {
      'Montage style': [],
      'Spanish Videos': [],
      'Animation AI videos': [],
      'Gym & Fitness': [],
      'Text Based': [],
      'Talking Heads': [],
      'Product Showcase': [],
      'Podcast Intro': [],
      'Long form edits': [],
      'Digital Course VSL': [],
      'Before/After Video': [],
    },
  },
  'AI Lab': {
    categories: {
      'AI Assets': [],
      'AI generated images': [],
      'Product Placement': [],
      'AI B-rolls': [],
      'AI Voiceover': [],
      'AI Clone Creation': [],
      'AI-Powered Video': [],
      'AI Videos Ad Creation': [],
      'AI UGC Ads/Content': [],
    },
  },
}

const SECTION_KEYS = Object.keys(INITIAL_FEATURED_PROJECTS_STRUCTURE)
const initialSubsectionKey = INITIAL_FEATURED_PROJECTS_STRUCTURE.Graphics
  ? Object.keys(INITIAL_FEATURED_PROJECTS_STRUCTURE.Graphics.categories)[0]
  : ''

// --- END: Hardcoded Featured Projects Structure ---

const isValidUrl = (s) => {
  if (!s || typeof s !== 'string') return false
  try {
    const url = new URL(s)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function OurWorkManager({ activeSub }) {
  const [sections, setSections] = useState(INITIAL_FEATURED_PROJECTS_STRUCTURE)

  const active = activeSub || 'Featured Projects'

  const [mode, setMode] = useState('preview')
  const [selectedSection, setSelectedSection] = useState(SECTION_KEYS[0])
  const [selectedSubsection, setSelectedSubsection] =
    useState(initialSubsectionKey)

  const [newLink, setNewLink] = useState('')
  const [toastStack, setToastStack] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [editing, setEditing] = useState(null)
  const [subAddingName, setSubAddingName] = useState('')

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // --- Data Fetching Function ---
  const fetchMediaItems = async () => {
    setLoading(true)
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(
        `${API_BASE_URL}/api/admin/media-items/category/our_work?_t=${Date.now()}`,
        {
          credentials: 'include',
        }
      )

      if (response.ok) {
        const result = await response.json()
        if (result.success && Array.isArray(result.data)) {
          // Use a fresh clone to ensure all subsection keys exist, even if empty
          const loadedSections = JSON.parse(
            JSON.stringify(INITIAL_FEATURED_PROJECTS_STRUCTURE)
          )

          result.data.forEach((item) => {
            // Check for the section/subsection structure before pushing
            if (loadedSections[item.section]?.categories[item.subsection]) {
              loadedSections[item.section].categories[item.subsection].push({
                ...item,
                id: item._id || item.id,
              })
            }
            // NOTE: If the item doesn't fit the FEATURED structure (like BA Video),
            // it will remain in the 'loadedSections' object but won't be displayed
            // by the featured projects UI, which is intended.
          })

          setSections(loadedSections)
        }
      } else {
        pushToast('error', 'Load failed', 'Failed to load featured items.')
      }
    } catch (error) {
      console.error('Error loading Our Work:', error)
      pushToast('error', 'Network Error', 'Failed to connect to backend API.')
    } finally {
      setLoading(false)
    }
  }

  // Trigger fetch on mount
  useEffect(() => {
    fetchMediaItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Hooks and Handlers ---

  useEffect(() => {
    const currentSectionCategories = sections[selectedSection]?.categories || {}
    const cats = Object.keys(currentSectionCategories)

    if (!cats.includes(selectedSubsection)) {
      setSelectedSubsection(cats[0] || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection, sections])

  useEffect(() => {
    if (!toastStack.length) return
    const timers = toastStack.map((t) =>
      setTimeout(() => removeToast(t.id), 3000)
    )
    return () => timers.forEach((t) => clearTimeout(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toastStack.length])

  function pushToast(type, msg) {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToastStack((t) => [{ id, type, msg }, ...t])
  }
  function removeToast(id) {
    setToastStack((t) => t.filter((x) => x.id !== id))
  }

  function addItem() {
    if (!newLink) return pushToast('error', 'Please enter a link.')
    if (!isValidUrl(newLink))
      return pushToast('error', 'Enter a valid http/https link.')

    if (newLink.split(/\s+/).length > 1) {
      return pushToast('error', 'Please enter only one URL per item.')
    }

    setSections((s) => {
      const copy = JSON.parse(JSON.stringify(s))
      const arr = copy[selectedSection].categories[selectedSubsection] || []
      const isVideo =
        newLink.includes('playlist.m3u8') || newLink.includes('.mp4')

      const newItem = {
        id: Date.now() + Math.floor(Math.random() * 999),
        src: newLink,
        type: isVideo ? 'video' : 'image',
        poster: isVideo ? newLink : '',
        alt: selectedSubsection,
      }

      arr.unshift(newItem)
      copy[selectedSection].categories[selectedSubsection] = arr
      return copy
    })
    setNewLink('')
    pushToast('success', 'Item added.')
  }

  function requestDelete(sectionKey, subName, id) {
    setConfirmDelete({ sectionKey, subName, id })
  }

  function cancelDelete() {
    setConfirmDelete(null)
  }

  function doDelete() {
    if (!confirmDelete) return
    const { sectionKey, subName, id } = confirmDelete
    setSections((s) => {
      const copy = JSON.parse(JSON.stringify(s))
      copy[sectionKey].categories[subName] = copy[sectionKey].categories[
        subName
      ].filter((it) => it.id !== id)
      return copy
    })
    pushToast('deleted', 'Item deleted.')
    setConfirmDelete(null)
  }

  function startEdit(item, sectionKey, subName) {
    setEditing({
      id: item.id,
      value: item.src,
      posterValue: item.poster || '',
      type:
        item.type || (item.src.includes('playlist.m3u8') ? 'video' : 'image'),
      sectionKey,
      subName,
      src: item.src,
      poster: item.poster || '',
    })
  }

  function cancelEdit() {
    setEditing(null)
  }

  function saveEdit() {
    if (!editing) return

    if (!isValidUrl(editing.value))
      return pushToast('error', 'Enter a valid http/https link for SRC.')

    if (
      editing.type === 'video' &&
      editing.posterValue &&
      !isValidUrl(editing.posterValue)
    ) {
      return pushToast('error', 'Enter a valid http/https link for Poster.')
    }

    setSections((s) => {
      const copy = JSON.parse(JSON.stringify(s))
      const arr = copy[editing.sectionKey].categories[editing.subName]
      const idx = arr.findIndex((it) => it.id === editing.id)

      if (idx !== -1) {
        arr[idx].src = editing.value
        if (editing.type === 'video') {
          arr[idx].poster = editing.posterValue
        }
      }
      return copy
    })
    pushToast('success', 'Item updated.')
    setEditing(null)
  }

  function addSubsection() {
    const currentCategories = sections[selectedSection]?.categories || {}
    const newName = subAddingName.trim()
    const defaultName = `Subsection ${
      Object.keys(currentCategories).length + 1
    }`
    const name = newName || defaultName

    if (!name) return pushToast('error', 'Enter subsection name.')

    if (currentCategories[name]) {
      return pushToast(
        'error',
        `Subsection "${name}" already exists in ${selectedSection}.`
      )
    }

    setSections((s) => {
      const copy = JSON.parse(JSON.stringify(s))
      if (!copy[selectedSection].categories) {
        copy[selectedSection].categories = {}
      }
      copy[selectedSection].categories[name] = []
      return copy
    })
    setSubAddingName('')
    pushToast('success', `Subsection "${name}" added.`)
    setSelectedSubsection(name)
  }

  async function saveAll() {
    // 1. Prepare Payload: Flatten ALL 'our_work' items (Featured + Before/After)
    const itemsToSave = []

    Object.keys(sections).forEach((sectionKey) => {
      const categories = sections[sectionKey].categories

      Object.keys(categories).forEach((subsectionName) => {
        const itemList = categories[subsectionName]

        itemList.forEach((item, index) => {
          const { id, ...restOfItem } = item // Remove frontend 'id'

          const isVideo = item.type === 'video'

          const payloadItem = {
            ...restOfItem,
            type: isVideo ? 'video' : 'image',
            poster: item.poster || '',
            before: item.before || '',
            after: item.after || '',
            category: 'our_work',
            section: sectionKey,
            subsection: subsectionName,
            order: item.order !== undefined ? item.order : index + 1,
            active: item.active !== undefined ? item.active : true,
          }

          itemsToSave.push(payloadItem)
        })
      })
    })

    // 2. Send to Backend
    setSaving(true)
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const mediaCategory = 'our_work'
      const response = await fetch(
        `${API_BASE_URL}/api/admin/media-items/bulk/${mediaCategory}?_t=${Date.now()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(itemsToSave),
        }
      )

      if (response.ok) {
        pushToast(
          'success',
          'Saved successfully!',
          `Updated ${itemsToSave.length} media items.`
        )
        await fetchMediaItems() // Re-fetch to sync IDs and order
      } else {
        const errorData = await response.json()
        pushToast(
          'error',
          'Save failed',
          errorData.error || 'Server error occurred.'
        )
        console.error('API Save Error:', errorData)
      }
    } catch (err) {
      console.error(err)
      pushToast('error', 'Network error', 'Unable to reach the server.')
    } finally {
      setSaving(false)
    }
  }

  const subsections = Object.keys(sections[selectedSection]?.categories || {})
  const featuredItems =
    sections[selectedSection]?.categories[selectedSubsection] || []

  // NEW: Isolate Before/After items by their specific subsection name
  const beforeAfterItems =
    sections['Videos']?.categories['Before/After Video']?.map((item) => ({
      id: item.id,
      before: item.before,
      after: item.after,
      beforePoster: item.beforePoster || '',
      afterPoster: item.afterPoster || '',
      // Pass other fields needed by MediaManager if necessary
    })) || []
  console.log('Before/After Items:', beforeAfterItems)

  // --- UI Rendering ---

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Toasts (top-right) */}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2 items-end">
        {toastStack.map((t) => (
          <div
            key={t.id}
            className={`min-w-[200px] max-w-sm rounded-md px-4 py-2 shadow-md border`}
            style={{
              background: t.type === 'success' ? PRIMARY : '#ffe7e7',
              borderColor: t.type === 'success' ? '#b8e200' : '#f6c0c0',
              color: t.type === 'success' ? '#000' : '#8b1d1d',
            }}
          >
            <div className="text-sm font-medium">{t.msg}</div>
          </div>
        ))}
      </div>

      {/* Render Featured Projects UI */}
      <div className={active !== 'Before/After Video' ? 'block' : 'hidden'}>
        <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">
            Our Work — Featured Projects
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1 rounded font-medium border ${
                mode === 'preview' ? 'bg-black text-white' : 'bg-white'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setMode('add')}
              className={`px-3 py-1 rounded font-medium border ${
                mode === 'add' ? 'bg-black text-white' : 'bg-white'
              }`}
            >
              Add Data
            </button>

            <button
              onClick={saveAll}
              className="rounded px-3 py-1 font-semibold ml-3"
              style={{ background: PRIMARY }}
              disabled={saving || loading}
            >
              {saving ? 'Saving...' : loading ? 'Loading...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-12 text-lg text-gray-500">
            Loading featured projects data...
          </div>
        )}

        {/* Render Controls and List only when not loading */}
        {!loading && (
          <>
            {/* Controls */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full rounded border px-3 py-2 bg-white"
                >
                  {SECTION_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Subsection
                </label>
                <select
                  value={selectedSubsection}
                  onChange={(e) => setSelectedSubsection(e.target.value)}
                  className="w-full rounded border px-3 py-2 bg-white"
                >
                  {subsections.map(
                    (s) =>
                      // Filter out the Before/After subsection from the featured project dropdowns
                      s !== 'Before/After Video' && (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      )
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Add Subsection
                </label>
                <div className="flex gap-2">
                  <input
                    value={subAddingName}
                    onChange={(e) => setSubAddingName(e.target.value)}
                    placeholder="new subsection name (optional)"
                    className="flex-1 rounded border px-3 py-2 bg-white"
                  />
                  <button
                    onClick={addSubsection}
                    className="rounded px-3 py-2"
                    style={{ background: PRIMARY }}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Add Mode */}
            {mode === 'add' && (
              <div className="mb-6 rounded-lg border bg-white p-4">
                <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-sm">
                    Add new item to{' '}
                    <span className="font-semibold">
                      {selectedSection} → {selectedSubsection}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Link must be a valid http/https URL.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="Paste CDN link for image / thumbnail / video thumb"
                    className="flex-1 rounded border px-3 py-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addItem}
                      className="rounded px-4 py-2"
                      style={{ background: PRIMARY }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setNewLink('')
                        pushToast('success', 'Cleared')
                      }}
                      className="rounded border px-4 py-2"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preview list card (Featured Projects) */}
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedSection} — {selectedSubsection}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {featuredItems.length}{' '}
                    {featuredItems.length === 1 ? 'item' : 'items'}
                  </div>
                </div>
                <div className="text-sm text-gray-500">Compact list view</div>
              </div>

              {featuredItems.length === 0 && (
                <div className="text-sm text-gray-500">
                  No items in this subsection yet.
                </div>
              )}

              {featuredItems.length > 0 && (
                <div className="grid gap-3">
                  {featuredItems.map((it) => {
                    const previewSrc =
                      it.type === 'video' && it.poster ? it.poster : it.src

                    return (
                      <div
                        key={it.id}
                        className="flex items-center gap-3 p-3 rounded border-sm hover:shadow-sm transition-shadow"
                      >
                        <div className="flex-shrink-0 h-16 w-16 overflow-hidden rounded bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewSrc}
                            alt={it.alt || it.id}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* APPLY TRUNCATION FIX: truncate, overflow-hidden */}
                          <div
                            className="text-sm font-medium truncate overflow-hidden"
                            title={it.src}
                          >
                            {it.src}
                          </div>
                          <div className="text-xs text-gray-500">
                            {it.type === 'video'
                              ? `Video Source (${
                                  it.poster ? 'Poster Used' : 'No Poster'
                                })`
                              : 'Image Source'}
                          </div>
                        </div>

                        {/* Button container - flex-shrink-0 ensures this area doesn't collapse */}
                        <div className="flex gap-2 items-center flex-shrink-0">
                          <button
                            onClick={() => {
                              setMode('add')
                              setNewLink(it.src)
                              pushToast('success', 'Link copied to Add input')
                            }}
                            className="text-xs rounded px-3 py-1 border"
                            aria-label="Use in Add"
                          >
                            Use in Add
                          </button>
                          <button
                            onClick={() =>
                              startEdit(it, selectedSection, selectedSubsection)
                            }
                            className="text-xs rounded px-3 py-1 border"
                            aria-label="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              requestDelete(
                                selectedSection,
                                selectedSubsection,
                                it.id
                              )
                            }
                            className="text-xs rounded px-3 py-1 border text-red-600"
                            aria-label="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Edit Modal (custom) */}
            {editing && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-2xl rounded-lg overflow-hidden shadow-lg bg-white">
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ background: PRIMARY }}
                  >
                    <div className="text-lg font-semibold">Edit item</div>
                    <button
                      onClick={cancelEdit}
                      className="rounded px-2 py-1 border"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 flex items-center justify-center">
                      <div className="w-full max-w-xs">
                        <div className="h-40 w-full overflow-hidden rounded bg-gray-100">
                          {/* Use current poster/src for the modal preview */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              editing.type === 'video' && editing.poster
                                ? editing.poster
                                : editing.value
                            }
                            alt="preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Current thumbnail
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-3">
                      {/* SRC (Video or Image Link) */}
                      <label className="text-sm font-medium">
                        {editing.type === 'video'
                          ? 'Video CDN Link (SRC)'
                          : 'Image CDN Link (SRC)'}
                      </label>
                      <input
                        value={editing.value}
                        onChange={(e) =>
                          setEditing((p) => ({ ...p, value: e.target.value }))
                        }
                        className="w-full rounded border px-3 py-2"
                      />

                      {/* POSTER LINK (Only for Videos) */}
                      {editing.type === 'video' && (
                        <>
                          <label className="text-sm font-medium mt-2">
                            Poster Image Link (Optional Thumbnail)
                          </label>
                          <input
                            value={editing.posterValue}
                            onChange={(e) =>
                              setEditing((p) => ({
                                ...p,
                                posterValue: e.target.value,
                              }))
                            }
                            placeholder="Enter Poster/Thumbnail URL here"
                            className="w-full rounded border px-3 py-2"
                          />
                        </>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={saveEdit}
                          className="rounded px-4 py-2"
                          style={{ background: PRIMARY }}
                        >
                          Save changes
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded px-4 py-2 border"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDelete({
                              sectionKey: editing.sectionKey,
                              subName: editing.subName,
                              id: editing.id,
                            })
                            setEditing(null)
                          }}
                          className="rounded px-4 py-2 border text-red-600"
                        >
                          Delete item
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Make sure the link is an accessible URL.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm delete modal */}
            {confirmDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-sm rounded bg-white p-5 shadow">
                  <div className="text-lg font-semibold mb-2">Delete item?</div>
                  <div className="text-sm text-gray-600 mb-4">
                    Are you sure you want to permanently delete this item? This
                    cannot be undone.
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelDelete}
                      className="rounded px-3 py-1 border"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={doDelete}
                      className="rounded px-3 py-1"
                      style={{ background: '#ff6b6b', color: '#fff' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Render Before/After UI only when active submenu is "Before/After Video" */}
      <div
        className={active === 'Before/After Video' ? 'block mt-4' : 'hidden'}
      >
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-2xl font-semibold mb-3">Before / After Videos</h2>
          <p className="text-sm text-slate-600 mb-4">
            Add pairs of thumbnails (Before / After). Each pair expects two CDN
            links (before + after).
          </p>

          <MediaManager
            title="Before / After Video Pairs"
            placeholder="Paste CDN link here"
            // FIX: Pass the correctly isolated Before/After data here
            initial={beforeAfterItems}
            beforeAfter={true}
            onSave={async (items) => {
              // TODO: This should call your bulk API endpoint for this category
              console.log('Save before/after pairs', items)
              return items
            }}
          />
        </div>
      </div>
    </div>
  )
}
