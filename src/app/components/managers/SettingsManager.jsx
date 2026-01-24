'use client'
import React, { useState } from 'react'
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi'

export default function SettingsManager() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })

  const handlePasswordChange = async () => {
    // Validation
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordMessage({
        type: 'error',
        text: 'All password fields are required',
      })
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' })
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: 'New password must be at least 6 characters',
      })
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000)
      return
    }

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

      console.log('Attempting to change password...')

      // Get JWT from localStorage
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('dsqr_token')
          : null

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()
      console.log('Password change response:', data)

      if (response.ok) {
        setPasswordMessage({
          type: 'success',
          text: 'Password changed successfully! Please use your new password for next login.',
        })
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setTimeout(() => setPasswordMessage({ type: '', text: '' }), 5000)
      } else {
        console.error('Password change failed:', data)
        setPasswordMessage({
          type: 'error',
          text: data.message || 'Failed to change password',
        })
        setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000)
      }
    } catch (error) {
      console.error('Network error during password change:', error)
      setPasswordMessage({
        type: 'error',
        text: 'Network error. Please try again.',
      })
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-600 mt-2">
          Manage your admin account security
        </p>
      </div>

      {/* Password Change Section */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl shadow-md border-2 border-slate-200 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-[#cff000] to-[#b8dc00] rounded-xl shadow-lg">
            <FiLock className="h-7 w-7 text-slate-900" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              Change Password
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Update your admin account password for enhanced security
            </p>
          </div>
        </div>

        {passwordMessage.text && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg border animate-in fade-in slide-in-from-top-2 duration-300 ${
              passwordMessage.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {passwordMessage.type === 'success' ? '✓' : '⚠'}{' '}
            {passwordMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Enter current password"
                className="w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#cff000] focus:border-[#cff000] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    current: !showPasswords.current,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showPasswords.current ? (
                  <FiEyeOff className="h-5 w-5" />
                ) : (
                  <FiEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Enter new password"
                className="w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#cff000] focus:border-[#cff000] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    new: !showPasswords.new,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showPasswords.new ? (
                  <FiEyeOff className="h-5 w-5" />
                ) : (
                  <FiEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Confirm new password"
                className="w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#cff000] focus:border-[#cff000] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    confirm: !showPasswords.confirm,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showPasswords.confirm ? (
                  <FiEyeOff className="h-5 w-5" />
                ) : (
                  <FiEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handlePasswordChange}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#cff000] to-[#b8dc00] text-slate-900 rounded-lg font-semibold hover:from-[#b8dc00] hover:to-[#a0c800] transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <FiLock className="h-5 w-5" />
            Change Password
          </button>
        </div>
      </div>
    </div>
  )
}
