// admin/components/Sidebar.jsx
'use client'
import React from 'react'
import Image from 'next/image'
import {
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import {
  FiHome,
  FiUser,
  FiVideo,
  FiImage,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiLayers,
  FiDollarSign,
  FiStar,
} from 'react-icons/fi'
import { MENU as MENU_CONFIG } from '@/config/menu'

const ICON_MAP = {
  dashboard: <FiHome />,
  home: <FiLayers />,
  clients: <FiUser />,
  videos: <FiVideo />,
  graphics: <FiImage />,
  pricing: <FiDollarSign />,
  testimonials: <FiStar />,
  ourwork: <FiLayers />,
  ai: <FiImage />,
  affiliates: <FiUser />,
  about: <FiUser />,
  settings: <FiSettings />,
}

export default function Sidebar({
  active,
  onSelect,
  activeSub,
  onSelectSub,
  collapsed,
  setCollapsed,
}) {
  const MENU = MENU_CONFIG // use shared config

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  async function handleLogout() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // <-- sends the httpOnly cookie to server
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      try {
        sessionStorage.removeItem('dsqr_logged_in')
      } catch {}
      window.location.href = '/login' // redirect to login page
    }
  }

  return (
    <div
      className={`sticky top-0 z-30 h-screen transition-all duration-300 ${
        collapsed ? 'w-16 sm:w-20' : 'w-64 sm:w-72'
      }`}
    >
      <div
        className={`h-full bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-900/95 ring-1 ring-black/10 shadow-2xl backdrop-blur-md border-r border-slate-700/50 overflow-hidden flex flex-col`}
      >
        <div className="sticky top-0 z-20 bg-transparent">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4">
            <Image
              src="/dsqr_logo.png"
              alt="DSQR"
              width={collapsed ? 36 : 44}
              height={collapsed ? 36 : 44}
              className="rounded-md object-contain transition-all duration-300"
            />
            {!collapsed && (
              <div className="flex-1 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="text-white text-base sm:text-lg font-bold leading-tight">
                  DSQR
                </div>
                <div className="text-[10px] sm:text-sm text-slate-300">
                  Admin Panel
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="px-3 sm:px-3 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400 px-2 py-2 font-semibold">
                Navigation
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-6 scrollbar-hide">
          <SidebarContent>
            <SidebarMenu className="py-2">
              {MENU.map((m) => {
                const isActive = active === m.id
                return (
                  <div key={m.id} className="mb-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => {
                          onSelect?.(m.id)
                          if (m.sub && m.sub.length > 0) onSelectSub?.(m.sub[0])
                          else onSelectSub?.(null)
                        }}
                        className={`group relative flex w-full items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-r from-slate-800 to-slate-700/95 shadow-lg shadow-[#cff000]/10'
                            : 'hover:bg-slate-800/70'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#cff000] via-[#b8dc00] to-[#cff000] rounded-tr-md rounded-br-md shadow-lg shadow-[#cff000]/50" />
                        )}

                        <div
                          className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-base sm:text-lg z-10 transition-all duration-300 ${
                            isActive
                              ? 'bg-gradient-to-br from-[#cff000] to-[#b8dc00] text-black shadow-md'
                              : 'bg-white/10 text-slate-200 group-hover:bg-white/15'
                          }`}
                        >
                          {ICON_MAP[m.id] || <FiLayers />}
                        </div>

                        {!collapsed && (
                          <div className="flex-1 z-10 animate-in fade-in slide-in-from-left-2 duration-300">
                            <div
                              className={`text-xs sm:text-sm ${
                                isActive
                                  ? 'text-white font-bold'
                                  : 'text-slate-100 group-hover:text-white'
                              } transition-colors duration-200`}
                            >
                              {m.label}
                            </div>
                          </div>
                        )}

                        {!collapsed && (
                          <div
                            className={`z-10 text-xs sm:text-sm ${
                              isActive
                                ? 'text-[#cff000]'
                                : 'text-slate-400 group-hover:text-slate-300'
                            } transition-colors duration-200`}
                          >
                            ›
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {!collapsed && m.sub && isActive && (
                      <div className="mt-1 ml-8 sm:ml-12 flex flex-col gap-1 animate-in slide-in-from-top-2 fade-in duration-300">
                        {m.sub.map((s) => (
                          <button
                            key={s}
                            onClick={() => onSelectSub?.(s)}
                            className={`group/sub flex w-full items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm transition-all duration-200 ${
                              activeSub === s
                                ? 'bg-slate-800/80 text-white font-semibold shadow-sm'
                                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                            }`}
                          >
                            <span
                              className={`inline-block h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                                activeSub === s
                                  ? 'bg-[#cff000] shadow-sm shadow-[#cff000]/50'
                                  : 'bg-white/30 group-hover/sub:bg-white/50'
                              }`}
                            />
                            <span className="truncate">{s}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </SidebarMenu>
          </SidebarContent>
        </div>

        <SidebarFooter className="border-t border-white/10 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-full bg-gradient-to-br from-[#cff000] to-[#b8dc00] flex items-center justify-center text-black font-bold shadow-md">
              A
            </div>

            {!collapsed && (
              <div className="flex-1 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="text-xs sm:text-sm text-white font-semibold">
                  Admin
                </div>
                <div className="text-[10px] sm:text-xs text-slate-300 truncate">
                  admin@dsqr.com
                </div>
              </div>
            )}

            <div className="z-10">
              <button
                onClick={handleLogout}
                className="rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white/90 bg-white/5 hover:bg-gradient-to-r hover:from-[#cff000] hover:to-[#b8dc00] hover:text-black font-medium transition-all duration-300 shadow-sm hover:shadow-md"
                title="Logout"
              >
                {!collapsed ? 'Logout' : '⏻'}
              </button>
            </div>
          </div>
        </SidebarFooter>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
        className={`absolute top-4 z-40 rounded-full p-1.5 sm:p-2 text-white shadow-xl transition-all duration-300 ${
          collapsed
            ? '-right-2 sm:-right-3 bg-gradient-to-br from-slate-800/95 to-slate-900/95 hover:from-slate-700/95 hover:to-slate-800/95'
            : 'right-3 sm:right-4 bg-slate-800/90 hover:bg-slate-700/90'
        } hover:scale-110 active:scale-95 border border-white/10`}
        title={collapsed ? 'Open' : 'Collapse'}
      >
        {collapsed ? (
          <FiChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
        ) : (
          <FiChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
        )}
      </button>
    </div>
  )
}
