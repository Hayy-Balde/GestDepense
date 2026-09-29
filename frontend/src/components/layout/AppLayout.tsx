import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { QuickAddModals } from './QuickAddModals'
import { LockScreen } from './LockScreen'
import { Toaster } from '../ui/toaster'

export function AppLayout() {

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />

      {/* Global quick-add dialogs (accessible from anywhere) */}
      <QuickAddModals />

      {/* Session inactivity lock */}
      <LockScreen />

      {/* Global toasts */}
      <Toaster />
    </div>
  )
}
