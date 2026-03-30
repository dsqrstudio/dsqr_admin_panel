// admin/components/managers/PricingManager.jsx
'use client'
import React, { useRef, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const DEFAULT_PRICES = {
  Graphic: {
    1: { base: { USD: 273, CAD: 373 }, fast: { USD: 473, CAD: 573 } },
    2: { base: { USD: 573, CAD: 773 }, fast: { USD: 673, CAD: 873 } },
    3: { base: { USD: 737, CAD: 973 }, fast: { USD: 773, CAD: 1073 } },
  },
  Video: {
    1: { base: { USD: 473, CAD: 573 }, fast: { USD: 773, CAD: 1073 } },
    2: { base: { USD: 673, CAD: 873 }, fast: { USD: 1173, CAD: 1573 } },
    3: { base: { USD: 873, CAD: 1173 }, fast: { USD: 1573, CAD: 2173 } },
  },
  Both: {
    1: { base: { USD: 637, CAD: 837 }, fast: { USD: 1037, CAD: 1337 } },
    2: { base: { USD: 1037, CAD: 1337 }, fast: { USD: 1537, CAD: 2037 } },
    3: { base: { USD: 1337, CAD: 1837 }, fast: { USD: 1937, CAD: 2737 } },
  },
  AI: {
    1: { base: { USD: 1773, CAD: 2473 } },
    2: { base: { USD: 2773, CAD: 3773 } },
    3: { base: { USD: 3773, CAD: 4973 } },
  },
}

function clone(obj) {
  if (!obj) return obj
  return structuredClone(obj)
}

function deepClone(obj) {
  if (!obj) return obj
  return structuredClone(obj)
}

export default function PricingManager() {
  const queryClient = useQueryClient()
  const [prices, setPrices] = useState(clone(DEFAULT_PRICES))
  const initialRef = useRef(clone(DEFAULT_PRICES))
  const [currency, setCurrency] = useState('USD')
  const [saving, setSaving] = useState(false)

  // invalidMap: { "Graphic.1.base.USD": "message" }
  const [invalidMap, setInvalidMap] = useState({})
  const [toasts, setToasts] = useState([])

  // --- React Query Fetch ---
  const { data: serverPrices, isLoading: loading } = useQuery({
    queryKey: ['admin-pricing'],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/pricing?_t=${Date.now()}`,
        { credentials: 'include' },
      )
      if (!response.ok) throw new Error('Failed to load pricing')
      const result = await response.json()
      if (!result.success) throw new Error('API returned failure')
      return result.data
    },
    onError: () => pushToast('error', 'Load failed', 'Failed to load pricing data'),
    // Disable background refetching here so we don't accidentally overwrite decimal inputs if the user is typing slowly
    refetchOnWindowFocus: false, 
  })

  // Synchronize server state into local state intelligently
  useEffect(() => {
    if (serverPrices) {
      if (!hasChanges()) {
        // If the user hasn't typed anything yet, safely replace the matrix
        setPrices(clone(serverPrices))
        initialRef.current = clone(serverPrices)
      } else {
        // If the user IS typing but a fetch happens, just update the baseline reference silently
        initialRef.current = clone(serverPrices)
      }
    }
  }, [serverPrices])

  // --- React Query Mutations ---
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/pricing?_t=${Date.now()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      )
      if (!response.ok) throw new Error('Failed to save prices')
    },
    onMutate: () => setSaving(true),
    onSuccess: (_, payload) => {
      initialRef.current = clone(payload)
      setPrices(clone(payload))
      pushToast('success', 'Saved', 'Prices saved successfully.')
      queryClient.invalidateQueries(['admin-pricing'])
    },
    onError: (err) => {
      console.error(err)
      pushToast('error', 'Save failed', 'Unable to save prices. See console for details.')
    },
    onSettled: () => setSaving(false)
  })

  // --- Toast helpers ---
  function pushToast(type, title, message = '') {
    const id = Date.now() + Math.random().toString(16).slice(2)
    setToasts((t) => [...t, { id, type, title, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }

  // --- Input handling: allow empty or numeric-like typing ---
  function updatePrice(category, level, path, rawValue) {
    if (rawValue === '' || rawValue === null || typeof rawValue === 'undefined') {
      setPrices((p) => {
        const copy = clone(p)
        if (!copy[category]) copy[category] = {}
        if (!copy[category][level]) copy[category][level] = {}
        if (!copy[category][level][path]) copy[category][level][path] = {}
        copy[category][level][path][currency] = ''
        return copy
      })
      setInvalidMap((m) => {
        const copy = { ...m }
        delete copy[`${category}.${level}.${path}.${currency}`]
        return copy
      })
      return
    }

    const allowed = /^[0-9]*\.?[0-9]*$/
    if (!allowed.test(rawValue)) return

    const asNum = Number(rawValue)
    const valueToStore = Number.isFinite(asNum) && String(asNum) === rawValue ? asNum : rawValue

    setPrices((p) => {
      const copy = clone(p)
      if (!copy[category]) copy[category] = {}
      if (!copy[category][level]) copy[category][level] = {}
      if (!copy[category][level][path]) copy[category][level][path] = {}
      copy[category][level][path][currency] = valueToStore
      return copy
    })

    setInvalidMap((m) => {
      const copy = { ...m }
      delete copy[`${category}.${level}.${path}.${currency}`]
      return copy
    })
  }

  // --- Change detection ---
  function hasChanges() {
    return JSON.stringify(initialRef.current) !== JSON.stringify(prices)
  }

  // --- Validation before save ---
  function isNumericValue(v) {
    if (v === '' || v === null || typeof v === 'undefined') return false
    if (typeof v === 'number') return Number.isFinite(v)
    if (typeof v === 'string') {
      const t = v.trim()
      if (t === '') return false
      const n = Number(t)
      return Number.isFinite(n)
    }
    return false
  }

  function runValidation() {
    const invalid = {}
    for (const cat of Object.keys(prices)) {
      const levels = prices[cat]
      for (const lvl of Object.keys(levels)) {
        const level = levels[lvl]

        if (!isNumericValue(level?.base?.USD)) invalid[`${cat}.${lvl}.base.USD`] = 'Base USD required (number)'
        if (!isNumericValue(level?.base?.CAD)) invalid[`${cat}.${lvl}.base.CAD`] = 'Base CAD required (number)'

        if (level.fast) {
          if (!isNumericValue(level?.fast?.USD)) invalid[`${cat}.${lvl}.fast.USD`] = 'Fast USD required (number)'
          if (!isNumericValue(level?.fast?.CAD)) invalid[`${cat}.${lvl}.fast.CAD`] = 'Fast CAD required (number)'
        }
      }
    }
    setInvalidMap(invalid)
    return Object.keys(invalid).length === 0
  }

  function sanitizeForSave(obj) {
    const copy = clone(obj)
    for (const cat of Object.keys(copy)) {
      for (const lvl of Object.keys(copy[cat])) {
        const level = copy[cat][lvl]
        if (level.base) {
          level.base.USD = convertToNumberOrNull(level.base.USD)
          level.base.CAD = convertToNumberOrNull(level.base.CAD)
        }
        if (level.fast) {
          level.fast.USD = convertToNumberOrNull(level.fast.USD)
          level.fast.CAD = convertToNumberOrNull(level.fast.CAD)
        }
      }
    }
    return copy
  }

  function convertToNumberOrNull(v) {
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const t = v.trim()
      if (t === '') return null
      const n = Number(t)
      return Number.isFinite(n) ? n : null
    }
    return null
  }

  // --- Save handler ---
  async function saveAll() {
    if (!hasChanges()) {
      pushToast('info', 'No changes', 'No changes detected — nothing to save.')
      return
    }

    const ok = runValidation()
    if (!ok) {
      const key = Object.keys(invalidMap)[0]
      const msg = invalidMap[key] || 'Validation error — check fields'
      pushToast('error', 'Validation error', msg)
      return
    }

    const payload = sanitizeForSave(prices)
    saveMutation.mutate(payload)
  }

  function isInvalidKey(category, level, tier, cur) {
    return !!invalidMap[`${category}.${level}.${tier}.${cur}`]
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm w-full rounded-md border px-3 py-2 shadow-md ${
              t.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-900'
                : t.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-sky-50 border-sky-200 text-sky-900'
            }`}
          >
            <div className="font-semibold">{t.title}</div>
            {t.message && <div className="text-sm">{t.message}</div>}
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-2xl font-semibold">Pricing</h2>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm">Currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="rounded border px-2 py-1"
        >
          <option>USD</option>
          <option>CAD</option>
        </select>
        <button
          onClick={saveAll}
          className="ml-auto rounded bg-[#cff000] px-3 py-1 font-semibold disabled:opacity-50"
          disabled={saving || loading}
        >
          {saving ? 'Saving...' : loading ? 'Loading...' : 'Save All'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.keys(prices).map((cat) => (
          <div key={cat} className="rounded-lg border bg-white p-4">
            <h3 className="mb-3 font-medium">{cat}</h3>
            <div className="grid gap-3">
              {Object.keys(prices[cat]).map((lvl) => (
                <div key={lvl} className="flex items-center gap-3">
                  <div className="w-24 font-medium">Level {lvl}</div>

                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Base ({currency})</label>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      type="text"
                      value={prices[cat][lvl].base?.[currency] ?? ''}
                      onChange={(e) => updatePrice(cat, lvl, 'base', e.target.value)}
                      className={`w-full rounded border px-2 py-1 ${
                        isInvalidKey(cat, lvl, 'base', currency) ? 'border-red-400' : ''
                      }`}
                    />
                  </div>

                  {prices[cat][lvl].fast && (
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Fast ({currency})</label>
                      <input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        type="text"
                        value={prices[cat][lvl].fast?.[currency] ?? ''}
                        onChange={(e) => updatePrice(cat, lvl, 'fast', e.target.value)}
                        className={`w-full rounded border px-2 py-1 ${
                          isInvalidKey(cat, lvl, 'fast', currency) ? 'border-red-400' : ''
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
