// admin/components/MainArea.jsx
'use client'
import React from 'react'
import VideoManager from './managers/VideoManager'
import GraphicsManager from './managers/GraphicsManager'
import PricingManager from './managers/PricingManager'
import TestimonialsManager from './managers/TestimonialsManager'
import OurWorkManager from './managers/OurWorkManager'
import WhyUsManager from './managers/WhyUsManager'
import AffiliatedManager from './managers/AffiliatedManager'
import AboutUsManager from './managers/AboutUsManager'
import SettingsManager from './managers/SettingsManager'
import { MENU } from '@/config/menu'
import ClientLogosManager from './managers/ClientLogosManager'
import HomeManager from './managers/HomeManager'
import AiManager from './managers/AiManager'
import DashboardHome from './DashboardHome'
import TeamPhotosManager from './managers/TeamPhotosManager'

/* WelcomeHero (same as before) */
function WelcomeHero() {
  const stats = [
    { value: '11,000+', label: 'Videos Edited' },
    { value: '54k+', label: 'Client Time Saved' },
    { value: '22M+', label: 'Organic Views' },
    { value: '4h/Day', label: 'Time Saved / Client' },
  ]
  const recent = [
    {
      id: 1,
      type: 'image',
      title: 'Ad Creative 9',
      src: 'https://dsqrstudio.b-cdn.net/Graphics/Ad%20creatives/1.png?w=400',
    },
    {
      id: 2,
      type: 'video',
      title: 'Portfolio Thumb 3',
      src: 'https://cdn.example.com/videos/thumb3.jpg',
    },
    {
      id: 3,
      type: 'image',
      title: 'AI Graphic 2',
      src: 'https://dsqrstudio.b-cdn.net/Graphics/Ai%20generated%20graphics/2.png?w=400',
    },
  ]
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50/70 p-6 shadow-lg">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-slate-900">
              Welcome, Admin 👋
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage graphics, videos, portfolios, pricing and site content from
              here.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-full bg-[#cff000] px-4 py-2 text-sm font-semibold shadow-sm hover:brightness-95">
                + New Upload
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
                Import CSV
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
                Export JSON
              </button>
            </div>
          </div>
          <div className="mt-4 flex w-full max-w-md shrink-0 gap-3 md:mt-0">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex-1 rounded-lg bg-white/90 p-3 text-center shadow-inner"
              >
                <div className="text-lg font-bold text-slate-900">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="col-span-2 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Uploads</h3>
              <div className="text-sm text-slate-500">Quick access</div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {recent.map((r) => (
                <div key={r.id} className="rounded border p-3">
                  <div className="h-28 w-full overflow-hidden rounded-md bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.src}
                      alt={r.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-800">
                    {r.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {r.type.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h4 className="text-lg font-semibold">Quick Insights</h4>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <div>
                Active projects: <strong className="text-slate-800">18</strong>
              </div>
              <div>
                Pending approvals: <strong className="text-amber-600">3</strong>
              </div>
              <div>
                Storage used:{' '}
                <strong className="text-slate-800">12.4 GB</strong>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded bg-[#cff000] px-3 py-2 text-sm font-semibold">
                Open Analytics
              </button>
              <button className="rounded border px-3 py-2 text-sm">
                Manage Team
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MainArea({ active, activeSub }) {
  // create id->section map from MENU config (single source)
  const ID_TO_SECTION = MENU.reduce((acc, m) => {
    // default mapping: use label unless you want a special target
    if (m.id === 'ourwork') acc[m.id] = 'Videos'
    else acc[m.id] = m.label
    return acc
  }, {})

  // if a sidebar sub should map to a different section, list it here
  const SUB_TO_SECTION = { 'Before/After Video': 'BeforeAfterSection' }

  // optional rename of sublabels to internal subsections (existing override)
  const SUB_OVERRIDE = {
    'Featured Projects': 'Portfolio',
  }

  // compute mapped values
  const mappedSection =
    activeSub && SUB_TO_SECTION[activeSub]
      ? SUB_TO_SECTION[activeSub]
      : ID_TO_SECTION[active] ||
        (active ? active.charAt(0).toUpperCase() + active.slice(1) : 'Graphics')

  const mappedSub = activeSub ? SUB_OVERRIDE[activeSub] || activeSub : null

  // Dashboard welcome
  if (!active || active === 'dashboard') {
    return <DashboardHome />
  }

  // route other managers
  switch (active) {
    case 'videos':
      return (
        <div className="w-full">
          <VideoManager activeSub={activeSub} />
        </div>
      )
    case 'home':
      return (
        <div className="w-full">
          <HomeManager activeSub={activeSub} />
        </div>
      )
    case 'ai':
      return (
        <div className="w-full">
          <AiManager activeSub={activeSub} />
        </div>
      )

    case 'clients':
      return (
        <div className="w-full">
          <ClientLogosManager />
        </div>
      )
    case 'team':
      return (
        <div className="w-full">
          <TeamPhotosManager />
        </div>
      )
    case 'graphics':
      return (
        <div className="w-full">
          <GraphicsManager activeSub={activeSub} />
        </div>
      )
    case 'pricing':
      return (
        <div className="w-full">
          <PricingManager />
        </div>
      )
    case 'testimonials':
      return (
        <div className="w-full">
          <TestimonialsManager />
        </div>
      )
    case 'ourwork':
      return (
        <div className="w-full">
          <OurWorkManager activeSub={activeSub} />
        </div>
      )
    case 'whyus':
      return (
        <div className="w-full">
          <WhyUsManager />
        </div>
      )
    case 'affiliates':
      return (
        <div className="w-full">
          <AffiliatedManager />
        </div>
      )
    case 'about':
      return (
        <div className="w-full">
          <AboutUsManager />
        </div>
      )
    case 'settings':
      return (
        <div className="w-full">
          <SettingsManager />
        </div>
      )
    default:
      return (
        <div className="rounded-xl bg-white p-6 shadow-sm w-full">
          <h2 className="text-2xl font-semibold">Coming soon</h2>
          <p className="mt-3 text-gray-600">No UI for "{active}" yet.</p>
        </div>
      )
  }
}
