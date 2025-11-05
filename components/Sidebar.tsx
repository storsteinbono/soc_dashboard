'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface HealthStatus {
  status: string
  modules_loaded: number
}

export function Sidebar() {
  const pathname = usePathname()
  const [health, setHealth] = useState<HealthStatus | null>(null)

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      console.error('Error fetching health:', error)
    }
  }

  const navItems = [
    { href: '/', icon: '📊', label: 'Dashboard' },
    { href: '/status', icon: '💚', label: 'System Status' },
  ]

  const incidentMgmt = [
    { href: '/thehive', icon: '🐝', label: 'TheHive' },
  ]

  const edrTools = [
    { href: '/limacharlie', icon: '🦎', label: 'LimaCharlie' },
  ]

  const threatIntel = [
    { href: '/threat-intel', icon: '🔍', label: 'Analysis Tools' },
  ]

  return (
    <aside className="w-64 bg-gradient-to-b from-surface to-[#0f1729] border-r border-surfaceLight fixed h-screen overflow-y-auto">
      <div className="p-5">
        {/* Logo */}
        <div className="mb-8 pb-5 border-b border-surfaceLight">
          <h2 className="text-primary text-2xl font-bold">🛡️ SOC Dashboard</h2>
        </div>

        {/* Main Navigation */}
        <NavSection title="Main" items={navItems} pathname={pathname} />
        <NavSection title="Incident Management" items={incidentMgmt} pathname={pathname} />
        <NavSection title="EDR & Response" items={edrTools} pathname={pathname} />
        <NavSection title="Threat Intelligence" items={threatIntel} pathname={pathname} />

        {/* Health Indicator */}
        {health && (
          <div className="mt-auto pt-5 border-t border-surfaceLight">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className={`status-dot ${health.status === 'healthy' ? 'status-dot-healthy' : 'status-dot-error'}`}></span>
              <span className="text-sm">{health.status}</span>
            </div>
            <div className="text-textMuted text-sm">
              {health.modules_loaded} modules loaded
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

function NavSection({
  title,
  items,
  pathname
}: {
  title: string
  items: Array<{ href: string; icon: string; label: string }>
  pathname: string
}) {
  return (
    <div className="mb-6">
      <h3 className="text-textMuted text-xs uppercase tracking-wider mb-2.5 font-semibold">
        {title}
      </h3>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`
            flex items-center gap-2.5 px-4 py-3 rounded-lg mb-1 transition-all
            ${pathname === item.href
              ? 'bg-primary/10 text-primary'
              : 'text-textMuted hover:bg-primary/10 hover:text-primary hover:translate-x-1'
            }
          `}
        >
          <span className="text-xl">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  )
}
