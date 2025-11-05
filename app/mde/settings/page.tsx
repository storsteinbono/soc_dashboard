'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MDESettingsPage() {
  const router = useRouter()
  const [tenantId, setTenantId] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      // In production, this would load from Supabase database
      // For now, load from localStorage
      const saved = localStorage.getItem('mde_config')
      if (saved) {
        const config = JSON.parse(saved)
        setTenantId(config.tenantId || '')
        setClientId(config.clientId || '')
        // Don't load secret for security
      }
    } catch (error) {
      console.error('Error loading config:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setTestResult(null)

    try {
      // In production, this would save to Supabase database with encryption
      // For now, save to localStorage (NOT SECURE - for demo only)
      const config = {
        tenantId,
        clientId,
        clientSecret,
      }

      localStorage.setItem('mde_config', JSON.stringify(config))

      // Also update environment variables for Edge Function
      // In production, this would be done through Supabase dashboard or API
      alert('Configuration saved! Please restart Edge Functions to apply changes.\n\nIn production, add these to your .env file:\nMDE_TENANT_ID\nMDE_CLIENT_ID\nMDE_CLIENT_SECRET')

    } catch (error) {
      alert('Failed to save configuration')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/mde/health')

      if (response.ok) {
        const data = await response.json()
        if (data.status === 'healthy') {
          setTestResult({
            success: true,
            message: `Connected successfully! ${data.machines_count || 0} machines found.`
          })
        } else {
          setTestResult({
            success: false,
            message: data.message || 'Connection failed'
          })
        }
      } else {
        setTestResult({
          success: false,
          message: 'Failed to connect to MDE API'
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error}`
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">⚙️ Microsoft Defender for Endpoint Settings</h1>
        <p className="text-textMuted">Configure Azure AD application credentials for MDE API access</p>
      </div>

      <div className="card mb-6">
        <h2 className="text-2xl font-bold mb-6">Azure AD Application Setup</h2>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-primary/10 border border-primary rounded-lg p-4">
            <h3 className="text-primary font-semibold mb-2">📋 Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-textMuted">
              <li>Go to <a href="https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps" target="_blank" className="text-primary underline">Azure Portal → App Registrations</a></li>
              <li>Click "New registration"</li>
              <li>Name it "SOC Dashboard MDE Integration"</li>
              <li>Copy the "Application (client) ID" and "Directory (tenant) ID"</li>
              <li>Go to "Certificates & secrets" → "New client secret"</li>
              <li>Copy the secret value immediately (you won't see it again)</li>
              <li>Go to "API permissions" → "Add a permission"</li>
              <li>Select "APIs my organization uses" → search for "WindowsDefenderATP"</li>
              <li>Add these Application permissions:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Machine.Read.All</li>
                  <li>Machine.Isolate</li>
                  <li>Machine.RestrictExecution</li>
                  <li>Machine.Scan</li>
                  <li>Machine.StopAndQuarantine</li>
                  <li>Machine.CollectForensics</li>
                  <li>Alert.Read.All</li>
                  <li>Alert.ReadWrite.All</li>
                  <li>AdvancedQuery.Read.All</li>
                  <li>File.Read.All</li>
                  <li>Ti.ReadWrite.All</li>
                </ul>
              </li>
              <li>Click "Grant admin consent" (requires admin privileges)</li>
            </ol>
          </div>

          {/* Tenant ID */}
          <div>
            <label className="block mb-2 font-semibold">
              Tenant ID (Directory ID)
            </label>
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="input"
            />
            <p className="text-xs text-textMuted mt-1">
              Found in Azure Portal → Azure Active Directory → Overview
            </p>
          </div>

          {/* Client ID */}
          <div>
            <label className="block mb-2 font-semibold">
              Client ID (Application ID)
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="input"
            />
            <p className="text-xs text-textMuted mt-1">
              Found in Azure Portal → App Registrations → Your App → Overview
            </p>
          </div>

          {/* Client Secret */}
          <div>
            <label className="block mb-2 font-semibold">
              Client Secret
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Enter client secret value"
              className="input"
            />
            <p className="text-xs text-textMuted mt-1">
              Found in Azure Portal → App Registrations → Your App → Certificates & secrets
            </p>
            <p className="text-xs text-warning mt-1">
              ⚠️ Store securely! The secret value is only shown once when created.
            </p>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testResult.success
                ? 'bg-success/10 border-success text-success'
                : 'bg-error/10 border-error text-error'
            }`}>
              {testResult.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving || !tenantId || !clientId || !clientSecret}
              className="btn btn-primary flex-1"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
            <button
              onClick={handleTest}
              disabled={testing || !tenantId || !clientId || !clientSecret}
              className="btn btn-secondary flex-1"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={() => router.push('/mde')}
              className="btn btn-secondary"
            >
              Back to MDE
            </button>
          </div>
        </div>
      </div>

      {/* Production Deployment Note */}
      <div className="card bg-warning/10 border-warning">
        <h3 className="text-warning font-semibold mb-2">🔒 Production Deployment</h3>
        <p className="text-sm text-textMuted mb-2">
          For production use, add these environment variables to your <code className="bg-surface px-1 rounded">.env</code> file:
        </p>
        <pre className="bg-surface p-4 rounded-lg text-sm overflow-x-auto">
{`# Microsoft Defender for Endpoint
MDE_TENANT_ID=${tenantId || 'your-tenant-id'}
MDE_CLIENT_ID=${clientId || 'your-client-id'}
MDE_CLIENT_SECRET=${clientSecret || 'your-client-secret'}`}
        </pre>
        <p className="text-xs text-textMuted mt-2">
          Then restart the Edge Functions container:
        </p>
        <pre className="bg-surface p-2 rounded text-xs mt-1">
docker-compose -f docker-compose.supabase.yml restart functions
        </pre>
      </div>
    </div>
  )
}
