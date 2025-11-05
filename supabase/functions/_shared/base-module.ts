/**
 * Base Module Interface for SOC Dashboard Edge Functions
 * All modules must implement this interface for consistency
 */

export interface ModuleInfo {
  name: string
  version: string
  description: string
  author: string
  capabilities: string[]
  requires_api_key: boolean
  status: 'active' | 'inactive' | 'error' | 'initializing'
}

export interface ModuleCapability {
  name: string
  description: string
  endpoint: string
  method: string
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'error'
  message: string
  [key: string]: any
}

export interface ModuleConfig {
  [key: string]: any
}

/**
 * Base Module Class
 * All SOC Dashboard modules extend this class
 */
export abstract class BaseModule {
  protected config: ModuleConfig
  protected status: ModuleInfo['status']
  protected initialized: boolean

  constructor(config: ModuleConfig = {}) {
    this.config = config
    this.status = 'initializing'
    this.initialized = false
  }

  /**
   * Get module information
   */
  abstract getInfo(): ModuleInfo

  /**
   * Initialize the module
   */
  abstract async initialize(): Promise<boolean>

  /**
   * Check if module is healthy and operational
   */
  abstract async healthCheck(): Promise<HealthStatus>

  /**
   * List all capabilities/functions this module provides
   */
  abstract getCapabilities(): ModuleCapability[]

  /**
   * Check if module is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Get current module status
   */
  getStatus(): ModuleInfo['status'] {
    return this.status
  }

  /**
   * Get configuration value
   */
  protected getConfigValue<T>(key: string, defaultValue?: T): T {
    return (this.config[key] as T) ?? (defaultValue as T)
  }

  /**
   * Set configuration value
   */
  protected setConfigValue(key: string, value: any): void {
    this.config[key] = value
  }
}

/**
 * Module capabilities enum
 */
export enum Capability {
  THREAT_INTELLIGENCE = 'threat_intelligence',
  INCIDENT_MANAGEMENT = 'incident_management',
  EDR = 'edr',
  NETWORK_ANALYSIS = 'network_analysis',
  REPUTATION = 'reputation',
  FORENSICS = 'forensics',
  AUTOMATION = 'automation',
}

/**
 * Common error types
 */
export class ModuleError extends Error {
  constructor(
    message: string,
    public module: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ModuleError'
  }
}

export class ModuleInitError extends ModuleError {
  constructor(module: string, message: string) {
    super(message, module, 'INIT_ERROR')
    this.name = 'ModuleInitError'
  }
}

export class ModuleAPIError extends ModuleError {
  constructor(module: string, message: string, public statusCode?: number) {
    super(message, module, 'API_ERROR')
    this.name = 'ModuleAPIError'
  }
}
