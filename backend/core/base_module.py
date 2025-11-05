"""
Base Module Interface for SOC Dashboard
All modules must inherit from this class to ensure consistent API interface
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from enum import Enum


class ModuleStatus(str, Enum):
    """Module status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    INITIALIZING = "initializing"


class ModuleCapability(str, Enum):
    """Module capability types"""
    THREAT_INTELLIGENCE = "threat_intelligence"
    INCIDENT_MANAGEMENT = "incident_management"
    EDR = "edr"
    NETWORK_ANALYSIS = "network_analysis"
    REPUTATION = "reputation"
    FORENSICS = "forensics"
    AUTOMATION = "automation"


class ModuleInfo(BaseModel):
    """Module information model"""
    name: str
    version: str
    description: str
    author: str
    capabilities: List[ModuleCapability]
    requires_api_key: bool
    status: ModuleStatus


class BaseModule(ABC):
    """
    Base class for all SOC Dashboard modules

    Each module must implement:
    - get_info(): Return module metadata
    - initialize(): Set up the module with config
    - health_check(): Verify module is operational
    - get_capabilities(): List what the module can do
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the module

        Args:
            config: Configuration dictionary for the module
        """
        self.config = config or {}
        self.status = ModuleStatus.INITIALIZING
        self._initialized = False

    @abstractmethod
    async def get_info(self) -> ModuleInfo:
        """
        Get module information

        Returns:
            ModuleInfo object with module metadata
        """
        pass

    @abstractmethod
    async def initialize(self) -> bool:
        """
        Initialize the module with provided configuration

        Returns:
            True if initialization successful, False otherwise
        """
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """
        Check if module is healthy and operational

        Returns:
            Dictionary with health status and details
        """
        pass

    @abstractmethod
    async def get_capabilities(self) -> List[Dict[str, Any]]:
        """
        List all capabilities/functions this module provides

        Returns:
            List of capability descriptions with endpoints
        """
        pass

    def is_initialized(self) -> bool:
        """Check if module is initialized"""
        return self._initialized

    def get_status(self) -> ModuleStatus:
        """Get current module status"""
        return self.status

    def get_config_value(self, key: str, default: Any = None) -> Any:
        """
        Get configuration value

        Args:
            key: Configuration key
            default: Default value if key not found

        Returns:
            Configuration value or default
        """
        return self.config.get(key, default)
