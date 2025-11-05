import {
  BaseModule,
  ModuleInfo,
  HealthStatus,
  ModuleCapability,
  Capability,
  ModuleAPIError,
  ModuleInitError,
} from '../_shared/base-module.ts'

/**
 * Microsoft Defender for Endpoint (MDE) Integration Module
 * Full EDR capabilities with Azure AD authentication
 */
export class MdeModule extends BaseModule {
  private tenantId: string = ''
  private clientId: string = ''
  private clientSecret: string = ''
  private accessToken: string = ''
  private tokenExpiry: number = 0
  private baseUrl: string = 'https://api.securitycenter.microsoft.com/api'
  private loginUrl: string = 'https://login.microsoftonline.com'

  getInfo(): ModuleInfo {
    return {
      name: 'Microsoft Defender for Endpoint',
      version: '2.0.0',
      description: 'Enterprise EDR with machine isolation, AV scanning, threat hunting, and automated response',
      author: 'SOC Dashboard',
      capabilities: [Capability.EDR, Capability.FORENSICS, Capability.AUTOMATION, Capability.THREAT_INTELLIGENCE],
      requires_api_key: true,
      status: this.status,
    }
  }

  async initialize(): Promise<boolean> {
    try {
      this.tenantId = this.getConfigValue<string>('tenant_id', '')
      this.clientId = this.getConfigValue<string>('client_id', '')
      this.clientSecret = this.getConfigValue<string>('client_secret', '')

      if (!this.tenantId || !this.clientId || !this.clientSecret) {
        throw new ModuleInitError('mde', 'Tenant ID, Client ID, or Client Secret not configured')
      }

      // Get initial access token
      await this.getAccessToken()

      // Test connection
      const health = await this.healthCheck()
      if (health.status === 'healthy') {
        this.status = 'active'
        this.initialized = true
        console.log('MDE module initialized successfully')
        return true
      } else {
        this.status = 'error'
        return false
      }
    } catch (error) {
      console.error('Failed to initialize MDE module:', error)
      this.status = 'error'
      return false
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      // Try to get machine statistics as health check
      const response = await this.makeAuthenticatedRequest('GET', '/machines/stats')

      if (response.ok) {
        const data = await response.json()
        return {
          status: 'healthy',
          message: 'Connected to Microsoft Defender for Endpoint',
          tenant: this.tenantId,
          machines_count: data.totalMachines || 0,
        }
      } else {
        return {
          status: 'unhealthy',
          message: `MDE API returned status code ${response.status}`,
        }
      }
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      }
    }
  }

  getCapabilities(): ModuleCapability[] {
    return [
      // Machine Management
      {
        name: 'list_machines',
        description: 'List all machines in the organization',
        endpoint: '/mde/machines',
        method: 'GET',
      },
      {
        name: 'get_machine',
        description: 'Get detailed information about a specific machine',
        endpoint: '/mde/machines/{machine_id}',
        method: 'GET',
      },
      {
        name: 'get_machine_users',
        description: 'Get users logged on to a machine',
        endpoint: '/mde/machines/{machine_id}/users',
        method: 'GET',
      },
      // Isolation & Response
      {
        name: 'isolate_machine',
        description: 'Isolate a machine from the network',
        endpoint: '/mde/machines/{machine_id}/isolate',
        method: 'POST',
      },
      {
        name: 'unisolate_machine',
        description: 'Remove machine isolation',
        endpoint: '/mde/machines/{machine_id}/unisolate',
        method: 'POST',
      },
      {
        name: 'run_av_scan',
        description: 'Run antivirus scan on a machine',
        endpoint: '/mde/machines/{machine_id}/scan',
        method: 'POST',
      },
      {
        name: 'stop_and_quarantine_file',
        description: 'Stop execution and quarantine a file',
        endpoint: '/mde/machines/{machine_id}/stopandquarantinefile',
        method: 'POST',
      },
      {
        name: 'restrict_app_execution',
        description: 'Restrict application execution on machine',
        endpoint: '/mde/machines/{machine_id}/restrictcodeexecution',
        method: 'POST',
      },
      {
        name: 'unrestrict_app_execution',
        description: 'Remove application execution restriction',
        endpoint: '/mde/machines/{machine_id}/unrestrictcodeexecution',
        method: 'POST',
      },
      // Alerts
      {
        name: 'list_alerts',
        description: 'List security alerts',
        endpoint: '/mde/alerts',
        method: 'GET',
      },
      {
        name: 'get_alert',
        description: 'Get specific alert details',
        endpoint: '/mde/alerts/{alert_id}',
        method: 'GET',
      },
      {
        name: 'update_alert',
        description: 'Update alert status and assignment',
        endpoint: '/mde/alerts/{alert_id}',
        method: 'PATCH',
      },
      // Investigation
      {
        name: 'collect_investigation_package',
        description: 'Collect investigation package from machine',
        endpoint: '/mde/machines/{machine_id}/collectinvestigationpackage',
        method: 'POST',
      },
      {
        name: 'run_live_response',
        description: 'Run live response command on machine',
        endpoint: '/mde/machines/{machine_id}/liveresponse',
        method: 'POST',
      },
      // Threat Hunting
      {
        name: 'advanced_hunting',
        description: 'Run advanced hunting query',
        endpoint: '/mde/advancedhunting',
        method: 'POST',
      },
      // Files & Indicators
      {
        name: 'get_file_info',
        description: 'Get file information',
        endpoint: '/mde/files/{file_hash}',
        method: 'GET',
      },
      {
        name: 'add_indicator',
        description: 'Add threat indicator (IoC)',
        endpoint: '/mde/indicators',
        method: 'POST',
      },
    ]
  }

  /**
   * Get OAuth2 access token using client credentials flow
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken
    }

    try {
      const tokenUrl = `${this.loginUrl}/${this.tenantId}/oauth2/v2.0/token`

      const body = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'https://api.securitycenter.microsoft.com/.default',
        grant_type: 'client_credentials',
      })

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new ModuleAPIError('mde', `Failed to get access token: ${error}`, response.status)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + ((data.expires_in - 300) * 1000)

      return this.accessToken
    } catch (error) {
      throw new ModuleAPIError('mde', `Authentication failed: ${error.message}`)
    }
  }

  /**
   * Make authenticated request to MDE API
   */
  private async makeAuthenticatedRequest(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<Response> {
    const token = await this.getAccessToken()

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    return await fetch(`${this.baseUrl}${endpoint}`, options)
  }

  // ==================== Machine Management ====================

  async listMachines(filter?: string, top?: number): Promise<any[]> {
    try {
      let endpoint = '/machines'
      const params = new URLSearchParams()

      if (filter) params.append('$filter', filter)
      if (top) params.append('$top', top.toString())

      if (params.toString()) {
        endpoint += `?${params.toString()}`
      }

      const response = await this.makeAuthenticatedRequest('GET', endpoint)

      if (response.ok) {
        const data = await response.json()
        return data.value || []
      } else {
        throw new ModuleAPIError('mde', `Failed to list machines: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error listing machines:', error)
      return []
    }
  }

  async getMachine(machineId: string): Promise<any | null> {
    try {
      const response = await this.makeAuthenticatedRequest('GET', `/machines/${machineId}`)

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('mde', `Failed to get machine: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error getting machine:', error)
      return null
    }
  }

  async getMachineUsers(machineId: string): Promise<any[]> {
    try {
      const response = await this.makeAuthenticatedRequest('GET', `/machines/${machineId}/logonusers`)

      if (response.ok) {
        const data = await response.json()
        return data.value || []
      } else {
        throw new ModuleAPIError('mde', `Failed to get machine users: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error getting machine users:', error)
      return []
    }
  }

  // ==================== Isolation & Response Actions ====================

  async isolateMachine(
    machineId: string,
    isolationType: 'Full' | 'Selective' = 'Full',
    comment: string = 'Isolated via SOC Dashboard'
  ): Promise<any | null> {
    try {
      const response = await this.makeAuthenticatedRequest('POST', `/machines/${machineId}/isolate`, {
        Comment: comment,
        IsolationType: isolationType,
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('mde', `Failed to isolate machine: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error isolating machine:', error)
      return null
    }
  }

  async unisolateMachine(
    machineId: string,
    comment: string = 'Unisolated via SOC Dashboard'
  ): Promise<any | null> {
    try {
      const response = await this.makeAuthenticatedRequest('POST', `/machines/${machineId}/unisolate`, {
        Comment: comment,
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('mde', `Failed to unisolate machine: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error unisolating machine:', error)
      return null
    }
  }

  async runAVScan(
    machineId: string,
    scanType: 'Quick' | 'Full' = 'Quick',
    comment: string = 'AV scan initiated via SOC Dashboard'
  ): Promise<any | null> {
    try {
      const response = await this.makeAuthenticatedRequest('POST', `/machines/${machineId}/runAntiVirusScan`, {
        Comment: comment,
        ScanType: scanType,
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('mde', `Failed to run AV scan: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error running AV scan:', error)
      return null
    }
  }

  async stopAndQuarantineFile(
    machineId: string,
    sha1: string,
    comment: string = 'File quarantined via SOC Dashboard'
  ): Promise<any | null> {
    try {
      const response = await this.makeAuthenticatedRequest('POST', `/machines/${machineId}/StopAndQuarantineFile`, {
        Comment: comment,
        Sha1: sha1,
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('mde', `Failed to quarantine file: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error quarantining file:', error)
      return null
    }
  }

  async restrictAppExecution(
    machineId: string,
    comment: string = 'App execution restricted via SOC Dashboard'
  ): Promise<any | null> {
    try {
      const response = await this.makeAuthenticatedRequest('POST', `/machines/${machineId}/restrictCodeExecution`, {
        Comment: comment,
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('mde', `Failed to restrict app execution: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error restricting app execution:', error)
      return null
    }
  }

  async unrestrictAppExecution(
    machineId: string,
    comment: string = 'App execution unrestricted via SOC Dashboard'
  ): Promise<any | null> {
    try {
      const response = await this.makeAuthenticatedRequest('POST', `/machines/${machineId}/unrestrictCodeExecution`, {
        Comment: comment,
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('mde', `Failed to unrestrict app execution: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error unrestricting app execution:', error)
      return null
    }
  }

  // ==================== Alerts ====================

  async listAlerts(filter?: string, top?: number, orderBy?: string): Promise<any[]> {
    try {
      let endpoint = '/alerts'
      const params = new URLSearchParams()

      if (filter) params.append('$filter', filter)
      if (top) params.append('$top', top.toString())
      if (orderBy) params.append('$orderby', orderBy)

      if (params.toString()) {
        endpoint += `?${params.toString()}`
      }

      const response = await this.makeAuthenticatedRequest('GET', endpoint)

      if (response.ok) {
        const data = await response.json()
        return data.value || []
      } else {
        throw new ModuleAPIError('mde', `Failed to list alerts: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error listing alerts:', error)
      return []
    }
  }

  async getAlert(alertId: string): Promise<any | null> {
    try {
      const response = await this.makeAuthenticatedRequest('GET', `/alerts/${alertId}`)

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('mde', `Failed to get alert: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error getting alert:', error)
      return null
    }
  }

  async updateAlert(
    alertId: string,
    status?: 'New' | 'InProgress' | 'Resolved',
    assignedTo?: string,
    classification?: 'TruePositive' | 'FalsePositive' | 'Informational',
    determination?: string,
    comment?: string
  ): Promise<any | null> {
    try {
      const body: any = {}
      if (status) body.status = status
      if (assignedTo) body.assignedTo = assignedTo
      if (classification) body.classification = classification
      if (determination) body.determination = determination
      if (comment) body.comment = comment

      const response = await this.makeAuthenticatedRequest('PATCH', `/alerts/${alertId}`, body)

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('mde', `Failed to update alert: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error updating alert:', error)
      return null
    }
  }

  // ==================== Investigation ====================

  async collectInvestigationPackage(
    machineId: string,
    comment: string = 'Investigation package collected via SOC Dashboard'
  ): Promise<any | null> {
    try {
      const response = await this.makeAuthenticatedRequest('POST', `/machines/${machineId}/collectInvestigationPackage`, {
        Comment: comment,
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('mde', `Failed to collect investigation package: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error collecting investigation package:', error)
      return null
    }
  }

  // ==================== Advanced Hunting ====================

  async advancedHunting(query: string): Promise<any[]> {
    try {
      const response = await this.makeAuthenticatedRequest('POST', '/advancedqueries/run', {
        Query: query,
      })

      if (response.ok) {
        const data = await response.json()
        return data.Results || []
      } else {
        throw new ModuleAPIError('mde', `Advanced hunting query failed: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error running advanced hunting query:', error)
      return []
    }
  }

  // ==================== Files & Indicators ====================

  async getFileInfo(sha1: string): Promise<any | null> {
    try {
      const response = await this.makeAuthenticatedRequest('GET', `/files/${sha1}`)

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('mde', `Failed to get file info: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error getting file info:', error)
      return null
    }
  }

  async addIndicator(
    indicatorValue: string,
    indicatorType: 'FileSha1' | 'FileSha256' | 'IpAddress' | 'DomainName' | 'Url',
    action: 'Alert' | 'AlertAndBlock' | 'Allowed',
    title: string,
    description: string,
    severity: 'Informational' | 'Low' | 'Medium' | 'High',
    expirationTime?: string
  ): Promise<any | null> {
    try {
      const body: any = {
        indicatorValue,
        indicatorType,
        action,
        title,
        description,
        severity,
      }

      if (expirationTime) {
        body.expirationTime = expirationTime
      }

      const response = await this.makeAuthenticatedRequest('POST', '/indicators', body)

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('mde', `Failed to add indicator: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error adding indicator:', error)
      return null
    }
  }

  // ==================== Machine Actions Status ====================

  async getMachineAction(actionId: string): Promise<any | null> {
    try {
      const response = await this.makeAuthenticatedRequest('GET', `/machineactions/${actionId}`)

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('mde', `Failed to get machine action: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error getting machine action:', error)
      return null
    }
  }

  async listMachineActions(machineId?: string): Promise<any[]> {
    try {
      let endpoint = '/machineactions'
      if (machineId) {
        endpoint += `?$filter=machineId eq '${machineId}'`
      }

      const response = await this.makeAuthenticatedRequest('GET', endpoint)

      if (response.ok) {
        const data = await response.json()
        return data.value || []
      } else {
        throw new ModuleAPIError('mde', `Failed to list machine actions: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error listing machine actions:', error)
      return []
    }
  }
}
