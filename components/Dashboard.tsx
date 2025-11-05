'use client'

import { useEffect, useState } from 'react'

interface Module {
  name: string
  status: string
  info?: {
    name: string
    description: string
    capabilities: string[]
  }
}

interface HealthStatus {
  status: string
  modules_loaded: number
  modules: Record<string, any>
}

export function Dashboard() {
  const [modules, setModules] = useState<Module[]>([])
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [mdeStats, setMdeStats] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [modulesRes, healthRes, mdeRes] = await Promise.all([
        fetch('/api/modules'),
        fetch('/api/health'),
        fetch('/api/mde/machines').catch(() => ({ ok: false }))
      ])

      const modulesData = await modulesRes.json()
      const healthData = await healthRes.json()

      setModules(modulesData.modules || [])
      setHealth(healthData)

      // Fetch MDE stats if available
      if (mdeRes.ok) {
        const mdeData = await mdeRes.json()
        if (mdeData.value) {
          const machines = mdeData.value
          setMdeStats({
            totalMachines: machines.length,
            onlineMachines: machines.filter((m: any) => m.healthStatus === 'Active').length,
            isolatedMachines: machines.filter((m: any) => m.machineIsolationStatus === 'Isolated').length,
            highRiskMachines: machines.filter((m: any) => m.riskScore === 'High').length
          })
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getModulesByCapability = (capability: string) => {
    return modules.filter(m =>
      m.info?.capabilities?.includes(capability)
    )
  }

  const activeModules = modules.filter(m => m.status === 'active').length

  if (loading) {
    return <div className="text-textMuted">Loading dashboard...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Security Operations Dashboard</h1>
        <p className="text-textMuted">Real-time overview of your security infrastructure</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon="🛡️" label="Active Modules" value={`${activeModules}/${modules.length}`} />
        <StatCard icon="🐝" label="Incident Management" value={getModulesByCapability('incident_management').length} />
        <StatCard icon="🔍" label="Threat Intel" value={getModulesByCapability('threat_intelligence').length} />
        <StatCard icon="🦎" label="EDR Systems" value={getModulesByCapability('edr').length} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Available Modules */}
        <div className="card">
          <h3 className="text-primary text-xl mb-4">🔧 Available Modules</h3>
          <div className="space-y-3">
            {modules.length === 0 ? (
              <p className="text-textMuted">No modules configured. Add API keys to enable modules.</p>
            ) : (
              modules.map((module, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-surfaceLight/30 rounded-lg border border-surfaceLight">
                  <div>
                    <strong className="text-text">{module.info?.name || module.name}</strong>
                    <p className="text-textMuted text-sm">{module.info?.description}</p>
                  </div>
                  <span className={`badge ${module.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                    {module.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="card">
          <h3 className="text-primary text-xl mb-4">📊 System Health</h3>
          {health && (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-surfaceLight/30 rounded-lg">
                <span className="text-textMuted">Overall Status:</span>
                <span className={`badge ${health.status === 'healthy' ? 'badge-success' : 'badge-error'}`}>
                  {health.status}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-surfaceLight/30 rounded-lg">
                <span className="text-textMuted">Modules Loaded:</span>
                <span className="text-text">{health.modules_loaded}</span>
              </div>

              {Object.keys(health.modules || {}).length > 0 && (
                <>
                  <h4 className="text-primary mt-5 mb-2">Module Health Status</h4>
                  {Object.entries(health.modules).map(([name, status]: [string, any]) => (
                    <div key={name} className="flex justify-between items-center p-3 bg-surfaceLight/20 rounded-lg border-l-4 border-primary">
                      <span className="text-text capitalize">{name}</span>
                      <span className={`badge ${status.status === 'healthy' ? 'badge-success' : 'badge-error'}`}>
                        {status.status}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Microsoft Defender for Endpoint Widget */}
      {mdeStats && (
        <div className="card mb-8 border-2 border-primary/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-primary text-xl">🛡️ Microsoft Defender for Endpoint</h3>
            <a
              href="/mde"
              className="btn btn-primary text-sm"
            >
              View Dashboard →
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-surfaceLight/30 rounded-lg">
              <div className="text-textMuted text-sm mb-1">Total Machines</div>
              <div className="text-2xl font-semibold text-text">{mdeStats.totalMachines}</div>
            </div>
            <div className="p-4 bg-surfaceLight/30 rounded-lg">
              <div className="text-textMuted text-sm mb-1">Online</div>
              <div className="text-2xl font-semibold text-green-400">{mdeStats.onlineMachines}</div>
            </div>
            <div className="p-4 bg-surfaceLight/30 rounded-lg">
              <div className="text-textMuted text-sm mb-1">Isolated</div>
              <div className="text-2xl font-semibold text-yellow-400">{mdeStats.isolatedMachines}</div>
            </div>
            <div className="p-4 bg-surfaceLight/30 rounded-lg">
              <div className="text-textMuted text-sm mb-1">High Risk</div>
              <div className="text-2xl font-semibold text-red-400">{mdeStats.highRiskMachines}</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-primary text-xl mb-4">🚀 Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/thehive" className="btn btn-primary">View All Cases</a>
          <a href="/limacharlie" className="btn btn-primary">Check Sensors</a>
          <a href="/mde" className="btn btn-primary">MDE Machines</a>
          <a href="/mde/settings" className="btn btn-primary">MDE Settings</a>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="text-5xl">{icon}</div>
      <div className="flex-1">
        <div className="text-textMuted text-sm mb-1">{label}</div>
        <div className="text-3xl font-semibold">{value}</div>
      </div>
    </div>
  )
}
