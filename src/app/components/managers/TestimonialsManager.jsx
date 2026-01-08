// admin/components/managers/TestimonialsManager.jsx
'use client'

import React, { useRef, useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

/* same SAMPLE data as before */
const SAMPLE = [
  {
    id: 1,
    name: 'Jack',
    company: 'Ex-CEO, AllThingsAl',
    image: 'https://dsqrstudio.b-cdn.net/Graphics/Ad%20creatives/1.png?w=200',
    text: "We've worked with 4 other editing agencies before and DSQR Studio and Div's team are THE BEST.",
    stats: {
      editing_time: '100',
      cost: '3.7',
      videos: '20',
    },
    _editing: false,
  },
]

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

function Toasts({ items }) {
  if (!items?.length) return null
  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-3">
      {items.map((t) => (
        <div
          key={t.id}
          className={`max-w-sm w-full rounded-md px-3 py-2 shadow-md border ${
            t.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-900'
              : t.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}
        >
          <div className="font-semibold text-sm">{t.title}</div>
          {t.message && <div className="text-xs">{t.message}</div>}
        </div>
      ))}
    </div>
  )
}

export default function TestimonialsManager() {
  const [items, setItems] = useState([])
  const savedRef = useRef([])
  const [toasts, setToasts] = useState([])
  const [pendingDelete, setPendingDelete] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({}) // { [id]: { field: message } }

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  // Keep a map of refs to inputs (optional but handy)
  const inputsRef = useRef({})

  // Load testimonials from backend
  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/testimonials`, {
          credentials: 'include',
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            const formattedItems = result.data.map((item) => ({
              id: item._id,
              name: item.name,
              company: item.company,
              image: item.image,
              text: item.text,
              stats: item.stats,
              order: item.order,
              active: item.active,
              _editing: false,
            }))
            setItems(formattedItems)
            savedRef.current = clone(formattedItems)
          }
        }
      } catch (error) {
        console.error('Error loading testimonials:', error)
        pushToast('error', 'Load failed', 'Failed to load testimonials')
      } finally {
        setLoading(false)
      }
    }

    loadTestimonials()
  }, [])

  function pushToast(type, title, message = '') {
    const id = Date.now() + Math.random().toString(16).slice(2)
    setToasts((s) => [...s, { id, type, title, message }])
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3500)
  }

  function add() {
    const id = Date.now()
    const newItem = {
      id,
      name: '',
      company: '',
      image: '',
      text: '',
      stats: { editing_time: '0', cost: '0', videos: '0' },
      _editing: true,
    }
    setItems((s) => [newItem, ...s])
    pushToast(
      'info',
      'Added',
      'New testimonial created — enter details and save.'
    )

    // schedule focus for the newly created item after DOM updates
    setTimeout(() => {
      const el = document.getElementById(`name-${id}`)
      if (el) el.focus()
    }, 0)
  }

  async function doDelete(id) {
    setSaving(true)
    try {
      // If it's not a Mongo ObjectId, it's a temporary unsaved item; remove locally
      if (!isMongoId(id)) {
        setItems((s) => s.filter((x) => x.id !== id))
        savedRef.current = savedRef.current.filter((x) => x.id !== id)
        pushToast('success', 'Deleted', 'Temporary testimonial removed.')
        setPendingDelete(null)
        return
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/testimonials/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (response.ok) {
        setItems((s) => s.filter((x) => x.id !== id))
        savedRef.current = savedRef.current.filter((x) => x.id !== id)
        pushToast('success', 'Deleted', 'Testimonial removed.')
        setPendingDelete(null)
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      console.error('Error deleting testimonial:', error)
      pushToast('error', 'Delete failed', 'Could not delete testimonial.')
    } finally {
      setSaving(false)
    }
  }

  // Set editing; when enabling, focus the name input for that card
  function setEditing(id, val) {
    setItems((arr) =>
      arr.map((it) => (it.id === id ? { ...it, _editing: !!val } : it))
    )
    if (val) {
      // focus after DOM update
      setTimeout(() => {
        const el = document.getElementById(`name-${id}`)
        if (el) el.focus()
      }, 0)
    }
  }

  function setField(id, key, value) {
    setItems((arr) =>
      arr.map((it) =>
        it.id === id ? { ...it, [key]: value, _editing: true } : it
      )
    )
    setErrors((prev) => {
      const e = { ...prev }
      if (e[id]) {
        const { [key]: _removed, ...rest } = e[id]
        e[id] = rest
        if (Object.keys(e[id]).length === 0) delete e[id]
      }
      return e
    })
  }
  function setStat(id, key, value) {
    setItems((arr) =>
      arr.map((it) =>
        it.id === id
          ? { ...it, stats: { ...it.stats, [key]: value }, _editing: true }
          : it
      )
    )
    setErrors((prev) => {
      const e = { ...prev }
      if (e[id]) {
        const { [key]: _removed, ...rest } = e[id]
        e[id] = rest
        if (Object.keys(e[id]).length === 0) delete e[id]
      }
      return e
    })
  }

  function isValidUrl(v) {
    try {
      if (!v) return false
      const u = new URL(v)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }

  function isMongoId(id) {
    return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)
  }

  function hasItemChanged(item) {
    const saved = savedRef.current.find((s) => s.id === item.id)
    if (!saved) return true
    return (
      JSON.stringify(saved) !==
      JSON.stringify({ ...item, _editing: saved._editing ?? false })
    )
  }

  function validateItem(item) {
    const errs = {}
    if (!item.name || item.name.trim() === '') errs.name = 'Required'
    if (!item.text || item.text.trim() === '') errs.text = 'Required'
    if (!isValidUrl(item.image)) errs.image = 'Image required'
    const videosVal = String(item.stats?.videos ?? '')
    if (!/^\d+$/.test(videosVal)) errs.videos = 'Enter a whole number'
    const costVal = String(item.stats?.cost ?? '')
    if (!/^\d+(\.\d+)?$/.test(costVal)) errs.cost = 'Enter a number'
    const etVal = String(item.stats?.editing_time ?? '')
    if (!/^\d+(\.\d+)?$/.test(etVal)) errs.editing_time = 'Enter a number'
    return errs
  }

  async function saveItem(id) {
    const item = items.find((x) => x.id === id)
    if (!item) return
    const errMap = validateItem(item)
    if (Object.keys(errMap).length) {
      setErrors((prev) => ({ ...prev, [id]: errMap }))
      return
    }
    if (!hasItemChanged(item)) {
      pushToast('info', 'No changes', 'No changes detected.')
      setItems((arr) =>
        arr.map((it) => (it.id === id ? { ...it, _editing: false } : it))
      )
      return
    }

    setSaving(true)
    try {
      const isNew = !isMongoId(id)
      const url = isNew
        ? `${API_BASE_URL}/api/admin/testimonials`
        : `${API_BASE_URL}/api/admin/testimonials/${id}`
      const method = isNew ? 'POST' : 'PUT'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: item.name,
          company: item.company,
          image: item.image,
          text: item.text,
          stats: {
            editing_time: Number(item.stats.editing_time),
            cost: Number(item.stats.cost),
            videos: Number(item.stats.videos),
          },
          order: item.order,
          active: item.active,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const snapshot = clone(result.data)
        snapshot._editing = false
        if (isNew) {
          // Replace temp item id with Mongo id
          savedRef.current.unshift({ ...snapshot })
          setItems((arr) =>
            arr.map((it) =>
              it.id === id
                ? { ...snapshot, id: snapshot._id, _editing: false }
                : it
            )
          )
        } else {
          savedRef.current = savedRef.current.filter((s) => s.id !== id)
          savedRef.current.unshift(snapshot)
          setItems((arr) =>
            arr.map((it) => (it.id === id ? { ...it, _editing: false } : it))
          )
        }
        pushToast('success', 'Saved', 'Testimonial saved.')
      } else {
        throw new Error('Failed to save')
      }
    } catch (e) {
      console.error(e)
      pushToast('error', 'Save failed', 'Could not save testimonial.')
    } finally {
      setSaving(false)
    }
  }

  async function saveAll() {
    const changed = items.filter((it) => hasItemChanged(it))
    if (!changed.length) {
      pushToast('info', 'No changes', 'No changes detected — nothing to save.')
      return
    }
    for (const it of changed) {
      const errMap = validateItem(it)
      if (Object.keys(errMap).length) {
        setErrors((prev) => ({ ...prev, [it.id]: errMap }))
        return
      }
    }

    setSaving(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/testimonials/bulk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(
            items.map((item) => ({
              name: item.name,
              company: item.company,
              image: item.image,
              text: item.text,
              stats: {
                editing_time: Number(item.stats.editing_time),
                cost: Number(item.stats.cost),
                videos: Number(item.stats.videos),
              },
              order: item.order,
              active: item.active,
            }))
          ),
        }
      )

      if (response.ok) {
        const result = await response.json()
        const newSaved = result.data.map((it) => ({
          ...clone(it),
          _editing: false,
        }))
        savedRef.current = clone(newSaved)
        setItems((arr) => arr.map((it) => ({ ...it, _editing: false })))
        pushToast('success', 'Saved', 'All testimonials saved.')
      } else {
        throw new Error('Failed to save')
      }
    } catch (e) {
      console.error(e)
      pushToast('error', 'Save failed', 'Could not save testimonials.')
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(id, file) {
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('file', file)

      // If existing record, replace in place; else upload and set URL
      let data
      if (isMongoId(id)) {
        const res = await fetch(
          `${API_BASE_URL}/api/admin/testimonials/${id}/replace-image`,
          { method: 'POST', credentials: 'include', body: formData }
        )
        if (!res.ok) throw new Error('Replace failed')
        data = await res.json()
        setItems((arr) =>
          arr.map((it) =>
            it.id === id
              ? { ...it, image: data.data.image, _editing: true }
              : it
          )
        )
      } else {
        const res = await fetch(
          `${API_BASE_URL}/api/admin/testimonials/upload`,
          {
            method: 'POST',
            credentials: 'include',
            body: formData,
          }
        )
        if (!res.ok) throw new Error('Upload failed')
        data = await res.json()
        setItems((arr) =>
          arr.map((it) =>
            it.id === id ? { ...it, image: data.url, _editing: true } : it
          )
        )
      }
      pushToast('success', 'Image updated', 'Image set successfully.')
    } catch (err) {
      console.error(err)
      pushToast('error', 'Image upload failed', err.message)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Toasts items={toasts} />

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Testimonials</h2>
          <p className="text-sm text-slate-600">
            Manage client testimonials. Click{' '}
            <span className="font-semibold">Edit</span> to modify a testimonial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={add}
            className="rounded border px-3 py-2 text-sm"
            disabled={loading}
          >
            Add
          </button>
          <button
            onClick={saveAll}
            className="rounded bg-[#cff000] px-3 py-2 text-sm font-semibold"
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : loading ? 'Loading...' : 'Save All'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex flex-col lg:flex-row gap-4 bg-white rounded-lg border p-4 shadow-sm"
          >
            <div className="w-full lg:w-44 shrink-0">
              <div className="relative h-36 w-full lg:h-44 lg:w-40 overflow-hidden rounded-md bg-gray-100 border flex items-center justify-center">
                {isValidUrl(t.image) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.image}
                    alt={t.name || 'testimonial'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center px-3 text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 mb-1 opacity-60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                    <div className="text-xs">Choose a file</div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  title=""
                  onChange={(e) => handleImageUpload(t.id, e.target.files?.[0])}
                />
                {isValidUrl(t.image) && (
                  <div className="absolute bottom-1 right-1">
                    <button
                      className="rounded bg-black/70 text-white text-xs px-2 py-1"
                      title="Change image"
                    >
                      Change
                    </button>
                  </div>
                )}
                {!isValidUrl(t.image) && errors[t.id]?.image && (
                  <div className="absolute -bottom-5 left-0 text-[11px] text-red-600">
                    {errors[t.id].image}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <input
                    id={`name-${t.id}`}
                    value={t.name}
                    onChange={(e) => setField(t.id, 'name', e.target.value)}
                    readOnly={!t._editing}
                    placeholder="Client name"
                    className={`w-full text-lg font-semibold px-1 py-1 border-b ${
                      t._editing ? 'bg-white' : 'bg-transparent'
                    }`}
                  />
                  {errors[t.id]?.name && (
                    <div className="text-xs text-red-600 mt-1">
                      {errors[t.id].name}
                    </div>
                  )}
                  <input
                    value={t.company}
                    onChange={(e) => setField(t.id, 'company', e.target.value)}
                    readOnly={!t._editing}
                    placeholder="Company / Title"
                    className="mt-1 w-full text-sm text-slate-500 px-1 py-1 border-b bg-transparent"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {!t._editing ? (
                    <button
                      onClick={() => setEditing(t.id, true)}
                      className="rounded border px-3 py-1 text-sm"
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => saveItem(t.id)}
                        className="rounded bg-[#cff000] px-3 py-1 text-sm font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          const saved = savedRef.current.find(
                            (s) => s.id === t.id
                          )
                          if (saved)
                            setItems((arr) =>
                              arr.map((it) =>
                                it.id === t.id ? clone(saved) : it
                              )
                            )
                          else
                            setItems((arr) =>
                              arr.map((it) =>
                                it.id === t.id ? { ...it, _editing: false } : it
                              )
                            )
                          pushToast('info', 'Reverted', 'Edits reverted.')
                        }}
                        className="rounded border px-3 py-1 text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        onClick={() => setPendingDelete(t.id)}
                        className="rounded bg-red-50 px-3 py-1 text-sm text-red-700"
                      >
                        Delete
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete testimonial</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this testimonial? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          onClick={() => setPendingDelete(null)}
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => doDelete(t.id)}
                          className="bg-red-600 text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <textarea
                value={t.text}
                onChange={(e) => setField(t.id, 'text', e.target.value)}
                readOnly={!t._editing}
                rows={3}
                placeholder="Testimonial text"
                className={`w-full rounded border p-2 ${
                  t._editing ? '' : 'bg-gray-50'
                }`}
              />
              {errors[t.id]?.text && (
                <div className="text-xs text-red-600 -mt-2">
                  {errors[t.id].text}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-500 w-28">
                    Editing time
                  </div>
                  <input
                    value={String(t.stats?.editing_time ?? '')}
                    onChange={(e) =>
                      setStat(
                        t.id,
                        'editing_time',
                        e.target.value.replace(/[^\d.]/g, '')
                      )
                    }
                    readOnly={!t._editing}
                    className="w-20 rounded border px-2 py-1 text-right"
                  />
                  <div className="text-sm text-slate-600">%</div>
                  {errors[t.id]?.editing_time && (
                    <div className="text-xs text-red-600 ml-2">
                      {errors[t.id].editing_time}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-500 w-28">Cost</div>
                  <div className="flex items-center">
                    <div className="text-sm text-slate-700 mr-1">$</div>
                    <input
                      value={String(t.stats?.cost ?? '')}
                      onChange={(e) =>
                        setStat(
                          t.id,
                          'cost',
                          e.target.value.replace(/[^\d.]/g, '')
                        )
                      }
                      readOnly={!t._editing}
                      className="w-20 rounded border px-2 py-1 text-right"
                    />
                    <div className="text-sm text-slate-600 ml-2">k</div>
                    {errors[t.id]?.cost && (
                      <div className="text-xs text-red-600 ml-2">
                        {errors[t.id].cost}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-500 w-28">
                    Videos delivered
                  </div>
                  <input
                    value={String(t.stats?.videos ?? '')}
                    onChange={(e) =>
                      setStat(t.id, 'videos', e.target.value.replace(/\D/g, ''))
                    }
                    readOnly={!t._editing}
                    className="w-20 rounded border px-2 py-1 text-right"
                  />
                  {errors[t.id]?.videos && (
                    <div className="text-xs text-red-600 ml-2">
                      {errors[t.id].videos}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side image section removed; image is managed in the preview card above */}
          </div>
        ))}
      </div>

      {pendingDelete && null}
    </div>
  )
}
