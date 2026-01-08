// File: admin/src/app/components/DashboardRoot.jsx
'use client'

import React, { useState, useEffect } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import Sidebar from './Sidebar'
import MainArea from './MainArea'

export default function DashboardRoot() {
  const [active, setActive] = useState('dashboard')
  const [activeSub, setActiveSub] = useState(null)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 flex w-full">
        <Sidebar
          active={active}
          activeSub={activeSub}
          onSelect={(id) => {
            setActive(id)
            setActiveSub(null)
          }}
          onSelectSub={(sub) => setActiveSub(sub)}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                    {active === 'dashboard'
                      ? 'Dashboard'
                      : active.charAt(0).toUpperCase() + active.slice(1)}
                  </h1>
                  <div className="text-xs sm:text-sm text-slate-500 mt-1">
                    {active === 'dashboard'
                      ? 'Overview of your content and analytics'
                      : activeSub
                      ? activeSub
                      : 'Manage your content'}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#cff000] to-[#b8dc00] text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 text-center">
                    Welcome, Admin
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <MainArea active={active} activeSub={activeSub} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
