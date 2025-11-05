import {
  BaseModule,
  ModuleInfo,
  HealthStatus,
  ModuleCapability,
  Capability,
  ModuleAPIError,
} from '../_shared/base-module.ts'

export class LimaCharlieModule extends BaseModule {
  private apiKey: string = ''
  private organizationId: string = ''
  private baseUrl: string = 'https://api.limacharlie.io'

  getInfo(): ModuleInfo {
    return {
      name: 'LimaCharlie',
      version: '2.0.0',
      description: 'Full EDR and telemetry management with detection and response capabilities',
      author: 'SOC Dashboard',
      capabilities: [Capability.EDR, Capability.FORENSICS, Capability.AUTOMATION],
      requires_api_key: true,
      status: this.status,
    }
  }

  async initialize(): Promise<boolean> {
    try {
      this.apiKey = this.getConfigValue<string>('api_key', '')
      this.organizationId = this.getConfigValue<string>('organization_id', '')

      if (!this.apiKey || !this.organizationId) {
        console.error('LimaCharlie API key or Organization ID not configured')
        this.status = 'error'
        return false
      }

      const health = await this.healthCheck()
      if (health.status === 'healthy') {
        this.status = 'active'
        this.initialized = true
        console.log('LimaCharlie module initialized successfully')
        return true
      } else {
        this.status = 'error'
        return false
      }
    } catch (error) {
      console.error('Failed to initialize LimaCharlie module:', error)
      this.status = 'error'
      return false
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/orgs`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (response.ok) {
        return {
          status: 'healthy',
          message: 'Connected to LimaCharlie',
          organization: this.organizationId,
        }
      } else {
        return {
          status: 'unhealthy',
          message: `LimaCharlie returned status code ${response.status}`,
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
        name: 'list_sensors',
        description: 'List all sensors in the organization',
        endpoint: '/limacharlie/sensors',
        method: 'GET',
      },
      {
        name: 'get_sensor',
        description: 'Get detailed information about a sensor',
        endpoint: '/limacharlie/sensors/{sensor_id}',
        method: 'GET',
      },
      {
        name: 'isolate_sensor',
        description: 'Isolate a sensor from the network',
        endpoint: '/limacharlie/sensors/{sensor_id}/isolate',
        method: 'POST',
      },
      {
        name: 'list_detections',
        description: 'List detection events',
        endpoint: '/limacharlie/detections',
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

  async listSensors(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/${this.organizationId}/sensors`,
        { headers: this.getHeaders() }
      )

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('limacharlie', `Failed to list sensors: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error listing sensors:', error)
      return []
    }
  }

  async getSensor(sensorId: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/${this.organizationId}/sensors/${sensorId}`,
        { headers: this.getHeaders() }
      )

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('limacharlie', `Failed to get sensor: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error getting sensor:', error)
      return null
    }
  }

  async isolateSensor(sensorId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/${this.organizationId}/sensors/${sensorId}/isolation`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ state: 'isolated' }),
        }
      )
      return response.ok
    } catch (error) {
      console.error('Error isolating sensor:', error)
      return false
    }
  }

  async listDetections(limit: number = 100): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/${this.organizationId}/detections?limit=${limit}`,
        { headers: this.getHeaders() }
      )

      if (response.ok) {
        return await response.json()
      } else {
        throw new ModuleAPIError('limacharlie', `Failed to list detections: ${response.status}`, response.status)
      }
    } catch (error) {
      console.error('Error listing detections:', error)
      return []
    }
  }
}
