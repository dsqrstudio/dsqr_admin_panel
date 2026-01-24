import React, { useEffect, useState } from 'react'
import { FiEdit2, FiTrash2, FiUpload, FiLoader } from 'react-icons/fi'
import { useToast } from '@/components/ui/toast'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function AffiliateExtraGraphicSection({
  subsection = 'affiliate',
  label = 'Affiliate — Extra Graphic',
}) {
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const { showToast, ToastComponent } = useToast()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Fetch the current extra graphic (only one allowed)
  const fetchImage = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/category/extras?subsection=${subsection}`,
        { credentials: 'include' }
      )
      const data = await res.json()
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setImage(data.data[0])
      } else {
        setImage(null)
      }
    } catch {
      setImage(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchImage()
    // Only rerun if subsection changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subsection])

  // Upload new image
  const handleUpload = async (file) => {
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('category', 'extras')
    form.append('subsection', subsection)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/upload`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast('Image uploaded!', 'success')
        setImage(data.data)
      } else {
        showToast(data.error || 'Upload failed', 'error')
      }
    } catch (err) {
      showToast('Upload failed', 'error')
    }
    setUploading(false)
  }

  // Replace image
  const handleReplace = async (file) => {
    if (!image) return
    setReplacing(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/${image._id}/replace`,
        {
          method: 'POST',
          body: form,
          credentials: 'include',
        }
      )
      const data = await res.json()
      if (res.ok && data.success) {
        showToast('Image replaced!', 'success')
        setImage(data.data)
      } else {
        showToast(data.error || 'Replace failed', 'error')
      }
    } catch (err) {
      showToast('Replace failed', 'error')
    }
    setReplacing(false)
  }

  // Delete image
  const handleDelete = async () => {
    if (!image) return
    setReplacing(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media-items/${image._id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )
      if (res.ok) {
        showToast('Image deleted', 'success')
        setImage(null)
        setShowDeleteModal(false)
      } else {
        showToast('Delete failed', 'error')
      }
    } catch {
      showToast('Delete failed', 'error')
    }
    setReplacing(false)
  }

  return (
    <div className="flex flex-col items-center justify-center mt-8 w-full">
      <div className="rounded-2xl bg-white shadow-lg border p-8 max-w-lg w-full flex flex-col items-center">
        {ToastComponent}
        <div className="flex items-center mb-3 gap-2 w-full justify-between">
          <h3 className="text-2xl font-bold text-slate-900">{label}</h3>
          <button
            onClick={fetchImage}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors duration-150 shadow-sm"
            title="Refresh"
            disabled={loading}
          >
            {loading ? <FiLoader className="animate-spin" /> : '⟳ Refresh'}
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-6 w-full text-center">
          Only one image is allowed. You can replace or delete it after upload.
        </p>
        {loading ? (
          <div className="flex flex-col items-center py-12 text-slate-500 w-full">
            <FiLoader className="animate-spin text-3xl mb-2" />
            Loading...
          </div>
        ) : image ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="relative w-full flex flex-col items-center">
              <img
                src={image.src}
                alt="Affiliate Extra Graphic"
                className="rounded-xl border shadow max-w-xs max-h-60 object-contain bg-slate-50"
                style={{ background: '#f8fafc' }}
              />
              {(replacing || uploading) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 rounded-xl">
                  <FiLoader className="animate-spin text-3xl mb-2 text-blue-500" />
                  <span className="text-blue-700 font-medium">
                    {replacing ? 'Processing...' : 'Uploading...'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-2">
              <label className="inline-flex items-center gap-1 px-4 py-2 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium cursor-pointer border border-blue-200 transition">
                <FiEdit2 /> Replace
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={replacing || uploading}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0])
                      handleReplace(e.target.files[0])
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                className="inline-flex items-center gap-1 px-4 py-2 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-medium border border-rose-200 transition"
                onClick={() => setShowDeleteModal(true)}
                disabled={replacing || uploading}
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#cff000] hover:bg-lime-200 text-slate-900 font-semibold cursor-pointer border border-lime-200 text-lg shadow transition">
              <FiUpload /> Upload Image
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={uploading}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0])
                    handleUpload(e.target.files[0])
                  e.target.value = ''
                }}
              />
            </label>
            {uploading && (
              <div className="flex flex-col items-center mt-2">
                <FiLoader className="animate-spin text-2xl text-blue-500 mb-1" />
                <span className="text-blue-700 font-medium">Uploading...</span>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Delete confirmation modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this affiliate extra graphic? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialogCancel asChild>
              <button className="px-4 py-2 rounded border bg-white text-slate-700 font-medium">
                Cancel
              </button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <button
                className="px-4 py-2 rounded bg-rose-600 text-white font-medium"
                onClick={handleDelete}
                disabled={replacing}
              >
                {replacing ? (
                  <FiLoader className="animate-spin inline mr-2" />
                ) : null}{' '}
                Delete
              </button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
