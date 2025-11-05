import {
  BaseModule,
  ModuleInfo,
  HealthStatus,
  ModuleCapability,
  Capability,
  ModuleAPIError,
} from '../_shared/base-module.ts'

/**
 * TheHive Integration Module
 * Full incident management and case handling
 */
export class TheHiveModule extends BaseModule {
  private apiUrl: string = ''
  private apiKey: string = ''
  private verifySSL: boolean = true

  getInfo(): ModuleInfo {
    return {
      name: 'TheHive',
      version: '2.0.0',
      description: 'Full incident management and case handling integration with TheHive',
      author: 'SOC Dashboard',
      capabilities: [Capability.INCIDENT_MANAGEMENT, Capability.AUTOMATION],
      requires_api_key: true,
      status: this.status,
    }
  }

  async initialize(): Promise<boolean> {
    try {
      this.apiUrl = this.getConfigValue<string>('api_url', '')
      this.apiKey = this.getConfigValue<string>('api_key', '')
      this.verifySSL = this.getConfigValue<boolean>('verify_ssl', true)

      if (!this.apiUrl || !this.apiKey) {
        console.error('TheHive API URL or API key not configured')
        this.status = 'error'
        return false
      }

      // Test connection
      const health = await this.healthCheck()
      if (health.status === 'healthy') {
        this.status = 'active'
        this.initialized = true
        console.log('TheHive module initialized successfully')
        return true
      } else {
        this.status = 'error'
        return false
      }
    } catch (error) {
      console.error('Failed to initialize TheHive module:', error)
      this.status = 'error'
      return false
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    if (!this.apiUrl || !this.apiKey) {
      return {
        status: 'error',
        message: 'API client not configured',
      }
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/v1/user/current`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (response.ok) {
        return {
          status: 'healthy',
          message: 'Connected to TheHive',
          endpoint: this.apiUrl,
        }
      } else {
        return {
          status: 'unhealthy',
          message: `TheHive returned status code ${response.status}`,
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
      {
        name: 'list_cases',
        description: 'List all cases with optional filters',
        endpoint: '/thehive/cases',
        method: 'GET',
      },
      {
        name: 'get_case',
        description: 'Get detailed information about a specific case',
        endpoint: '/thehive/cases/{case_id}',
        method: 'GET',
      },
      {
        name: 'create_case',
        description: 'Create a new case',
        endpoint: '/thehive/cases',
        method: 'POST',
      },
      {
        name: 'update_case',
        description: 'Update an existing case',
        endpoint: '/thehive/cases/{case_id}',
        method: 'PUT',
      },
      {
        name: 'list_alerts',
        description: 'List all alerts',
        endpoint: '/thehive/alerts',
        method: 'GET',
      },
    ]
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  // Case Management Methods

  async listCases(limit: number = 10, sort: string = '-startDate'): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/query`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query: [{ _name: 'listCase' }],
          range: `0-${limit}`,
          sort: [sort],
        }),
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('thehive', `Failed to list cases: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error listing cases:', error)
      return []
    }
  }

  async getCase(caseId: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/case/${caseId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('thehive', `Failed to get case: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error getting case:', error)
      return null
    }
  }

  async createCase(
    title: string,
    description: string,
    severity: number = 2,
    tlp: number = 2,
    tags: string[] = []
  ): Promise<any | null> {
    try {
      const caseData = {
        title,
        description,
        severity,
        tlp,
        tags,
      }

      const response = await fetch(`${this.apiUrl}/api/v1/case`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(caseData),
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('thehive', `Failed to create case: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error creating case:', error)
      return null
    }
  }

  async updateCase(caseId: string, fields: Record<string, any>): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/case/${caseId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(fields),
      })

      return response.ok
    } catch (error) {
      console.error('Error updating case:', error)
      return false
    }
  }

  async listAlerts(limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/query`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query: [{ _name: 'listAlert' }],
          range: `0-${limit}`,
          sort: ['-date'],
        }),
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('thehive', `Failed to list alerts: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error listing alerts:', error)
      return []
    }
  }
}
