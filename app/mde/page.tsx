'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Machine {
  id: string
  computerDnsName: string
  osPlatform: string
  osVersion: string
  healthStatus: string
  riskScore: string
  exposureLevel: string
  lastSeen: string
  isAadJoined: boolean
}

interface Alert {
  id: string
  title: string
  severity: string
  status: string
  classification: string
  category: string
  createdDateTime: string
  machineId: string
}

export default function MDEPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [machinesRes, alertsRes] = await Promise.all([
        fetch('/api/mde/machines?top=20'),
        fetch('/api/mde/alerts?top=20&orderby=createdDateTime desc')
      ])

      if (machinesRes.ok) {
        const machinesData = await machinesRes.json()
        setMachines(machinesData)
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json()
        setAlerts(alertsData)
      }
    } catch (err) {
      setError('Failed to load MDE data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleIsolateMachine = async (machineId: string) => {
    if (!confirm('Are you sure you want to isolate this machine?')) return

    try {
      const response = await fetch(`/api/mde/machines/${machineId}/isolate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isolationType: 'Full',
          comment: 'Isolated via SOC Dashboard'
        })
      })

      if (response.ok) {
        alert('Machine isolation initiated successfully')
        fetchData()
      } else {
        alert('Failed to isolate machine')
      }
    } catch (err) {
      alert('Error isolating machine')
      console.error(err)
    }
  }

  const handleUnisolateMachine = async (machineId: string) => {
    if (!confirm('Are you sure you want to remove isolation from this machine?')) return

    try {
      const response = await fetch(`/api/mde/machines/${machineId}/unisolate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: 'Unisolated via SOC Dashboard'
        })
      })

      if (response.ok) {
        alert('Machine unisolation initiated successfully')
        fetchData()
      } else {
        alert('Failed to unisolate machine')
      }
    } catch (err) {
      alert('Error unisolating machine')
      console.error(err)
    }
  }

  const handleRunAVScan = async (machineId: string, scanType: 'Quick' | 'Full') => {
    if (!confirm(`Are you sure you want to run a ${scanType} AV scan on this machine?`)) return

    try {
      const response = await fetch(`/api/mde/machines/${machineId}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanType,
          comment: `${scanType} scan initiated via SOC Dashboard`
        })
      })

      if (response.ok) {
        alert(`${scanType} AV scan initiated successfully`)
      } else {
        alert('Failed to initiate AV scan')
      }
    } catch (err) {
      alert('Error initiating AV scan')
      console.error(err)
    }
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'Informational': 'info',
      'Low': 'info',
      'Medium': 'warning',
      'High': 'error',
    }
    return colors[severity] || 'info'
  }

  const getHealthColor = (health: string) => {
    const colors: Record<string, string> = {
      'Active': 'success',
      'Inactive': 'warning',
      'ImpairedCommunication': 'error',
      'NoSensorData': 'error',
    }
    return colors[health] || 'warning'
  }

  if (loading) {
    return <div className="p-8 text-textMuted">Loading Microsoft Defender for Endpoint data...</div>
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🛡️ Microsoft Defender for Endpoint</h1>
        <p className="text-textMuted">Enterprise EDR with machine isolation, AV scanning, and threat hunting</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg text-error">
          {error} - Please configure MDE credentials in settings.
        </div>
      )}

      {/* Quick Actions */}
      <div className="card mb-8">
        <h3 className="text-primary text-xl mb-4">🚀 Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/mde/advancedhunting" className="btn btn-primary">
            Advanced Hunting
          </Link>
          <Link href="/mde/indicators" className="btn btn-primary">
            Manage Indicators
          </Link>
          <button className="btn btn-secondary" onClick={fetchData}>
            Refresh Data
          </button>
          <Link href="/mde/settings" className="btn btn-secondary">
            Configure MDE
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="card flex items-center gap-4">
          <div className="text-5xl">💻</div>
          <div>
            <div className="text-textMuted text-sm">Total Machines</div>
            <div className="text-3xl font-semibold">{machines.length}</div>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="text-5xl">✅</div>
          <div>
            <div className="text-textMuted text-sm">Active Machines</div>
            <div className="text-3xl font-semibold">
              {machines.filter(m => m.healthStatus === 'Active').length}
            </div>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="text-5xl">🚨</div>
          <div>
            <div className="text-textMuted text-sm">Active Alerts</div>
            <div className="text-3xl font-semibold">
              {alerts.filter(a => a.status !== 'Resolved').length}
            </div>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="text-5xl">⚠️</div>
          <div>
            <div className="text-textMuted text-sm">High Severity</div>
            <div className="text-3xl font-semibold">
              {alerts.filter(a => a.severity === 'High').length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Machines */}
        <div className="card">
          <h3 className="text-primary text-xl mb-4">💻 Machines</h3>
          {machines.length === 0 ? (
            <p className="text-textMuted">No machines found. Configure MDE API credentials.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {machines.map((machine) => (
                <div
                  key={machine.id}
                  className="p-4 bg-surfaceLight/30 rounded-lg border border-surfaceLight hover:border-primary transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <strong className="text-text">{machine.computerDnsName}</strong>
                      <p className="text-textMuted text-sm">
                        {machine.osPlatform} {machine.osVersion}
                      </p>
                    </div>
                    <span className={`badge badge-${getHealthColor(machine.healthStatus)}`}>
                      {machine.healthStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-textMuted">Risk Score:</span>
                      <span className="ml-2 text-text">{machine.riskScore}</span>
                    </div>
                    <div>
                      <span className="text-textMuted">Exposure:</span>
                      <span className="ml-2 text-text">{machine.exposureLevel}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleIsolateMachine(machine.id)}
                      className="btn btn-danger btn-sm flex-1"
                    >
                      Isolate
                    </button>
                    <button
                      onClick={() => handleUnisolateMachine(machine.id)}
                      className="btn btn-secondary btn-sm flex-1"
                    >
                      Unisolate
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setSelectedMachine(selectedMachine === machine.id ? null : machine.id)}
                        className="btn btn-primary btn-sm"
                      >
                        Scan
                      </button>
                      {selectedMachine === machine.id && (
                        <div className="absolute right-0 mt-2 w-32 bg-surface border border-surfaceLight rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              handleRunAVScan(machine.id, 'Quick')
                              setSelectedMachine(null)
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-surfaceLight rounded-t-lg"
                          >
                            Quick Scan
                          </button>
                          <button
                            onClick={() => {
                              handleRunAVScan(machine.id, 'Full')
                              setSelectedMachine(null)
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-surfaceLight rounded-b-lg"
                          >
                            Full Scan
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="card">
          <h3 className="text-primary text-xl mb-4">🚨 Recent Alerts</h3>
          {alerts.length === 0 ? (
            <p className="text-textMuted">No alerts found.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 bg-surfaceLight/30 rounded-lg border border-surfaceLight"
                >
                  <div className="flex justify-between items-start mb-2">
                    <strong className="text-text">{alert.title}</strong>
                    <span className={`badge badge-${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                    <div>
                      <span className="text-textMuted">Status:</span>
                      <span className="ml-2 text-text">{alert.status}</span>
                    </div>
                    <div>
                      <span className="text-textMuted">Category:</span>
                      <span className="ml-2 text-text">{alert.category}</span>
                    </div>
                  </div>

                  <div className="text-xs text-textMuted">
                    {new Date(alert.createdDateTime).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
